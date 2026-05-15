import { AfterViewInit, Component, ElementRef, Input, Output, EventEmitter, ViewChild } from '@angular/core';

@Component({
  selector: 'app-delete-recipe-modal',
  standalone: true,
  imports: [],
  templateUrl: './delete-recipe-modal.html',
  styleUrl: './delete-recipe-modal.css',
})
export class DeleteRecipeModal implements AfterViewInit {
  @Input() recipeTitle = '';
  @Input() isProcessing = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('dialogRoot') dialogRoot?: ElementRef<HTMLElement>;

  // Sirve para enfocar el primer elemento del modal al abrirlo
  ngAfterViewInit(): void {
    queueMicrotask(() => this.focusFirstElement());
  }

  // Sirve para cancelar al hacer clic en el fondo
  onBackdropClick(): void {
    this.cancelled.emit();
  }

  // Sirve para manejar Escape y atrapar el foco con Tab
  onModalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cancelled.emit();
      return;
    }
    if (event.key !== 'Tab') return;
    this.trapFocus(event);
  }

  // Sirve para enfocar el primer elemento enfocable del modal
  private focusFirstElement(): void {
    const root = this.dialogRoot?.nativeElement;
    if (!root) return;
    const focusable = this.getFocusableElements(root);
    (focusable[0] ?? root).focus();
  }

  // Sirve para mantener el foco dentro del modal al tabular
  private trapFocus(event: KeyboardEvent): void {
    const root = this.dialogRoot?.nativeElement;
    if (!root) return;
    const focusable = this.getFocusableElements(root);
    if (focusable.length === 0) { event.preventDefault(); root.focus(); return; }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
  }

  // Sirve para obtener los elementos enfocables del modal
  private getFocusableElements(root: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
      'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    return Array.from(root.querySelectorAll<HTMLElement>(selector))
      .filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1);
  }
}
