import { Component, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { AuthServices } from '../Services/auth-services';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, NgOptimizedImage],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthServices);
  private router = inject(Router);
  
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  
  loginForm: FormGroup = this.fb.group({
    email: [(this.authService.getRememberedCredentials()?.email ?? ''), [Validators.required, Validators.email]],
    password: [(this.authService.getRememberedCredentials()?.password ?? ''), [Validators.required]],
    rememberMe: [!!this.authService.getRememberedCredentials()]
  });

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    const errors = control.errors;
    if (errors['required']) return 'This field is required';
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters`;
    return 'Unknown error';
  }

  togglePassword() {
    this.showPassword.update(value => !value);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value
    };
    const rememberMe = this.loginForm.get('rememberMe')?.value ?? false;

    this.authService.login(credentials, rememberMe).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = (Object.values(err?.error?.errors ?? {}) as string[][]).flat()[0];
        this.errorMessage.set(msg ?? err?.error?.message ?? 'Login failed. Please try again.');
      }
    });
  }
}
