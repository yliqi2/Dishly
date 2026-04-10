import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { EmailService } from '../../../Core/Services/Email/email.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, NgOptimizedImage],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly emailService = inject(EmailService);

  isLoading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  showResetFields = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  forgotPasswordForm: FormGroup = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      recoveryCode: [''],
      password: [''],
      confirmPassword: [''],
    },
    { validators: this.passwordMatchValidator }
  );

  isFieldInvalid(fieldName: string): boolean {
    const control = this.forgotPasswordForm.get(fieldName);

    if (!control || !control.touched) {
      return false;
    }

    if (fieldName === 'confirmPassword' && this.forgotPasswordForm.hasError('passwordMismatch')) {
      return true;
    }

    return control.invalid;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.forgotPasswordForm.get(fieldName);

    if (!control || !control.touched) {
      return '';
    }

    if (fieldName === 'confirmPassword' && this.forgotPasswordForm.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }

    const errors = control.errors;
    if (!errors) {
      return '';
    }

    if (errors['required']) {
      return 'This field is required';
    }
    if (errors['email']) {
      return 'Please enter a valid email address';
    }
    if (errors['pattern']) {
      return 'Please enter the 6-digit recovery code';
    }
    if (errors['minlength']) {
      return `Minimum ${errors['minlength'].requiredLength} characters`;
    }
    return 'Unknown error';
  }

  togglePassword(): void {
    this.showPassword.update(value => !value);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(value => !value);
  }

  onRecoveryCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '').slice(0, 6);

    input.value = digitsOnly;
    this.forgotPasswordForm.get('recoveryCode')?.setValue(digitsOnly, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.isLoading()) {
      return;
    }

    const emailControl = this.forgotPasswordForm.get('email');

    if (!emailControl || emailControl.invalid) {
      emailControl?.markAsTouched();
      return;
    }

    const email = String(emailControl.value ?? '').trim();
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.showResetFields()) {
      this.submitResetPassword(email);
      return;
    }

    this.sendRecoveryEmail(email);
  }

  private sendRecoveryEmail(email: string): void {
    this.isLoading.set(true);

    this.emailService.sendRecoveryEmail({ email })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message);
          this.enableResetFields();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ?? 'Unable to process your request right now. Please try again later.'
          );
        },
      });
  }

  private submitResetPassword(email: string): void {
    this.enableResetFields();

    this.forgotPasswordForm.get('recoveryCode')?.markAsTouched();
    this.forgotPasswordForm.get('password')?.markAsTouched();
    this.forgotPasswordForm.get('confirmPassword')?.markAsTouched();

    if (
      this.forgotPasswordForm.get('recoveryCode')?.invalid ||
      this.forgotPasswordForm.get('password')?.invalid ||
      this.forgotPasswordForm.get('confirmPassword')?.invalid ||
      this.forgotPasswordForm.hasError('passwordMismatch')
    ) {
      return;
    }

    this.isLoading.set(true);

    this.emailService.resetPassword({
      email,
      recovery_code: String(this.forgotPasswordForm.get('recoveryCode')?.value ?? '').trim(),
      new_password: String(this.forgotPasswordForm.get('password')?.value ?? '').trim(),
      new_password_confirmation: String(this.forgotPasswordForm.get('confirmPassword')?.value ?? '').trim(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message);
          this.showResetFields.set(false);
          this.showPassword.set(false);
          this.showConfirmPassword.set(false);
          this.clearResetFieldValidators();
          this.forgotPasswordForm.reset({
            email: '',
            recoveryCode: '',
            password: '',
            confirmPassword: '',
          });
          this.forgotPasswordForm.markAsPristine();
          this.forgotPasswordForm.markAsUntouched();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ?? 'Unable to reset your password right now. Please try again later.'
          );
        },
      });
  }

  private enableResetFields(): void {
    this.showResetFields.set(true);
    this.forgotPasswordForm.get('recoveryCode')?.setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
    this.forgotPasswordForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.forgotPasswordForm.get('confirmPassword')?.setValidators([Validators.required]);
    this.updateResetFieldValidity();
  }

  private clearResetFieldValidators(): void {
    this.forgotPasswordForm.get('recoveryCode')?.clearValidators();
    this.forgotPasswordForm.get('password')?.clearValidators();
    this.forgotPasswordForm.get('confirmPassword')?.clearValidators();
    this.updateResetFieldValidity();
  }

  private updateResetFieldValidity(): void {
    ['recoveryCode', 'password', 'confirmPassword'].forEach(field => {
      this.forgotPasswordForm.get(field)?.updateValueAndValidity({ emitEvent: false });
    });

    this.forgotPasswordForm.updateValueAndValidity({ emitEvent: false });
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  }
}
