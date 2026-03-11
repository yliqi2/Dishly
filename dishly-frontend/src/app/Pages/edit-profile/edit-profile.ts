import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthServices } from '../auth/Services/auth-services';
import { LucideAngularModule } from 'lucide-angular';
import { toSignal } from '@angular/core/rxjs-interop';

type User = {
  nombre?: string;
  name?: string;
  email?: string;
  created_at?: string;
  icon_path?: string | null;
  updated_at?: string;
  chef?: boolean;
};

@Component({
  selector: 'app-edit-profile',
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditProfile {
  private authService = inject(AuthServices);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('iconInput') iconInput!: ElementRef<HTMLInputElement>;

  protected readonly user = toSignal<User | null>(this.authService.user$, { initialValue: null });
  protected readonly iconPreview = signal<string | null>(null);
  protected readonly isUploadingIcon = signal(false);
  protected readonly uploadError = signal('');
  protected readonly personalError = signal('');
  protected readonly personalSuccess = signal('');
  protected readonly passwordError = signal('');
  protected readonly passwordSuccess = signal('');
  protected readonly deleteError = signal('');
  protected readonly isSavingPersonal = signal(false);
  protected readonly isSavingPassword = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly showCurrentPassword = signal(false);
  protected readonly showNewPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  protected readonly personalForm: FormGroup;
  protected readonly passwordForm: FormGroup;

  constructor() {
    const u = this.authService.getUser() as User | null;
    const displayName = (u?.nombre ?? u?.name ?? '') as string;
    const email = (u?.email ?? '') as string;

    if (u?.icon_path) {
      this.iconPreview.set(this.authService.getAssetUrl(u.icon_path, u.updated_at));
    }

    this.personalForm = this.fb.group({
      username: [displayName, [Validators.required, Validators.maxLength(255)]],
      email: [email, [Validators.required, Validators.email, Validators.maxLength(255)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  protected get displayName(): string {
    const u = this.user();
    return (u?.nombre ?? u?.name ?? 'User') as string;
  }

  protected controlError(scope: 'personal' | 'password', controlName: string): string | null {
    const form = scope === 'personal' ? this.personalForm : this.passwordForm;
    const control = form.get(controlName);
    if (!control || !(control.touched || control.dirty)) return null;
    const errors = control.errors;
    if (!errors) return null;
    if (errors['required']) return 'This field is required.';
    if (errors['email']) return 'Please enter a valid email.';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters.`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} characters.`;
    if (errors['mismatch']) return 'Passwords mismatch.';
    return null;
  }

  protected savePersonalInfo(): void {
    this.personalError.set('');
    this.personalSuccess.set('');
    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      this.personalError.set('Please complete all fields correctly.');
      return;
    }
    const { username, email } = this.personalForm.getRawValue();
    this.isSavingPersonal.set(true);
    this.authService.updatePersonalInfo({ name: (username ?? '').trim(), email: (email ?? '').trim() }).subscribe({
      next: () => {
        this.isSavingPersonal.set(false);
        this.personalSuccess.set('Personal information updated successfully.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingPersonal.set(false);
        const msg =
          err?.error?.errors?.email?.[0] ??
          err?.error?.errors?.name?.[0] ??
          err?.error?.message ??
          "Couldn't update profile.";
        this.personalError.set(msg);
        this.cdr.detectChanges();
      }
    });
  }

  protected savePassword(): void {
    this.passwordError.set('');
    this.passwordSuccess.set('');
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.passwordError.set('Please complete all password fields correctly.');
      return;
    }
    if ((newPassword ?? '') !== (confirmPassword ?? '')) {
      this.passwordForm.get('confirmPassword')?.setErrors({ mismatch: true });
      this.passwordForm.get('confirmPassword')?.markAsTouched();
      return;
    }
    if (!currentPassword?.trim()) {
      this.passwordError.set('Current password is required to set a new password.');
      return;
    }
    this.isSavingPassword.set(true);
    this.authService.updatePassword({ current_password: currentPassword.trim(), new_password: newPassword.trim() }).subscribe({
      next: () => {
        this.isSavingPassword.set(false);
        this.passwordSuccess.set('Password updated successfully.');
        this.resetPasswordForm(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingPassword.set(false);
        const msg =
          err?.error?.errors?.current_password?.[0] ??
          err?.error?.errors?.password?.[0] ??
          err?.error?.message ??
          "Couldn't update password.";
        this.passwordError.set(msg);
        this.cdr.detectChanges();
      }
    });
  }

  protected resetPersonalForm(): void {
    this.personalError.set('');
    this.personalSuccess.set('');
    const u = this.user();
    this.personalForm.reset({
      username: (u?.nombre ?? u?.name ?? '') as string,
      email: (u?.email ?? '') as string
    });
    this.personalForm.markAsPristine();
    this.personalForm.markAsUntouched();
  }

  protected resetPasswordForm(clearMessages = true): void {
    if (clearMessages) {
      this.passwordError.set('');
      this.passwordSuccess.set('');
    }
    this.passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
    this.passwordForm.markAsPristine();
    this.passwordForm.markAsUntouched();
  }

  protected deleteAccount(): void {
    this.deleteError.set('');
    const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (!confirmed) return;
    this.isDeleting.set(true);
    this.authService.deactivateAccount().subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.deleteError.set(err?.error?.errors?.server?.[0] ?? err?.error?.message ?? "Couldn't delete account.");
        this.cdr.detectChanges();
      }
    });
  }

  protected toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword.update((v) => !v);
  }

  protected toggleNewPasswordVisibility(): void {
    this.showNewPassword.update((v) => !v);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  protected openIconPicker(): void {
    this.iconInput.nativeElement.click();
  }

  protected onIconSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file?.type.startsWith('image/')) {
      this.uploadIcon(file);
    } else if (file) {
      this.uploadError.set('Please select a valid image file.');
    }
    (event.target as HTMLInputElement).value = '';
  }

  private uploadIcon(file: File): void {
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.uploadError.set('Icon image must be less than 10MB.');
      return;
    }
    this.uploadError.set('');
    const reader = new FileReader();
    reader.onload = () => {
      this.iconPreview.set(reader.result as string);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);

    this.isUploadingIcon.set(true);
    this.authService.uploadIcon(file).subscribe({
      next: () => {
        const u = this.authService.getUser() as User | null;
        if (u?.icon_path && u?.updated_at) {
          this.iconPreview.set(this.authService.getAssetUrl(u.icon_path, u.updated_at));
        }
        this.isUploadingIcon.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        const errors = err?.error?.errors as Record<string, string[]> | undefined;
        this.uploadError.set(errors?.['icon']?.[0] ?? err?.error?.message ?? "Couldn't upload icon.");
        this.isUploadingIcon.set(false);
        this.cdr.detectChanges();
      }
    });
  }
}
