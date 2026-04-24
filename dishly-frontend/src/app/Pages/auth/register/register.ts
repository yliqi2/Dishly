import { Component, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { AuthServices } from '../../../Core/Services/Auth/auth-services';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, NgOptimizedImage],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthServices);
  private router = inject(Router);
  
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  
  // Sirve para crear el formulario de registro
  registerForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(10)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]]
  }, { validators: this.passwordMatchValidator });

  // Sirve para obtener el control del nombre de usuario
  get username() {
    return this.registerForm.get('username');
  }

  // Sirve para obtener el control del email
  get email() {
    return this.registerForm.get('email');
  }

  // Sirve para obtener el control de la contraseña
  get password() {
    return this.registerForm.get('password');
  }

  // Sirve para obtener el control de la confirmación de la contraseña
  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  // Sirve para validar que las contraseñas coincidan
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  // Sirve para alternar la visibilidad de la contraseña
  togglePassword() {
    this.showPassword.update(value => !value);
  }

  // Sirve para alternar la visibilidad de la confirmación de la contraseña
  toggleConfirmPassword() {
    this.showConfirmPassword.update(value => !value);
  }

  // Sirve para verificar si un campo es inválido
  isFieldInvalid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);

    // Sirve para verificar si el campo es la confirmación de la contraseña
    if (fieldName === 'confirmPassword') {
      return !!(
        (control && control.invalid && control.touched) ||
        (this.registerForm.errors?.['passwordMismatch'] && control?.touched)
      );
    }
    return !!(control && control.invalid && control.touched);
  }

  // Sirve para obtener el mensaje de error de un campo
  getErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (!control || !control.touched) return '';

    // Sirve para verificar si el campo es la confirmación de la contraseña y si las contraseñas no coinciden
    if (fieldName === 'confirmPassword' && this.registerForm.errors?.['passwordMismatch']) {
      return 'Passwords do not match';
    }

    // Sirve para obtener los errores del campo
    const errors = control.errors;
    if (!errors) return '';

    if (errors['required']) return 'This field is required';
    if (errors['requiredTrue']) return 'You must accept the terms and cookie policy';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} characters`;
    if (errors['email']) return 'Invalid email format';
    return 'Unknown error';
  }

  // Sirve para obtener el mensaje de error de registro
  private getRegisterError(err: { error?: { message?: string; errors?: Record<string, string[]> } }): string {
    const msg = (Object.values(err?.error?.errors ?? {}) as string[][]).flat()[0];
    return msg ?? err?.error?.message ?? 'Registration failed. Please try again.';
  }

  // Sirve para enviar el formulario de registro
  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Sirve para obtener los datos del usuario
    const userData = {
      name: this.registerForm.get('username')?.value,
      email: this.registerForm.get('email')?.value,
      password: this.registerForm.get('password')?.value
    };

    // Sirve para enviar el formulario de registro
    this.authService.register(userData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/login'], { queryParams: { verification: 'pending' } });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.getRegisterError(err));
      }
    });
  }
}
