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

  // Sirve para crear el formulario de recuperación de contraseña
  forgotPasswordForm: FormGroup = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      recoveryCode: [''],
      password: [''],
      confirmPassword: [''],
    },
    { validators: this.passwordMatchValidator }
  );

  // Sirve para verificar si un campo es inválido
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

  // Sirve para obtener el mensaje de error de un campo
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

  // Sirve para alternar la visibilidad de la contraseña
  togglePassword(): void {
    this.showPassword.update(value => !value);
  }

  // Sirve para alternar la visibilidad de la confirmación de la contraseña
  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(value => !value);
  }

  // Sirve para manejar el input de código de recuperación
  onRecoveryCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '').slice(0, 6);

    // Sirve para actualizar el valor del input
    input.value = digitsOnly;
    this.forgotPasswordForm.get('recoveryCode')?.setValue(digitsOnly, { emitEvent: false });
  }

  // Sirve para enviar el formulario de recuperación de contraseña
  onSubmit(): void {
    if (this.isLoading()) {
      return;
    }

    // Sirve para obtener el control del email
    const emailControl = this.forgotPasswordForm.get('email');

    // Sirve para verificar si el email es inválido
    if (!emailControl || emailControl.invalid) {
      emailControl?.markAsTouched();
      return;
    }

    // Sirve para obtener el valor del email
    const email = String(emailControl.value ?? '').trim();
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.showResetFields()) {
      this.submitResetPassword(email);
      return;
    }

    this.sendRecoveryEmail(email);
  }

  // Sirve para enviar el email de recuperación de contraseña
  private sendRecoveryEmail(email: string): void {
    this.isLoading.set(true);

    // Sirve para enviar el email de recuperación de contraseña
    this.emailService.sendRecoveryEmail({ email })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          // Sirve para actualizar el mensaje de éxito
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

  // Sirve para enviar el formulario de reseteo de contraseña
  private submitResetPassword(email: string): void {
    // Sirve para habilitar los campos de reseteo de contraseña
    this.enableResetFields();

    this.forgotPasswordForm.get('recoveryCode')?.markAsTouched();
    this.forgotPasswordForm.get('password')?.markAsTouched();
    this.forgotPasswordForm.get('confirmPassword')?.markAsTouched();

    // Sirve para verificar si los campos de reseteo de contraseña son inválidos
    if (
      this.forgotPasswordForm.get('recoveryCode')?.invalid ||
      this.forgotPasswordForm.get('password')?.invalid ||
      this.forgotPasswordForm.get('confirmPassword')?.invalid ||
      this.forgotPasswordForm.hasError('passwordMismatch')
    ) {
      return;
    }

    this.isLoading.set(true);

    // Sirve para enviar el formulario de reseteo de contraseña
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

          // Sirve para resetear el formulario de reseteo de contraseña
          this.forgotPasswordForm.reset({
            email: '',
            recoveryCode: '',
            password: '',
            confirmPassword: '',
          });

          // Sirve para marcar el formulario como limpio y no tocado
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

  // Sirve para habilitar los campos de reseteo de contraseña
  private enableResetFields(): void {
    this.showResetFields.set(true);
    this.forgotPasswordForm.get('recoveryCode')?.setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
    this.forgotPasswordForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.forgotPasswordForm.get('confirmPassword')?.setValidators([Validators.required]);
    this.updateResetFieldValidity();
  }

  // Sirve para limpiar los validadores de los campos de reseteo de contraseña
  private clearResetFieldValidators(): void {
    this.forgotPasswordForm.get('recoveryCode')?.clearValidators();
    this.forgotPasswordForm.get('password')?.clearValidators();
    this.forgotPasswordForm.get('confirmPassword')?.clearValidators();
    this.updateResetFieldValidity();
  }

  // Sirve para actualizar la validez de los campos de reseteo de contraseña
  private updateResetFieldValidity(): void {
    ['recoveryCode', 'password', 'confirmPassword'].forEach(field => {
      this.forgotPasswordForm.get(field)?.updateValueAndValidity({ emitEvent: false });
    });

    this.forgotPasswordForm.updateValueAndValidity({ emitEvent: false });
  }

  // Sirve para validar que las contraseñas coincidan
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  }
}
