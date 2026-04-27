// recipe-chatbot.ts
import { Component, ElementRef, ViewChild, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { RecipeChatbotService } from '../../../Services/recipe-chatbot.service';
import { AuthServices } from '../../../Core/Services/Auth/auth-services';
import { SpoonacularService } from '../../../Core/Services/Spoonacular/spoonacular.service';
import { SpoonacularRecipe } from '../../../Core/Interfaces/Spoonacular';
import { ChatMessage, InternetSearchResult, RecetaData } from '../../../Models/recipe-chatbot.model';

@Component({
  selector: 'app-recipe-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './recipe-chatbot.html',
  styleUrls: ['./recipe-chatbot.css']
})
export class RecipeChatbot implements OnInit {
  private static readonly ENGLISH_INTERNET_TRIGGER = /\bsearch\s+(.+?)\s+on\s+internet\b/iu;
  private static readonly SPANISH_INTERNET_TRIGGER = /\bbusca\s+(.+?)\s+en\s+internet\b/iu;

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

  // Sirve para definir las sugerencias de recetas
  sugerencias: string[] = [
    'Generate a smash burger recipe with crispy onions',
    'Create a quick 20-minute dinner recipe with chicken and rice',
    'I have tomato and cheese, generate a recipe I can cook now',
    'Generate an easy chocolate dessert recipe for 4 people',
    'Create a high-protein breakfast recipe with eggs and oats',
    'Generate a vegetarian pasta recipe under 30 minutes'
  ];

  // Sirve para obtener el nombre de usuario
  protected get currentUserName(): string {
    const user = this.authService.getUser() as Record<string, unknown> | null;
    return String(user?.['nombre'] ?? user?.['name'] ?? 'User');
  }

  // Sirve para obtener la URL del avatar del usuario
  protected get currentUserAvatarUrl(): string | null {
    const user = this.authService.getUser() as Record<string, unknown> | null;
    const iconPath = user?.['icon_path'];
    const updatedAt = user?.['updated_at'];

    if (typeof iconPath !== 'string' || !iconPath) {
      return null;
    }

    return this.authService.getAssetUrl(iconPath, typeof updatedAt === 'string' ? updatedAt : undefined);
  }

  // Sirve para obtener la inicial del usuario
  protected get currentUserInitial(): string {
    return this.currentUserName.charAt(0).toUpperCase();
  }

  // Sirve para obtener la URL de la imagen de la receta
  protected getRecipeImageUrl(path: string | null | undefined): string {
    if (!path) {
      return 'assets/icons/DishlyIcon.webp';
    }

    return this.authService.getAssetUrl(path);
  }

  // Sirve para obtener las imágenes visibles de la receta
  protected getVisibleImages(receta: RecetaData): string[] {
    const rawImages = Array.isArray(receta.imagenes) ? receta.imagenes : [];
    const cleaned = rawImages.filter((path) => typeof path === 'string' && path.trim().length > 0);

    if (cleaned.length > 0) {
      return [this.getRecipeImageUrl(cleaned[0])];
    }

    return [this.getRecipeImageUrl(receta.imagen_principal)];
  }

  // Sirve para inicializar el componente
  ngOnInit() {
    this.addWelcomeMessage();
  }

  // Sirve para agregar el mensaje de bienvenida
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

  // Sirve para enviar el mensaje
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

    // Sirve para extraer la consulta de internet
    const internetQuery = this.extractInternetQuery(textToSend);
    if (internetQuery) {
      await this.sendInternetRecipe(internetQuery);
      this.isLoading.set(false);
      this.scrollToBottom();
      setTimeout(() => this.messageInput?.nativeElement?.focus(), 100);
      return;
    }

    // Sirve para agregar el indicador de escritura
    const typingIndicator: ChatMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: 'Generating your recipe idea...',
      timestamp: new Date(),
      receta: null,
      isTyping: true
    };

    // Sirve para agregar el indicador de escritura
    this.messages.push(typingIndicator);
    this.scrollToBottom();

    // Sirve para enviar la consulta al chatbot
    try {
      const response = await lastValueFrom(this.chatbotService.buscarReceta(textToSend));

      // Sirve para remover el indicador de escritura
      this.messages = this.messages.filter(m => !m.isTyping);

      if (response?.status === 'success') {
        // Sirve para agregar el mensaje del asistente
        const assistantMessage: ChatMessage = {
          id: Date.now(),
          role: 'assistant',
          content: response.receta?.mensaje_chat || response.message || 'I generated a recipe idea for you. If you want, give me more detail and I will refine it.',
          timestamp: new Date(),
          receta: response.receta ?? null
        };

        this.messages.push(assistantMessage);
      } else {
        // Sirve para agregar el mensaje de error
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

      // Sirve para obtener el mensaje de error del backend
      const backendMessage = this.getErrorMessage(error);
      this.messages.push({
        id: Date.now(),
        role: 'assistant',
        content: backendMessage,
        timestamp: new Date(),
        receta: null
      });
    } finally {
      // Sirve para actualizar el estado de carga
      this.isLoading.set(false);
      this.scrollToBottom();
      setTimeout(() => this.messageInput?.nativeElement?.focus(), 100);
    }
  }

  // Sirve para usar una sugerencia de receta
  usarSugerencia(sugerencia: string) {
    this.newMessage = sugerencia.replace(/^[^\p{L}\p{N}]+/u, '').trim();
    this.sendMessage();
  }

  // Sirve para limpiar el chat
  limpiarChat() {
    this.showClearModal = true;
  }

  // Sirve para cancelar la limpieza del chat
  cancelClearChat() {
    this.showClearModal = false;
  }

  // Sirve para confirmar la limpieza del chat
  confirmClearChat() {
    this.messages = [];
    // Sirve para agregar el mensaje de bienvenida
    this.addWelcomeMessage();
    this.showClearModal = false;
  }

  // Sirve para scrollar al final del chat
  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  // Sirve para manejar el presionamiento de la tecla Enter
  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Sirve para obtener el mensaje de error
  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = error.error?.message;

      // Sirve para verificar si el mensaje de error es una cadena de texto
      if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
        return apiMessage;
      }

      // Sirve para verificar si el estado de la respuesta es 0
      if (error.status === 0) {
        return 'I could not reach the AI service just now. Please try again in a moment.';
      }
    }

    return 'Something went wrong while processing your message. Please try again.';
  }

  // Sirve para extraer la consulta de internet
  private extractInternetQuery(message: string): string | null {
    const englishMatch = RecipeChatbot.ENGLISH_INTERNET_TRIGGER.exec(message);
    const spanishMatch = RecipeChatbot.SPANISH_INTERNET_TRIGGER.exec(message);

    const extracted = (englishMatch?.[1] ?? spanishMatch?.[1] ?? '')
      .replace(/\s+/g, ' ')
      .trim();

    return extracted || null;
  }

  // Sirve para enviar la consulta de internet
  private async sendInternetRecipe(query: string): Promise<void> {
    try {
      console.log(query);
      const response = await lastValueFrom(this.spoonacularService.searchRecipes(query, 1));
      const recipe = response.results?.[0];

      if (!recipe) {
        // Sirve para agregar el mensaje de error
        this.messages.push({
          id: Date.now(),
          role: 'assistant',
          content: `I could not find internet results for "${query}". Try a different search.`,
          timestamp: new Date(),
          receta: null
        });
        return;
      }

      // Sirve para agregar el mensaje del asistente
      this.messages.push({
        id: Date.now(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        internetResult: this.buildInternetResult(recipe),
        receta: null
      });
    } catch {
      // Sirve para agregar el mensaje de error
      this.messages.push({
        id: Date.now(),
        role: 'assistant',
        content: 'I could not run the internet search right now. Please try again in a moment.',
        timestamp: new Date(),
        receta: null
      });
    }
  }

  // Sirve para construir el resultado de la búsqueda de internet
  private buildInternetResult(recipe: SpoonacularRecipe): InternetSearchResult {
    // Sirve para remover el HTML del resumen
    const summary = this.removeHtml(recipe.summary ?? '').trim();
    // Sirve para obtener la URL de la fuente
    const source = recipe.sourceUrl || 'https://spoonacular.com/food-api';

    // Sirve para retornar el resultado de la búsqueda de internet
    return {
      title: recipe.title,
      timeText: `${recipe.readyInMinutes || 'N/A'} min`,
      servingsText: String(recipe.servings || 'N/A'),
      summary: summary || undefined,
      sourceUrl: source
    };
  }

  // Sirve para remover el HTML de un valor
  private removeHtml(value: string): string {
    return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

