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
import { DishlySelectComponent, SelectOption } from '../../Core/Components/dishly-select/dishly-select';
import { Breadcrumbs } from '../../Core/Components/breadcrumbs/breadcrumbs';

type DifficultyLevel = 'easy' | 'medium' | 'hard';


@Component({
  selector: 'app-upload',
  imports: [CommonModule, ReactiveFormsModule, DishlySelectComponent, Breadcrumbs],
  templateUrl: './upload.html',
  styleUrl: './upload.css',
})
export class Upload implements OnDestroy, OnInit {
  readonly maxPhotos = 5;
  readonly ingredientUnits = ['g', 'kg', 'mg', 'l', 'ml', 'unit'] as const;
  readonly timeUnitOptions: SelectOption[] = [
    { value: 'minutes', label: 'Minutes' },
    { value: 'hours', label: 'Hours' },
  ];
  readonly ingredientUnitOptions: SelectOption[] = this.ingredientUnits.map(u => ({ value: u, label: u }));

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

  // Sirve para combinar los observables de las fotos y el índice de la foto cubierta
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

  // Sirve para validar que el valor sea un número entero
  private readonly integerValidator = (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v === null || v === '') return null;
    return Number.isInteger(Number(v)) ? null : { integer: true };
  };

  // Sirve para validar que el valor sea un número decimal con hasta 2 decimales
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

  // Sirve para crear el formulario de la página
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

  // Sirve para validar si un campo del formulario es inválido
  isFieldInvalid(fieldName: string, parent?: AbstractControl | null): boolean {
    const control = parent ? parent.get(fieldName) : this.form.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  // Sirve para obtener el mensaje de error de un campo del formulario
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

  // Sirve para obtener el array de ingredientes del formulario
  get ingredientes(): FormArray<FormGroup> {
    return this.form.get('ingredientes') as FormArray<FormGroup>;
  }

  // Sirve para obtener el mensaje de error de los ingredientes del formulario
  getIngredientsErrorMessage(): string {
    if (!this.ingredientes.invalid || !this.ingredientes.touched) {
      return '';
    }
    return 'All ingredient fields must be filled.';
  }

  // Sirve para obtener el número de fotos del formulario
  get photoCount(): number {
    return this.photos$.value.length;
  }

  // Sirve para validar si se puede subir más fotos
  get canUploadMorePhotos(): boolean {
    return this.photoCount < this.maxPhotos;
  }

  // Sirve para aplicar el filtro de categorías
  private applyCategoryFilter(): void {
    const q = this.categorySearch.toLowerCase();
    const all = this.categorias$.value;
    this.filteredCategorias = all.filter((c) => c.nombre.toLowerCase().includes(q));
  }

  // Sirve para validar si una categoría está seleccionada
  isCategorySelected(cat: CategoriaItem): boolean {
    return this.selectedCategories.some(c => c.id_categoria === cat.id_categoria);
  }

  // Sirve para crear un grupo de ingredientes
  private createIngredientGroup(): FormGroup {
    return this.fb.group({
      cantidad: [null, [Validators.required, Validators.min(0.001)]],
      nombre: ['', [Validators.required]],
      unidad: ['g', [Validators.required]],
    });
  }

  // Sirve para agregar un ingrediente al formulario
  addIngredient(): void {
    this.ingredientes.push(this.createIngredientGroup());
  }

  // Sirve para eliminar un ingrediente del formulario
  removeIngredient(index: number): void {
    if (this.ingredientes.length === 1) {
      return;
    }
    this.ingredientes.removeAt(index);
  }

  // Sirve para crear un grupo de pasos
  private createStepGroup(): FormGroup {
    return this.fb.group({
      paso: ['', [Validators.required]],
    });
  }

  // Sirve para obtener el array de pasos del formulario
  get instruccionesArray(): FormArray<FormGroup> {
    return this.form.get('instrucciones') as FormArray<FormGroup>;
  }

  // Sirve para agregar un paso al formulario
  addStep(): void {
    this.instruccionesArray.push(this.createStepGroup());
  }

  // Sirve para eliminar un paso del formulario
  removeStep(index: number): void {
    if (this.instruccionesArray.length === 1) {
      return;
    }
    this.instruccionesArray.removeAt(index);
  }

  // Sirve para establecer la dificultad de la receta
  setDifficulty(level: DifficultyLevel): void {
    this.selectedDifficulty$.next(level);
    this.form.patchValue({ dificultad: level });
  }

  // Sirve para alternar el estado del dropdown de categorías
  toggleCategoryDropdown(): void {
    this.categoryOpen = !this.categoryOpen;
    if (this.categoryOpen) {
      this.categorySearch = '';
      this.applyCategoryFilter();
    }
  }

  // Sirve para cerrar el dropdown de categorías
  closeCategoryDropdown(): void {
    this.categoryOpen = false;
  }

  // Sirve para validar si el foco está fuera del dropdown de categorías
  onCategoryFocusOut(event: FocusEvent): void {
    const wrapper = event.currentTarget as HTMLElement | null;
    const next = event.relatedTarget as Node | null;
    if (!wrapper || (next && wrapper.contains(next))) return;
    this.closeCategoryDropdown();
  }

  // Sirve para buscar una categoría
  onCategorySearch(event: Event): void {
    this.categorySearch = (event.target as HTMLInputElement).value;
    this.applyCategoryFilter();
  }

  // Sirve para seleccionar una categoría
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

  // Sirve para eliminar una categoría
  removeCategory(cat: CategoriaItem): void {
    this.selectedCategories = this.selectedCategories.filter(
      c => c.id_categoria !== cat.id_categoria
    );
    this.form.patchValue({
      categoria: this.selectedCategories.map(c => c.id_categoria)
    });
    this.form.get('categoria')?.markAsTouched();
  }

  // Sirve para validar si se presionó la tecla escape
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.categoryOpen) this.closeCategoryDropdown();
  }

  // Sirve para seleccionar fotos
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

  // Sirve para seleccionar la foto cubierta
  selectCover(index: number): void {
    if (index < 0 || index >= this.photoCount) {
      return;
    }
    this.coverIndex$.next(index);
  }

  // Sirve para validar si la foto es la cubierta
  isCover(index: number): boolean {
    return this.coverIndex$.value === index;
  }

  // Sirve para eliminar una foto
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

  // Sirve para enviar el formulario
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

  // Sirve para cancelar la subida de la receta
  onCancel(): void {
    this.router.navigateByUrl('/recipes');
  }

  // Sirve para resetear el formulario después de una subida exitosa
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

  // Sirve para destruir el componente
  ngOnDestroy(): void {
    for (const item of this.photos$.value) {
      URL.revokeObjectURL(item.url);
    }
  }

  // Sirve para inicializar el componente
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