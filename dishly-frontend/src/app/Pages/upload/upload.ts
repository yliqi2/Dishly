import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { BehaviorSubject, combineLatest, map } from 'rxjs';

type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface UploadPreview {
  file: File;
  url: string;
}

@Component({
  selector: 'app-upload',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upload.html',
  styleUrl: './upload.css',
})
export class Upload implements OnDestroy {
  readonly maxPhotos = 5;

  readonly photos$ = new BehaviorSubject<UploadPreview[]>([]);
  readonly selectedDifficulty$ = new BehaviorSubject<DifficultyLevel>('easy');
  readonly coverIndex$ = new BehaviorSubject<number>(0);
  readonly vm$ = combineLatest([this.photos$, this.coverIndex$]).pipe(
    map(([photos, coverIndex]) => {
      const nonCoverItems = photos
        .map((photo, i) => ({ photo, originalIndex: i }))
        .filter((item) => item.originalIndex !== coverIndex);
      const placeholders = Array.from({
        length: Math.max(0, this.maxPhotos - 1 - nonCoverItems.length),
      });
      return { photos, coverIndex, nonCoverItems, placeholders };
    })
  );
  readonly photosError$ = new BehaviorSubject<boolean>(false);
  readonly submitting$ = new BehaviorSubject<boolean>(false);

  readonly form: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(255)]],
      descripcion: ['', [Validators.required]],
      tiempo_preparacion: [30, [Validators.required, Validators.min(1)]],
      tiempo_preparacion_unidad: ['minutes', [Validators.required]],
      porciones: [4, [Validators.required, Validators.min(1)]],
      dificultad: ['easy', [Validators.required]],
      instrucciones: ['', [Validators.required]],
      ingredientes: this.fb.array([this.createIngredientGroup()]),
    });
  }

  get ingredientes(): FormArray<FormGroup> {
    return this.form.get('ingredientes') as FormArray<FormGroup>;
  }

  get photoCount(): number {
    return this.photos$.value.length;
  }

  get canUploadMorePhotos(): boolean {
    return this.photoCount < this.maxPhotos;
  }

  private createIngredientGroup(): FormGroup {
    return this.fb.group({
      cantidad: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
    });
  }

  addIngredient(): void {
    this.ingredientes.push(this.createIngredientGroup());
  }

  removeIngredient(index: number): void {
    if (this.ingredientes.length === 1) {
      return;
    }

    this.ingredientes.removeAt(index);
  }

  setDifficulty(level: DifficultyLevel): void {
    this.selectedDifficulty$.next(level);
    this.form.patchValue({ dificultad: level });
  }

  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.canUploadMorePhotos) {
      return;
    }

    const current = this.photos$.value;
    const remaining = this.maxPhotos - current.length;
    const picked = Array.from(input.files).slice(0, remaining);
    const mapped = picked.map((file) => ({ file, url: URL.createObjectURL(file) }));

    this.photos$.next([...current, ...mapped]);
    this.photosError$.next(false);
    input.value = '';
  }

  selectCover(index: number): void {
    if (index < 0 || index >= this.photoCount) {
      return;
    }

    this.coverIndex$.next(index);
  }

  isCover(index: number): boolean {
    return this.coverIndex$.value === index;
  }

  removePhoto(index: number): void {
    const current = [...this.photos$.value];
    const target = current[index];
    if (target) {
      URL.revokeObjectURL(target.url);
    }

    current.splice(index, 1);
    this.photos$.next(current);

    const currentCover = this.coverIndex$.value;
    if (current.length === 0) {
      this.coverIndex$.next(0);
      return;
    }

    if (index === currentCover) {
      this.coverIndex$.next(0);
      return;
    }

    if (index < currentCover) {
      this.coverIndex$.next(currentCover - 1);
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.photoCount === 0) {
      this.photosError$.next(true);
    }
    if (this.form.invalid || this.photoCount === 0) {
      return;
    }

    this.submitting$.next(true);

    const photos = this.photos$.value.map((item) => item.file.name);
    const coverIndex = this.coverIndex$.value;
    const cover = photos[coverIndex];
    const orderedPhotos = cover
      ? [cover, ...photos.filter((_, i) => i !== coverIndex)]
      : photos;

    const payload = {
      ...this.form.value,
      imagenes: orderedPhotos,
      portada: cover ?? null,
    };

    console.log('Recipe payload (backend call pending):', payload);
    this.submitting$.next(false);
  }

  ngOnDestroy(): void {
    for (const item of this.photos$.value) {
      URL.revokeObjectURL(item.url);
    }
  }

}
