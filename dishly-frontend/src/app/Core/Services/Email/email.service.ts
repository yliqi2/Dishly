import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '../api-base.service';

@Injectable({
  providedIn: 'root',
})
export class EmailService extends ApiBaseService {
  sendRecoveryEmail(payload: SendRecoveryEmailPayload): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(`${this.apiUrl}/send-email`, payload);
  }

  resetPassword(payload: ResetPasswordPayload): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(`${this.apiUrl}/reset-password`, payload);
  }
}

export type SendRecoveryEmailPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  email: string;
  recovery_code: string;
  new_password: string;
  new_password_confirmation: string;
};

export type EmailResponse = {
  message: string;
};
