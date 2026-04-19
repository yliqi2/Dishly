import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { UploadPreview } from '../../Core/Interfaces/UploadPreview';
import { Categoria } from '../../Core/Services/Categoria/categoria';
import { CategoriaItem } from '../../Core/Interfaces/CategoriaItem';
import { Router } from '@angular/router';

type DifficultyLevel = 'easy' | 'medium' | 'hard';
type TimeUnit = 'minutes' | 'hours';


@Component({
  selector: 'app-upload',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upload.html',
  styleUrl: './upload.css',
})
export class Upload implements OnDestroy, OnInit {
  readonly maxPhotos = 5;
  readonly ingredientUnits = ['g', 'kg', 'mg', 'l', 'ml', 'unit'] as const;

  readonly photos$ = new BehaviorSubject<UploadPreview[]>([]);
  readonly selectedDifficulty$ = new BehaviorSubject<DifficultyLevel>('easy');
  readonly coverIndex$ = new BehaviorSubject<number>(0);
  private readonly categoriaService = inject(Categoria);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  readonly categorias$ = new BehaviorSubject<CategoriaItem[]>([]);

  selectedCategories: CategoriaItem[] = [];
  categoryOpen = false;
  categorySearch = '';
  filteredCategorias: CategoriaItem[] = [];
  timeUnitOpen = false;

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
  readonly submitError$ = new BehaviorSubject<string | null>(null);
  readonly submitSuccess$ = new BehaviorSubject<string | null>(null);

  private readonly integerValidator = (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v === null || v === '') return null;
    return Number.isInteger(Number(v)) ? null : { integer: true };
  };

  private readonly priceValidator = (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v === null || v === '') return null;

    const raw = String(v).trim().replace(',', '.');
    const okFormat = /^\d+(\.\d{1,2})?$/.test(raw);
    if (!okFormat) return { price_invalid: true };

    const n = Number(raw);
    if (n !== n || Math.abs(n) === Infinity) return { price_invalid: true };

    return null;
  };

  readonly form: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(255)]],
      descripcion: ['', [Validators.required]],
      tiempo_preparacion: [30, [Validators.required, Validators.min(1), this.integerValidator]],
      tiempo_preparacion_unidad: ['minutes', [Validators.required]],
      porciones: [4, [Validators.required, Validators.min(1), this.integerValidator]],
      dificultad: ['easy', [Validators.required]],
      instrucciones: this.fb.array([this.createStepGroup()]),
      price: [null, [this.priceValidator]],
      ingredientes: this.fb.array([this.createIngredientGroup(), this.createIngredientGroup()]),
      categoria: [[], [Validators.required]],
    });
  }

  isFieldInvalid(fieldName: string, parent?: AbstractControl | null): boolean {
    const control = parent ? parent.get(fieldName) : this.form.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  getError(fieldName: string, parent?: AbstractControl | null): string {
    const control = parent ? parent.get(fieldName) : this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    if (errors['required']) {
      switch (fieldName) {
        case 'titulo':
          return 'Title is required.';
        case 'descripcion':
          return 'Description is required.';
        case 'tiempo_preparacion':
          return 'Prep time is required.';
        case 'porciones':
          return 'Servings is required.';
        case 'paso':
          return 'This step cannot be empty.';
        case 'categoria':
          return 'Select at least one category.';
        case 'cantidad':
          return 'Required.';
        case 'nombre':
          return 'Ingredient name is required.';
        default:
          return 'This field is required.';
      }
    }

    if (errors['price_invalid']) {
      return 'Please enter a valid price (max 2 decimals).';
    }

    if (errors['maxlength']) {
      return `Maximum ${errors['maxlength'].requiredLength} characters.`;
    }

    if (errors['min']) {
      if (fieldName === 'cantidad') return 'Must be greater than 0.';
      return `Must be at least ${errors['min'].min}.`;
    }

    if (errors['integer']) {
      return 'Must be a whole number.';
    }

    return 'Invalid value.';
  }

  get ingredientes(): FormArray<FormGroup> {
    return this.form.get('ingredientes') as FormArray<FormGroup>;
  }

  getIngredientsErrorMessage(): string {
    if (!this.ingredientes.invalid || !this.ingredientes.touched) {
      return '';
    }
    return 'All ingredient fields must be filled.';
  }

  get photoCount(): number {
    return this.photos$.value.length;
  }

  get canUploadMorePhotos(): boolean {
    return this.photoCount < this.maxPhotos;
  }

  private applyCategoryFilter(): void {
    const q = this.categorySearch.toLowerCase();
    const all = this.categorias$.value;
    this.filteredCategorias = all.filter((c) => c.nombre.toLowerCase().includes(q));
  }

  isCategorySelected(cat: CategoriaItem): boolean {
    return this.selectedCategories.some(c => c.id_categoria === cat.id_categoria);
  }

  private createIngredientGroup(): FormGroup {
    return this.fb.group({
      cantidad: [null, [Validators.required, Validators.min(0.001)]],
      nombre: ['', [Validators.required]],
      unidad: ['g', [Validators.required]],
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

  private createStepGroup(): FormGroup {
    return this.fb.group({
      paso: ['', [Validators.required]],
    });
  }

  get instruccionesArray(): FormArray<FormGroup> {
    return this.form.get('instrucciones') as FormArray<FormGroup>;
  }

  addStep(): void {
    this.instruccionesArray.push(this.createStepGroup());
  }

  removeStep(index: number): void {
    if (this.instruccionesArray.length === 1) {
      return;
    }
    this.instruccionesArray.removeAt(index);
  }

  setDifficulty(level: DifficultyLevel): void {
    this.selectedDifficulty$.next(level);
    this.form.patchValue({ dificultad: level });
  }

  toggleCategoryDropdown(): void {
    this.categoryOpen = !this.categoryOpen;
    if (this.categoryOpen) {
      this.categorySearch = '';
      this.applyCategoryFilter();
    }
  }

  closeCategoryDropdown(): void {
    this.categoryOpen = false;
  }

  onCategoryFocusOut(event: FocusEvent): void {
    const wrapper = event.currentTarget as HTMLElement | null;
    const next = event.relatedTarget as Node | null;
    if (!wrapper || (next && wrapper.contains(next))) return;
    this.closeCategoryDropdown();
  }

  toggleTimeUnitDropdown(): void {
    this.timeUnitOpen = !this.timeUnitOpen;
  }

  closeTimeUnitDropdown(): void {
    this.timeUnitOpen = false;
  }

  setTimeUnit(unit: TimeUnit): void {
    this.form.patchValue({ tiempo_preparacion_unidad: unit });
    this.form.get('tiempo_preparacion_unidad')?.markAsTouched();
    this.closeTimeUnitDropdown();
  }

  onTimeUnitFocusOut(event: FocusEvent): void {
    const wrapper = event.currentTarget as HTMLElement | null;
    const next = event.relatedTarget as Node | null;
    if (!wrapper || (next && wrapper.contains(next))) return;
    this.closeTimeUnitDropdown();
  }

  onCategorySearch(event: Event): void {
    this.categorySearch = (event.target as HTMLInputElement).value;
    this.applyCategoryFilter();
  }

  selectCategory(cat: CategoriaItem): void {
    const exists = this.isCategorySelected(cat);
    if (exists) {
      this.selectedCategories = this.selectedCategories.filter(
        c => c.id_categoria !== cat.id_categoria
      );
    } else {
      this.selectedCategories = [...this.selectedCategories, cat];
    }
    this.form.patchValue({
      categoria: this.selectedCategories.map(c => c.id_categoria)
    });
    this.form.get('categoria')?.markAsTouched();
    this.closeCategoryDropdown();
  }

  removeCategory(cat: CategoriaItem): void {
    this.selectedCategories = this.selectedCategories.filter(
      c => c.id_categoria !== cat.id_categoria
    );
    this.form.patchValue({
      categoria: this.selectedCategories.map(c => c.id_categoria)
    });
    this.form.get('categoria')?.markAsTouched();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.categoryOpen) this.closeCategoryDropdown();
    if (this.timeUnitOpen) this.closeTimeUnitDropdown();
  }

  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.canUploadMorePhotos) {
      return;
    }

    const current = this.photos$.value;
    const remaining = this.maxPhotos - current.length;
    const picked = Array.from(input.files).slice(0, remaining);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validFiles = picked.filter(file => allowedTypes.includes(file.type));

    if (validFiles.length < picked.length) {
      this.submitError$.next('Only PNG, JPG, and WEBP files are allowed.');
    }

    if (validFiles.length === 0) {
      input.value = '';
      return;
    }

    const mapped = validFiles.map((file) => ({ file, url: URL.createObjectURL(file) }));
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
    if (this.submitting$.value) return;

    this.form.markAllAsTouched();
    this.submitError$.next(null);
    this.submitSuccess$.next(null);
    this.photosError$.next(false);

    if (this.photoCount === 0) {
      this.photosError$.next(true);
    }
    if (this.form.invalid || this.photoCount === 0) {
      return;
    }

    this.submitting$.next(true);

    const photos = this.photos$.value.map((item) => item.file);
    const coverIndex = this.coverIndex$.value;
    const cover = photos[coverIndex];
    const orderedPhotos = cover
      ? [cover, ...photos.filter((_, i) => i !== coverIndex)]
      : photos;

    const raw = this.form.getRawValue();
    const formData = new FormData();
    formData.append('titulo', String(raw.titulo ?? '').trim());
    formData.append('descripcion', String(raw.descripcion ?? '').trim());
    const stepsRaw = Array.isArray(raw.instrucciones) ? raw.instrucciones as { paso: string }[] : [];
    const instruccionesText = stepsRaw.map(s => String(s?.paso ?? '').trim()).filter(s => s.length > 0).join('\n');
    formData.append('instrucciones', instruccionesText);
    formData.append('tiempo_preparacion', String(raw.tiempo_preparacion ?? 1));
    formData.append('tiempo_preparacion_unidad', String(raw.tiempo_preparacion_unidad ?? 'minutes'));
    formData.append('dificultad', String(raw.dificultad ?? 'easy'));
    formData.append('porciones', String(raw.porciones ?? 1));

    const priceRaw = raw.price;
    if (priceRaw !== null && priceRaw !== undefined && String(priceRaw).trim() !== '') {
      formData.append('price', String(priceRaw).trim());
    }

    const categorias = Array.isArray(raw.categoria) ? raw.categoria : [];
    categorias.forEach((id: unknown) => {
      formData.append('categorias[]', String(id));
    });

    const ingredientes = Array.isArray(raw.ingredientes) ? raw.ingredientes : [];
    ingredientes.forEach((ing: any, index: number) => {
      formData.append(`ingredientes[${index}][nombre]`, String(ing?.nombre ?? '').trim());
      formData.append(`ingredientes[${index}][cantidad]`, String(ing?.cantidad ?? ''));
      formData.append(`ingredientes[${index}][unidad]`, String(ing?.unidad ?? 'g'));
    });

    orderedPhotos.forEach((file) => {
      formData.append('imagenes[]', file, file.name);
    });

    this.http.post('/api/recetas/upload', formData).subscribe({
      next: () => {
        this.submitSuccess$.next('Recipe uploaded successfully.');
        this.resetFormAfterSuccess();
        this.submitting$.next(false);
        this.router.navigateByUrl('/profile');
      },
      error: (err) => {
        const errors = err?.error?.errors as Record<string, string[]> | undefined;
        const firstError = errors ? Object.values(errors).flat()[0] : null;
        this.submitError$.next(firstError ?? err?.error?.message ?? 'Could not upload recipe.');
        this.submitting$.next(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigateByUrl('/recipes');
  }

  private resetFormAfterSuccess(): void {
    for (const item of this.photos$.value) {
      URL.revokeObjectURL(item.url);
    }

    this.photos$.next([]);
    this.coverIndex$.next(0);
    this.selectedCategories = [];
    this.categorySearch = '';
    this.filteredCategorias = this.categorias$.value;
    this.selectedDifficulty$.next('easy');
    this.form.reset({
      titulo: '',
      descripcion: '',
      tiempo_preparacion: 30,
      tiempo_preparacion_unidad: 'minutes',
      porciones: 4,
      dificultad: 'easy',
      price: null,
      categoria: [],
    });
    this.form.setControl('ingredientes', this.fb.array([this.createIngredientGroup(), this.createIngredientGroup()]));
    this.form.setControl('instrucciones', this.fb.array([this.createStepGroup()]));
  }

  ngOnDestroy(): void {
    for (const item of this.photos$.value) {
      URL.revokeObjectURL(item.url);
    }
  }

  ngOnInit(): void {
    this.categoriaService.getAll().subscribe({
      next: (cats) => {
        this.categorias$.next(cats);
        this.filteredCategorias = cats;
      },
      error: () => {
        this.submitError$.next('Could not load categories.');
      },
    });
  }
}