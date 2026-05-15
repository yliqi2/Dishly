import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-delete-post-modal',
  standalone: true,
  templateUrl: './delete-post-modal.html',
  styleUrl: './delete-post-modal.css',
})
export class DeletePostModal {
  readonly isProcessing = input(false);
  readonly onCancel = output<void>();
  readonly onConfirm = output<void>();

  // Sirve para cancelar la eliminación del post
  protected cancel(): void {
    this.onCancel.emit();
  }

  // Sirve para confirmar la eliminación del post
  protected confirm(): void {
    if (this.isProcessing()) {
      return;
    }
    this.onConfirm.emit();
  }
}
