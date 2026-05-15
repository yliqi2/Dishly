import {
  Component, Input, Output, EventEmitter,
  signal, HostListener, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-dishly-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dishly-select.html',
  styleUrl: './dishly-select.css',
})
export class DishlySelectComponent {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Select...';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  isOpen = signal(false);

  constructor(private el: ElementRef) {}

  // Sirve para mostrar la etiqueta de la opción seleccionada
  get selectedLabel(): string {
    const opt = this.options.find(o => o.value === this.value);
    return opt ? opt.label : this.placeholder;
  }

  // Sirve para saber si se muestra el placeholder
  get isPlaceholderShown(): boolean {
    return this.value === '' || this.value === null || this.value === undefined;
  }

  // Sirve para abrir o cerrar el desplegable
  toggle(): void {
    this.isOpen.update(v => !v);
    this.requestTranslateRefresh();
  }

  // Sirve para seleccionar una opción y emitir el valor
  select(option: SelectOption): void {
    this.valueChange.emit(option.value);
    this.isOpen.set(false);
    this.focusCombobox();
    this.requestTranslateRefresh();
  }

  // Sirve para devolver el foco al combobox tras seleccionar
  private focusCombobox(): void {
    const root = (this.el.nativeElement as HTMLElement).querySelector<HTMLElement>('.dishly-select');
    queueMicrotask(() => root?.focus({ preventScroll: true }));
  }

  // Sirve para manejar teclado en el contenedor del select
  onContainerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      this.isOpen.set(false);
      this.focusCombobox();
      return;
    }
    if (!this.isOpen() && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.isOpen.set(true);
      return;
    }
    if (this.isOpen() && event.key === ' ' && event.target === event.currentTarget) {
      event.preventDefault();
    }
  }

  // Sirve para seleccionar una opción con Enter o espacio
  onOptionKeydown(event: KeyboardEvent, option: SelectOption): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    this.select(option);
  }

  // Sirve para cerrar el desplegable al perder el foco
  onRootFocusOut(event: FocusEvent): void {
    if (!this.isOpen()) return;
    const next = event.relatedTarget as Node | null;
    if (!next || !this.el.nativeElement.contains(next)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:click', ['$event'])
  // Sirve para cerrar el desplegable al hacer clic fuera
  onOutsideClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  // Sirve para refrescar Google Translate tras cambiar la selección
  private requestTranslateRefresh(): void {
    queueMicrotask(() => {
      const doc = globalThis.document;
      if (!doc) return;
      const combo = doc.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (!combo || !combo.value) return;
      combo.dispatchEvent(new Event('change'));
    });
  }
}
