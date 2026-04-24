import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthServices } from '../../Core/Services/Auth/auth-services';
import { LucideAngularModule } from 'lucide-angular';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfirmDeleteModal } from '../../Core/Components/modals/confirm-delete-modal/confirm-delete-modal';
import { Breadcrumbs } from '../../Core/Components/breadcrumbs/breadcrumbs';

// Sirve para definir el tipo de usuario
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
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, ConfirmDeleteModal, Breadcrumbs],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class EditProfile {
  private authService = inject(AuthServices);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  // Sirve para obtener el elemento de entrada del icono
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
  protected readonly showDeleteModal = signal(false);
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

    // Sirve para obtener la URL del icono del usuario
    if (u?.icon_path) {
      this.iconPreview.set(this.authService.getAssetUrl(u.icon_path, u.updated_at));
    }

    // Sirve para crear el formulario de personal info
    this.personalForm = this.fb.group({
      username: [displayName, [Validators.required, Validators.maxLength(255)]],
      email: [email, [Validators.required, Validators.email, Validators.maxLength(255)]]
    });

    // Sirve para crear el formulario de contraseña
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  // Sirve para obtener el nombre de usuario
  protected get displayName(): string {
    const u = this.user();
    return (u?.nombre ?? u?.name ?? 'User') as string;
  }

  // Sirve para obtener el mensaje de error del control
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

  // Sirve para guardar la información personal
  protected savePersonalInfo(): void {
    this.personalError.set('');
    this.personalSuccess.set('');
    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      this.personalError.set('Please complete all fields correctly.');
      return;
    }

    // Sirve para obtener los valores del formulario
    const { username, email } = this.personalForm.getRawValue();
    this.isSavingPersonal.set(true);

    // Sirve para actualizar la información personal
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

  // Sirve para guardar la contraseña
  protected savePassword(): void {
    this.passwordError.set('');
    this.passwordSuccess.set('');

    // Sirve para obtener los valores del formulario
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

    // Sirve para actualizar la contraseña
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

  // Sirve para resetear el formulario de personal info
  protected resetPersonalForm(): void {
    this.personalError.set('');
    this.personalSuccess.set('');
    const u = this.user();

    // Sirve para resetear el formulario de personal info
    this.personalForm.reset({
      username: (u?.nombre ?? u?.name ?? '') as string,
      email: (u?.email ?? '') as string
    });

    this.personalForm.markAsPristine();
    this.personalForm.markAsUntouched();
  }

  // Sirve para resetear el formulario de contraseña
  protected resetPasswordForm(clearMessages = true): void {
    if (clearMessages) {
      this.passwordError.set('');
      this.passwordSuccess.set('');
    }
    this.passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
    this.passwordForm.markAsPristine();
    this.passwordForm.markAsUntouched();
  }

  // Sirve para obtener el contexto de la eliminación de la cuenta
  protected readonly deleteContext = computed(() => ({
    error: () => this.deleteError(),
    isProcessing: () => this.isDeleting(),
    onClose: () => this.closeDeleteModal(),
    onConfirm: () => this.confirmDeleteAccount(),
  }));

  // Sirve para abrir el modal de eliminación de la cuenta
  protected openDeleteModal(): void {
    this.deleteError.set('');
    this.showDeleteModal.set(true);
  }

  // Sirve para cerrar el modal de eliminación de la cuenta
  protected closeDeleteModal(): void {
    this.showDeleteModal.set(false);
  }

  // Sirve para confirmar la eliminación de la cuenta
  protected confirmDeleteAccount(): void {
    this.isDeleting.set(true);

    // Sirve para desactivar la cuenta
    this.authService.deactivateAccount().subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.showDeleteModal.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.deleteError.set(err?.error?.errors?.server?.[0] ?? err?.error?.message ?? "Couldn't delete account.");
        this.cdr.detectChanges();
      }
    });
  }

  // Sirve para eliminar la cuenta
  protected deleteAccount(): void {
    this.openDeleteModal();
  }

  // Sirve para alternar la visibilidad de la contraseña actual
  protected toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword.update((v) => !v);
  }

  // Sirve para alternar la visibilidad de la nueva contraseña
  protected toggleNewPasswordVisibility(): void {
    this.showNewPassword.update((v) => !v);
  }

  // Sirve para alternar la visibilidad de la contraseña de confirmación
  protected toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  // Sirve para abrir el selector de icono
  protected openIconPicker(): void {
    this.iconInput.nativeElement.click();
  }

  // Sirve para seleccionar el icono
  protected onIconSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file?.type.startsWith('image/')) {
      this.uploadIcon(file);
    } else if (file) {
      this.uploadError.set('Please select a valid image file.');
    }
    (event.target as HTMLInputElement).value = '';
  }

  // Sirve para subir el icono
  private uploadIcon(file: File): void {
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.uploadError.set('Icon image must be less than 10MB.');
      return;
    }
    this.uploadError.set('');

    // Sirve para leer el archivo del icono
    const reader = new FileReader();
    reader.onload = () => {
      this.iconPreview.set(reader.result as string);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);

    // Sirve para subir el icono
    this.isUploadingIcon.set(true);
    this.authService.uploadIcon(file).subscribe({
      next: () => {
        // Sirve para obtener el usuario
        const u = this.authService.getUser() as User | null;
        if (u?.icon_path && u?.updated_at) {
          this.iconPreview.set(this.authService.getAssetUrl(u.icon_path, u.updated_at));
        }

        // Sirve para actualizar el estado de subida de icono
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
