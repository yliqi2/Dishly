import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthServices } from '../../../Core/Services/Auth/auth-services';
import { ChefAnimation } from '../../../Core/Components/chef-animation/chef-animation';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink, ChefAnimation],
  templateUrl: './verify-email.html',
  styleUrls: ['./verify-email.css'],
})
export class VerifyEmail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthServices);

  isLoading = signal(true);
  isError = signal(false);
  verificationStatus = signal<'success' | 'already' | 'invalid'>('invalid');
  message = signal('We are verifying your email...');
  redirectLabel = signal('Use the button below when you want to continue.');

  // Sirve para inicializar el componente
  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    const code = this.route.snapshot.queryParamMap.get('code') ?? '';

    // Sirve para verificar si el email o el código son válidos
    if (!email || !code) {
      this.finish('invalid', 'This verification link is invalid or incomplete.');
      return;
    }

    // Sirve para verificar el email
    this.authService.verifyEmail({ email, code }).subscribe({
      next: (response) => {
        this.finish(response.status, response.message);
      },
      error: (err) => {
        this.finish(
          err?.error?.status ?? 'invalid',
          err?.error?.message ?? 'This verification link is invalid or has expired.'
        );
      },
    });
  }

  // Sirve para finalizar la verificación de email
  private finish(status: 'success' | 'already' | 'invalid' | string, message: string): void {
    const normalizedStatus = status === 'success' || status === 'already' ? status : 'invalid';

    // Sirve para actualizar el estado de carga
    this.isLoading.set(false);
    this.verificationStatus.set(normalizedStatus);
    this.isError.set(normalizedStatus === 'invalid');
    
    // Sirve para actualizar el mensaje de verificación
    this.message.set(message);
    this.redirectLabel.set(
      normalizedStatus === 'invalid'
        ? 'You can go to login and request a new verification email if needed.'
        : 'Your account is ready. Continue when you want.'
    );
  }
}
