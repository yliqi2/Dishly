import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly pendingRequests = signal(0);
  readonly isLoading = computed(() => this.pendingRequests() > 0);

  // Sirve para iniciar el contador de peticiones
  start(): void {
    this.pendingRequests.update((count) => count + 1);
  }

  // Sirve para detener el contador de peticiones
  stop(): void {
    this.pendingRequests.update((count) => Math.max(0, count - 1));
  }
}
