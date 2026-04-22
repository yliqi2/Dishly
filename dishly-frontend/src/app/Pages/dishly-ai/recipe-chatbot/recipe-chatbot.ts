// recipe-chatbot.ts
import { Component, ElementRef, ViewChild, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { RecipeChatbotService } from '../../../Services/recipe-chatbot.service';
import { AuthServices } from '../../../Core/Services/Auth/auth-services';
import { ChatMessage, RecetaData } from '../../../Models/recipe-chatbot.model';

@Component({
  selector: 'app-recipe-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-chatbot.html',
  styleUrls: ['./recipe-chatbot.scss']
})
export class RecipeChatbot implements OnInit {
  // ViewChilds
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  // Servicios injectados
  private readonly chatbotService = inject(RecipeChatbotService);
  private readonly authService = inject(AuthServices);

  // Estado con signals
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoading = signal<boolean>(false);

  sugerencias: string[] = [
    'Hi Dishly, what can you do?',
    'I want a smash burger recipe',
    'I need something quick and easy for dinner',
    'I have tomato and cheese, what can I make?',
    'I want a chocolate dessert',
    'Recommend something in under 30 minutes'
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
      return 'assets/placeholder.jpg';
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
      content: 'Hello. I am Dishly AI. I can chat with you about cooking and suggest recipe ideas based on your ingredients, the time you have, or the kind of dish you want. What would you like to make today?',
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

    // Indicador de escritura
    const typingIndicator: ChatMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: 'Thinking about the best answer for you...',
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
          content: response.receta?.mensaje_chat || response.message || 'I have an idea for you. If you want, give me a bit more detail and I will refine it.',
          timestamp: new Date(),
          receta: response.receta ?? null
        };
        this.messages.push(assistantMessage);
      } else {
        this.messages.push({
          id: Date.now(),
          role: 'assistant',
          content: response?.message || 'Sorry, I could not find a recipe that matches your request. Could you try different keywords?',
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
    if (confirm('Do you want to clear this conversation?')) {
      this.messages = [];
      this.addWelcomeMessage();
    }
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
}
