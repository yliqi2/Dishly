import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '../api-base.service';

@Injectable({
  providedIn: 'root',
})
export class EmailService extends ApiBaseService {
  // Sirve para enviar un email de recuperación de contraseña
  sendRecoveryEmail(payload: SendRecoveryEmailPayload): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(`${this.apiUrl}/send-email`, payload);
  }

  // Sirve para resetear la contraseña
  resetPassword(payload: ResetPasswordPayload): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(`${this.apiUrl}/reset-password`, payload);
  }
}

// Sirve para definir la interfaz de la carga útil de envío de email de recuperación de contraseña
export type SendRecoveryEmailPayload = {
  email: string;
};

// Sirve para definir la interfaz de la carga útil de reseteo de contraseña
export type ResetPasswordPayload = {
  email: string;
  recovery_code: string;
  new_password: string;
  new_password_confirmation: string;
};

// Sirve para definir la interfaz de la respuesta de email
export type EmailResponse = {
  message: string;
};
