import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { EmailService } from '../../../Core/Services/Email/email.service';
import { ForgotPassword } from './forgot-password';

describe('ForgotPassword', () => {
  let component: ForgotPassword;
  let fixture: ComponentFixture<ForgotPassword>;
  let emailServiceSpy: jasmine.SpyObj<EmailService>;

  beforeEach(async () => {
    emailServiceSpy = jasmine.createSpyObj<EmailService>('EmailService', ['sendRecoveryEmail', 'resetPassword']);
    emailServiceSpy.sendRecoveryEmail.and.returnValue(of({ message: 'Recovery code sent successfully.' }));
    emailServiceSpy.resetPassword.and.returnValue(of({ message: 'Password reset successfully.' }));

    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EmailService, useValue: emailServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should switch the button to reset password and show the extra fields after sending the recovery email', () => {
    component.forgotPasswordForm.get('email')?.setValue('user@example.com');

    component.onSubmit();
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    const recoveryInput: HTMLInputElement = fixture.nativeElement.querySelector('#recovery-code');
    const passwordInput: HTMLInputElement = fixture.nativeElement.querySelector('#reset-password');
    const confirmPasswordInput: HTMLInputElement = fixture.nativeElement.querySelector('#confirm-password');

    expect(button.disabled).toBeFalse();
    expect(button.textContent).toContain('Reset password');
    expect(recoveryInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(confirmPasswordInput).toBeTruthy();

    recoveryInput.value = '12ab34567';
    recoveryInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.forgotPasswordForm.get('recoveryCode')?.value).toBe('123456');
  });

  it('should submit the reset password request with email, code and new password', () => {
    component.forgotPasswordForm.get('email')?.setValue('user@example.com');

    component.onSubmit();
    fixture.detectChanges();

    component.forgotPasswordForm.patchValue({
      recoveryCode: '123456',
      password: 'newpassword123',
      confirmPassword: 'newpassword123',
    });

    component.onSubmit();

    expect(emailServiceSpy.resetPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      recovery_code: '123456',
      new_password: 'newpassword123',
      new_password_confirmation: 'newpassword123',
    });
  });

  it('should show backend errors inside the status banner area without starting the cooldown', () => {
    emailServiceSpy.sendRecoveryEmail.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 404,
        error: { message: 'No active user was found with that email address.' },
      }))
    );

    component.forgotPasswordForm.get('email')?.setValue('missing@example.com');

    component.onSubmit();
    fixture.detectChanges();

    const banner: HTMLElement = fixture.nativeElement.querySelector('.status-banner.status-banner-error');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');

    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('No active user was found with that email address.');
    expect(button.disabled).toBeFalse();
    expect(emailServiceSpy.resetPassword).not.toHaveBeenCalled();
  });
});
