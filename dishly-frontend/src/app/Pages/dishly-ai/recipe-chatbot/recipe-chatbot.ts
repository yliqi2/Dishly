// recipe-chatbot.ts
import { Component, ElementRef, ViewChild, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
export class RecipeChatbot implements OnInit, OnDestroy {
  // ViewChilds
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;
  
  // Servicios injectados
  private readonly chatbotService = inject(RecipeChatbotService);
  private readonly authService = inject(AuthServices);
  private readonly router = inject(Router);
  
  // Estado con signals
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoading = signal<boolean>(false);
  recetaActual: RecetaData | null = null;
  
  sugerencias: string[] = [
    '🍕 ¿Qué puedo cocinar con pollo?',
    '🥗 Busco una receta fácil y rápida',
    '🍰 Quiero hacer un postre con chocolate',
    '🥘 Receta vegetariana para cenar',
    '🍝 Platos de pasta italianos',
    '🕒 Receta en menos de 30 minutos'
  ];
  
  ngOnInit() {
    this.addWelcomeMessage();
    this.loadHistory();
  }
  
  ngOnDestroy() {
    // Limpieza si fuera necesaria
  }
  
  addWelcomeMessage() {
    this.messages.push({
      id: Date.now(),
      role: 'assistant',
      content: '¡Hola! Soy Dishly AI, tu asistente culinario personal. 🧑‍🍳\n\nPuedo ayudarte a encontrar recetas según tus gustos, ingredientes disponibles o nivel de dificultad. ¿Qué te gustaría cocinar hoy?',
      timestamp: new Date(),
      receta: null
    });
    this.scrollToBottom();
  }
  
  loadHistory() {
    const history = localStorage.getItem('chat_history');
    if (history) {
      try {
        const parsed = JSON.parse(history);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Convertir strings de fecha a objetos Date
          this.messages = parsed.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          this.scrollToBottom();
        }
      } catch (e) {
        console.error('Error loading history', e);
      }
    }
  }
  
  saveHistory() {
    // Solo guardar últimos 50 mensajes
    const toSave = this.messages.slice(-50);
    localStorage.setItem('chat_history', JSON.stringify(toSave));
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
      content: '✍️ Estoy buscando la mejor receta para ti...',
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
      
      if (response && response.status === 'success' && response.receta) {
        const assistantMessage: ChatMessage = {
          id: Date.now(),
          role: 'assistant',
          content: response.receta.mensaje_chat || `¡Encontré esta receta perfecta para ti!\n\n**${response.receta.titulo}**\n\n${response.receta.descripcion}`,
          timestamp: new Date(),
          receta: response.receta
        };
        this.messages.push(assistantMessage);
        this.recetaActual = response.receta;
      } else {
        this.messages.push({
          id: Date.now(),
          role: 'assistant',
          content: response?.message || 'Lo siento, no pude encontrar una receta que coincida con tu búsqueda. ¿Podrías intentar con otras palabras clave?',
          timestamp: new Date(),
          receta: null
        });
      }
    } catch (error) {
      console.error('Error in chatbot service:', error);
      this.messages = this.messages.filter(m => !m.isTyping);
      this.messages.push({
        id: Date.now(),
        role: 'assistant',
        content: '❌ Lo siento, hubo un error de conexión con el servidor de IA. Por favor, intenta de nuevo más tarde.',
        timestamp: new Date(),
        receta: null
      });
    } finally {
      this.isLoading.set(false);
      this.saveHistory();
      this.scrollToBottom();
      setTimeout(() => this.messageInput?.nativeElement?.focus(), 100);
    }
  }
  
  usarSugerencia(sugerencia: string) {
    this.newMessage = sugerencia;
    this.sendMessage();
  }
  
  verRecetaCompleta(recetaId: number) {
    this.router.navigate(['/recipes', recetaId]);
  }
  
  limpiarChat() {
    if (confirm('¿Quieres limpiar todo el historial del chat?')) {
      this.messages = [];
      localStorage.removeItem('chat_history');
      this.addWelcomeMessage();
      this.recetaActual = null;
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
}