import {
  Component, Input, Output, EventEmitter,
  signal, HostListener, ElementRef, OnChanges
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
export class DishlySelectComponent implements OnChanges {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Select...';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  isOpen = signal(false);
  focusedIndex = signal(0);

  constructor(private el: ElementRef) {}

  ngOnChanges(): void {
    if (!this.isOpen()) {
      const idx = this.options.findIndex(o => o.value === this.value);
      this.focusedIndex.set(idx >= 0 ? idx : 0);
    }
  }

  get selectedLabel(): string {
    const opt = this.options.find(o => o.value === this.value);
    return opt ? opt.label : this.placeholder;
  }

  get isPlaceholderShown(): boolean {
    return this.value === '' || this.value === null || this.value === undefined;
  }

  toggle(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      const idx = this.options.findIndex(o => o.value === this.value);
      this.focusedIndex.set(idx >= 0 ? idx : 0);
    }
  }

  select(option: SelectOption): void {
    this.valueChange.emit(option.value);
    this.isOpen.set(false);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen() && (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown')) {
      event.preventDefault();
      this.isOpen.set(true);
      const idx = this.options.findIndex(o => o.value === this.value);
      this.focusedIndex.set(idx >= 0 ? idx : 0);
      return;
    }
    if (!this.isOpen()) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex.update(i => Math.min(i + 1, this.options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.update(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.focusedIndex() >= 0 && this.focusedIndex() < this.options.length) {
          this.select(this.options[this.focusedIndex()]);
        }
        break;
      case 'Escape':
      case 'Tab':
        this.isOpen.set(false);
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
