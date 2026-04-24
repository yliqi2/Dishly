import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { CategoriaItem } from '../../Core/Interfaces/CategoriaItem';
import { RecetaOriginal } from '../../Core/Interfaces/RecetaOriginal';
import { AuthServices } from '../../Core/Services/Auth/auth-services';
import { Categoria } from '../../Core/Services/Categoria/categoria';
import { RecetaDetailsService } from '../../Core/Services/Core/receta-details-service';
import { DishlySelectComponent, SelectOption } from '../../Core/Components/dishly-select/dishly-select';
import { Breadcrumbs } from '../../Core/Components/breadcrumbs/breadcrumbs';

type DifficultyLevel = 'easy' | 'medium' | 'hard';
type EditablePhoto = {
  file: File | null;
  url: string;
  existingPath: string | null;
};


@Component({
  selector: 'app-edit-recipe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DishlySelectComponent, Breadcrumbs],
  templateUrl: './edit-recipe.html',
  styleUrls: ['./edit-recipe.css'],
})
export class EditRecipe implements OnDestroy, OnInit {
  readonly maxPhotos = 5;
  readonly ingredientUnits = ['g', 'kg', 'mg', 'l', 'ml', 'unit'] as const;
  readonly timeUnitOptions: SelectOption[] = [
    { value: 'minutes', label: 'Minutes' },
    { value: 'hours', label: 'Hours' },
  ];
  readonly ingredientUnitOptions: SelectOption[] = this.ingredientUnits.map(u => ({ value: u, label: u }));

  readonly photos$ = new BehaviorSubject<EditablePhoto[]>([]);
  readonly selectedDifficulty$ = new BehaviorSubject<DifficultyLevel>('easy');
  readonly coverIndex$ = new BehaviorSubject<number>(0);
  private readonly categoriaService = inject(Categoria);
  private readonly recetaDetailsService = inject(RecetaDetailsService);
  private readonly authService = inject(AuthServices);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly categorias$ = new BehaviorSubject<CategoriaItem[]>([]);
  readonly loading$ = new BehaviorSubject<boolean>(true);

  selectedCategories: CategoriaItem[] = [];
  categoryOpen = false;
  categorySearch = '';
  filteredCategorias: CategoriaItem[] = [];
  private recipeId: number | null = null;

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
      instrucciones: ['', [Validators.required]],
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
        case 'instrucciones':
          return 'Instructions are required.';
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

  private createIngredientGroup(initial?: { cantidad?: number; nombre?: string; unidad?: string }): FormGroup {
    return this.fb.group({
      cantidad: [initial?.cantidad ?? null, [Validators.required, Validators.min(0.001)]],
      nombre: [initial?.nombre ?? '', [Validators.required]],
      unidad: [initial?.unidad ?? 'g', [Validators.required]],
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

    const mapped = validFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      existingPath: null,
    }));
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
    if (target?.file) {
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
    if (!this.recipeId) {
      this.submitError$.next('Recipe not found.');
      return;
    }

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

    const photos = this.photos$.value;
    const coverIndex = this.coverIndex$.value;
    const cover = photos[coverIndex];
    const orderedPhotos = cover
      ? [cover, ...photos.filter((_, i) => i !== coverIndex)]
      : photos;

    const raw = this.form.getRawValue();
    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('titulo', String(raw.titulo ?? '').trim());
    formData.append('descripcion', String(raw.descripcion ?? '').trim());
    formData.append('instrucciones', String(raw.instrucciones ?? '').trim());
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

    let newImageIndex = 0;
    orderedPhotos.forEach((photo) => {
      if (photo.file) {
        formData.append('imagenes_nuevas[]', photo.file, photo.file.name);
        formData.append('image_order[]', `new:${newImageIndex}`);
        newImageIndex += 1;
        return;
      }

      if (photo.existingPath) {
        formData.append('image_order[]', `existing:${photo.existingPath}`);
      }
    });

    this.http.post(`/api/recetas/${this.recipeId}`, formData).subscribe({
      next: () => {
        this.submitSuccess$.next('Recipe updated successfully.');
        this.submitting$.next(false);
        this.router.navigateByUrl('/profile');
      },
      error: (err) => {
        const errors = err?.error?.errors as Record<string, string[]> | undefined;
        const firstError = errors ? Object.values(errors).flat()[0] : null;
        this.submitError$.next(firstError ?? err?.error?.message ?? 'Could not update recipe.');
        this.submitting$.next(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigateByUrl('/profile');
  }

  ngOnDestroy(): void {
    for (const item of this.photos$.value) {
      if (item.file) {
        URL.revokeObjectURL(item.url);
      }
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

    const routeId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(routeId) || routeId <= 0) {
      this.submitError$.next('Recipe not found.');
      this.loading$.next(false);
      return;
    }

    this.recetaDetailsService.getRecipeById(routeId).subscribe({
      next: (recipe) => {
        const currentUser = this.authService.getUser() as Record<string, unknown> | null;
        const currentUserId = Number(currentUser?.['id_usuario'] ?? 0);
        const currentUserRole = String(currentUser?.['rol'] ?? '');

        if ((!currentUserId || currentUserId !== recipe.id_autor) && currentUserRole !== 'admin') {
          this.submitError$.next('You cannot edit this recipe.');
          this.loading$.next(false);
          this.router.navigateByUrl('/profile');
          return;
        }

        this.recipeId = recipe.id_receta;
        this.populateForm(recipe);
        this.loading$.next(false);
      },
      error: () => {
        this.submitError$.next('Could not load recipe.');
        this.loading$.next(false);
      },
    });
  }

  private populateForm(recipe: RecetaOriginal): void {
    this.selectedCategories = (recipe.categorias ?? []).map((category) => ({
      id_categoria: category.id_categoria,
      nombre: category.nombre,
    }));

    const ingredientGroups = (recipe.ingredientes?.length ? recipe.ingredientes : [
      { cantidad: undefined, nombre: '', unidad: 'g' },
    ]).map((ingredient) => this.createIngredientGroup({
      cantidad: ingredient.cantidad,
      nombre: ingredient.nombre,
      unidad: ingredient.unidad,
    }));

    this.form.setControl('ingredientes', this.fb.array(ingredientGroups));
    this.form.patchValue({
      titulo: recipe.titulo,
      descripcion: recipe.descripcion,
      tiempo_preparacion: recipe.tiempo_preparacion,
      tiempo_preparacion_unidad: recipe.tiempo_preparacion_unidad,
      porciones: recipe.porciones,
      dificultad: recipe.dificultad,
      instrucciones: recipe.instrucciones,
      price: recipe.price,
      categoria: this.selectedCategories.map((category) => category.id_categoria),
    });

    const existingImages = [
      recipe.imagen_1,
      recipe.imagen_2,
      recipe.imagen_3,
      recipe.imagen_4,
      recipe.imagen_5,
    ]
      .filter((imagePath): imagePath is string => !!imagePath)
      .map((imagePath) => ({
        file: null,
        url: this.authService.getAssetUrl(imagePath, recipe.updated_at ?? undefined),
        existingPath: imagePath,
      }));

    this.photos$.next(existingImages);
    this.coverIndex$.next(0);
    this.selectedDifficulty$.next(recipe.dificultad);
    this.submitError$.next(null);
    this.submitSuccess$.next(null);
    this.photosError$.next(false);
  }
}