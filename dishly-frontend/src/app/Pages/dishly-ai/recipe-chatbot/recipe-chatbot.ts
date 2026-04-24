// recipe-chatbot.ts
import { Component, ElementRef, ViewChild, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { RecipeChatbotService } from '../../../Services/recipe-chatbot.service';
import { AuthServices } from '../../../Core/Services/Auth/auth-services';
import { SpoonacularRecipe, SpoonacularService } from '../../../Core/Services/Spoonacular/spoonacular.service';
import { ChatMessage, InternetSearchResult, RecetaData } from '../../../Models/recipe-chatbot.model';

@Component({
  selector: 'app-recipe-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './recipe-chatbot.html',
  styleUrls: ['./recipe-chatbot.css']
})
export class RecipeChatbot implements OnInit {
  private static readonly INTERNET_SEARCH_TRIGGER = /\b(?:search\b[\s\S]*?\bon internet\b|busca\b[\s\S]*?\ben internet\b)\b/iu;

  // ViewChilds
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  // Servicios injectados
  private readonly chatbotService = inject(RecipeChatbotService);
  private readonly authService = inject(AuthServices);
  private readonly spoonacularService = inject(SpoonacularService);

  // Estado con signals
  messages: ChatMessage[] = [];
  newMessage: string = '';
  showClearModal = false;
  isLoading = signal<boolean>(false);

  sugerencias: string[] = [
    'Generate a smash burger recipe with crispy onions',
    'Create a quick 20-minute dinner recipe with chicken and rice',
    'I have tomato and cheese, generate a recipe I can cook now',
    'Generate an easy chocolate dessert recipe for 4 people',
    'Create a high-protein breakfast recipe with eggs and oats',
    'Generate a vegetarian pasta recipe under 30 minutes'
  ];

  protected get currentUserName(): string {
    const user = this.authService.getUser() as Record<string, unknown> | null;
    return String(user?.['nombre'] ?? user?.['name'] ?? 'User');
  }

  protected get currentUserAvatarUrl(): string | null {
    const user = this.authService.getUser() as Record<string, unknown> | null;
    const iconPath = user?.['icon_path'];
    const updatedAt = user?.['updated_at'];

    if (typeof iconPath !== 'string' || !iconPath) {
      return null;
    }

    return this.authService.getAssetUrl(iconPath, typeof updatedAt === 'string' ? updatedAt : undefined);
  }

  protected get currentUserInitial(): string {
    return this.currentUserName.charAt(0).toUpperCase();
  }

  protected getRecipeImageUrl(path: string | null | undefined): string {
    if (!path) {
      return 'assets/icons/DishlyIcon.webp';
    }

    return this.authService.getAssetUrl(path);
  }

  protected getVisibleImages(receta: RecetaData): string[] {
    const rawImages = Array.isArray(receta.imagenes) ? receta.imagenes : [];
    const cleaned = rawImages.filter((path) => typeof path === 'string' && path.trim().length > 0);

    if (cleaned.length > 0) {
      return [this.getRecipeImageUrl(cleaned[0])];
    }

    return [this.getRecipeImageUrl(receta.imagen_principal)];
  }

  ngOnInit() {
    this.addWelcomeMessage();
  }

  addWelcomeMessage() {
    this.messages.push({
      id: Date.now(),
      role: 'assistant',
      content: 'Hello. I am Dishly AI Recipe Generator. Tell me your ingredients, preferred style, available time, or difficulty level, and I will generate a full recipe for you.',
      timestamp: new Date(),
      receta: null
    });
    this.scrollToBottom();
  }

  async sendMessage() {
    if (!this.newMessage.trim() || this.isLoading()) return;

    const textToSend = this.newMessage.trim();
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
      receta: null
    };

    this.messages.push(userMessage);
    this.newMessage = '';
    this.isLoading.set(true);
    this.scrollToBottom();

    const internetQuery = this.extractInternetQuery(textToSend);
    if (internetQuery) {
      await this.sendInternetRecipe(internetQuery);
      this.isLoading.set(false);
      this.scrollToBottom();
      setTimeout(() => this.messageInput?.nativeElement?.focus(), 100);
      return;
    }

    // Indicador de escritura
    const typingIndicator: ChatMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: 'Generating your recipe idea...',
      timestamp: new Date(),
      receta: null,
      isTyping: true
    };
    this.messages.push(typingIndicator);
    this.scrollToBottom();

    try {
      const response = await lastValueFrom(this.chatbotService.buscarReceta(textToSend));

      // Remover indicador de escritura
      this.messages = this.messages.filter(m => !m.isTyping);

      if (response?.status === 'success') {
        const assistantMessage: ChatMessage = {
          id: Date.now(),
          role: 'assistant',
          content: response.receta?.mensaje_chat || response.message || 'I generated a recipe idea for you. If you want, give me more detail and I will refine it.',
          timestamp: new Date(),
          receta: response.receta ?? null
        };
        this.messages.push(assistantMessage);
      } else {
        this.messages.push({
          id: Date.now(),
          role: 'assistant',
          content: response?.message || 'Sorry, I could not generate a recipe that matches your request. Could you try different ingredients or keywords?',
          timestamp: new Date(),
          receta: null
        });
      }
    } catch (error) {
      console.error('Error in chatbot service:', error);
      this.messages = this.messages.filter(m => !m.isTyping);

      const backendMessage = this.getErrorMessage(error);
      this.messages.push({
        id: Date.now(),
        role: 'assistant',
        content: backendMessage,
        timestamp: new Date(),
        receta: null
      });
    } finally {
      this.isLoading.set(false);
      this.scrollToBottom();
      setTimeout(() => this.messageInput?.nativeElement?.focus(), 100);
    }
  }

  usarSugerencia(sugerencia: string) {
    this.newMessage = sugerencia.replace(/^[^\p{L}\p{N}]+/u, '').trim();
    this.sendMessage();
  }

  limpiarChat() {
    this.showClearModal = true;
  }

  cancelClearChat() {
    this.showClearModal = false;
  }

  confirmClearChat() {
    this.messages = [];
    this.addWelcomeMessage();
    this.showClearModal = false;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = error.error?.message;

      if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
        return apiMessage;
      }

      if (error.status === 0) {
        return 'I could not reach the AI service just now. Please try again in a moment.';
      }
    }

    return 'Something went wrong while processing your message. Please try again.';
  }

  private extractInternetQuery(message: string): string | null {
    if (!RecipeChatbot.INTERNET_SEARCH_TRIGGER.test(message)) {
      return null;
    }

    const normalizedMessage = message.trim();
    const englishQuery = normalizedMessage.match(/\bsearch\b([\s\S]*?)\bon internet\b/iu);
    const spanishQuery = normalizedMessage.match(/\bbusca\b([\s\S]*?)\ben internet\b/iu);
    const extractedQuery = (englishQuery?.[1] ?? spanishQuery?.[1] ?? '')
      .replace(/\s+/g, ' ')
      .trim();

    return extractedQuery || 'easy recipe';
  }

  private async sendInternetRecipe(query: string): Promise<void> {
    try {
      const response = await lastValueFrom(this.spoonacularService.searchRecipes(query, 1));
      const recipe = response.results?.[0];

      if (!recipe) {
        this.messages.push({
          id: Date.now(),
          role: 'assistant',
          content: `I could not find internet results for "${query}". Try a different search.`,
          timestamp: new Date(),
          receta: null
        });
        return;
      }

      this.messages.push({
        id: Date.now(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        internetResult: this.buildInternetResult(recipe),
        receta: null
      });
    } catch {
      this.messages.push({
        id: Date.now(),
        role: 'assistant',
        content: 'I could not run the internet search right now. Please try again in a moment.',
        timestamp: new Date(),
        receta: null
      });
    }
  }

  private buildInternetResult(recipe: SpoonacularRecipe): InternetSearchResult {
    const summary = this.removeHtml(recipe.summary ?? '').trim();
    const source = recipe.sourceUrl || 'https://spoonacular.com/food-api';

    return {
      title: recipe.title,
      timeText: `${recipe.readyInMinutes || 'N/A'} min`,
      servingsText: String(recipe.servings || 'N/A'),
      summary: summary || undefined,
      sourceUrl: source
    };
  }

  private removeHtml(value: string): string {
    return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

