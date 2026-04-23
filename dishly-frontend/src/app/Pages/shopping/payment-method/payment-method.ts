import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { CartService } from '../../../Core/Services/Cart/cart.service';
import { PurchasedItemSummary } from '../../../Core/Interfaces/PayCartResponse';
import { ChefAnimation } from '../../../Core/Components/chef-animation/chef-animation';

@Component({
  selector: 'app-payment-method',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ChefAnimation],
  templateUrl: './payment-method.html',
  styleUrl: './payment-method.css',
})
export class PaymentMethod {
  private fb = new FormBuilder();
  private readonly cartService = inject(CartService);

  protected readonly paid = signal(false);
  protected readonly flipped = signal(false);
  protected readonly processingPayment = signal(false);
  protected readonly paymentError = signal<string | null>(null);
  protected readonly purchasedItems = signal<PurchasedItemSummary[]>([]);
  protected readonly invoiceTotal = signal<number>(0);

  protected form: FormGroup = this.fb.group({
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d{4} \d{4} \d{4} \d{4}$/)]],
    cardHolder: ['', [Validators.required, Validators.minLength(2)]],
    expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/), this.expiryNotPast]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]]
  });

  private expiryNotPast(control: AbstractControl): { [key: string]: boolean } | null {
    const value: string = control.value;
    if (!value || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) return null;
    const [month, year] = value.split('/').map(Number);
    const now = new Date();
    const expDate = new Date(2000 + year, month - 1, 1);
    return expDate < new Date(now.getFullYear(), now.getMonth(), 1)
      ? { expired: true }
      : null;
  }

  protected get displayNumber(): string {
    const v = this.form.get('cardNumber')?.value || '';
    return v || '•••• •••• •••• ••••';
  }

  protected get displayHolder(): string {
    return this.form.get('cardHolder')?.value || 'YOUR NAME';
  }

  protected get displayExpiry(): string {
    return this.form.get('expiry')?.value || 'MM/YY';
  }

  protected get displayCvv(): string {
    const v = this.form.get('cvv')?.value || '';
    return v ? '•'.repeat(v.length) : '•••';
  }

  protected onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '').slice(0, 16);
    const groups = digits.match(/.{1,4}/g) || [];
    const formatted = groups.join(' ');
    this.form.get('cardNumber')?.setValue(formatted, { emitEvent: false });
    input.value = formatted;
  }

  protected onExpiryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '').slice(0, 4);
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
    this.form.get('expiry')?.setValue(formatted, { emitEvent: false });
    this.form.get('expiry')?.updateValueAndValidity();
    input.value = formatted;
  }

  protected onCvvFocus(): void {
    this.flipped.set(true);
  }

  protected onCvvBlur(): void {
    this.flipped.set(false);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.processingPayment.set(true);
    this.paymentError.set(null);

    this.cartService.payCart().subscribe({
      next: (response) => {
        this.purchasedItems.set(response.purchased_items ?? []);
        this.invoiceTotal.set(Number(response.invoice_total ?? 0));
        this.paid.set(true);
        this.processingPayment.set(false);
      },
      error: (error) => {
        const serverMessage = error?.error?.message as string | undefined;
        this.paymentError.set(serverMessage ?? 'Could not process payment. Please try again.');
        this.processingPayment.set(false);
      },
    });
  }

  protected hasError(field: string, error?: string): boolean {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.touched) return false;
    return error ? ctrl.hasError(error) : ctrl.invalid;
  }
}
