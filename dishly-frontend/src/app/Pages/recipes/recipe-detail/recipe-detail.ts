import { Component, OnInit, inject, ChangeDetectorRef, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ReviewService } from '../../../Core/Services/Recipes/review.service';
import { AuthServices } from '../../../Core/Services/Auth/auth-services';
import { CartService } from '../../../Core/Services/Cart/cart.service';
import { RecetaDetailsService } from '../../../Core/Services/Core/receta-details-service';
import { RecetaOriginal } from '../../../Core/Interfaces/RecetaOriginal';
import { Review } from '../../../Core/Interfaces/Review';
import { DeleteReviewModal } from '../../../Core/Components/modals/delete-review-modal/delete-review-modal';
import { DishlySelectComponent, SelectOption } from '../../../Core/Components/dishly-select/dishly-select';
import { Breadcrumbs } from '../../../Core/Components/breadcrumbs/breadcrumbs';

type ReviewSortOption = 'latest' | 'highest' | 'lowest';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule, RouterLink, DeleteReviewModal, DishlySelectComponent, Breadcrumbs],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.css',
})
export class RecipeDetail implements OnInit {
  recipe: RecetaOriginal | null = null;
  error: string | null = null;

  thumbnails: string[] = [];
  instructions: string[] = [];

  selectedThumbnailIndex = 0;
  mainImageSlideLeftSrc = '';
  mainImageSlideRightSrc = '';
  mainImageSlideTransform = 'translateX(0)';
  mainImageSlideNoTransition = true;
  private mainImageSlideTransitioning = false;
  private readonly mainImageSlideDurationMs = 480;
  userRating = 0;
  hoverRating = 0;
  isLocked = false;

  private reviewService = inject(ReviewService);
  private authService = inject(AuthServices);
  private cartService = inject(CartService);
  private recetaService = inject(RecetaDetailsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  reviews: Review[] = [];
  readonly reviewsPerPage = 5;
  currentReviewPage = 1;
  reviewSort: ReviewSortOption = 'latest';
  readonly reviewSortOptions: SelectOption[] = [
    { value: 'latest', label: 'Latest reviews' },
    { value: 'highest', label: 'Highest rated' },
    { value: 'lowest', label: 'Lowest rated' },
  ];
  reviewComment = '';
  submitError: string | null = null;
  cartNotice: string | null = null;
  submitting = false;
  editingReviewId: number | null = null;
  editingComment = '';
  editingRating = 0;
  editingHoverRating = 0;
  isInCart = false;
  hasPurchased = false;
  reviewToDelete: Review | null = null;
  isDeletingReview = false;
  private currentUserId: number | null = null;
  private currentUserRole: string | null = null;
  private currentUserIconPath: string | null = null;
  private currentUserUpdatedAt: string | null = null;
  private readonly reviewChanges = signal(0);

  // Sirve para obtener la calificación promedio de las reseñas
  readonly reviewAverageSignal = computed(() => {
    this.reviewChanges();

    if (this.reviews.length === 0) {
      return Number(this.recipe?.media_valoraciones ?? 0);
    }

    const total = this.reviews.reduce((sum, review) => sum + Number(review.puntuacion || 0), 0);
    return total / this.reviews.length;
  });

  // Sirve para inicializar el componente
  ngOnInit(): void {
    const user = this.authService.getUser() as {
      id_usuario?: number;
      rol?: string | null;
      icon_path?: string | null;
      updated_at?: string | null;
    } | null;
    this.currentUserId = user?.id_usuario ?? null;
    this.currentUserRole = user?.rol ?? null;
    this.currentUserIconPath = user?.icon_path ?? null;
    this.currentUserUpdatedAt = user?.updated_at ?? null;

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID de receta no encontrado.';
      return;
    }

    this.recetaService.getRecipeById(id).subscribe({
      next: (data) => {
        if (data.active === false && !data.purchased) {
          this.error = 'This recipe is no longer available.';
          this.cdr.detectChanges();
          return;
        }

        this.recipe = data;
        sessionStorage.setItem(`dishly.recipeTitle.${data.id_receta}`, data.titulo);
        this.hasPurchased = Boolean(data.purchased);
        this.thumbnails = this.computeThumbnails(data);
        this.selectedThumbnailIndex = 0;
        this.syncMainImageSlideUrls();
        this.instructions = this.computeInstructions(data.instrucciones);
        this.isInCart = this.cartService.hasRecipe(data.id_receta);
        this.cdr.detectChanges();

        if (this.authService.isAuthenticated()) {
          this.cartService.loadCart().subscribe({
            next: (items) => {
              this.isInCart = items.some((item) => item.id_receta === data.id_receta);
              this.cdr.detectChanges();
            }
          });
        }

        this.loadReviews();
        this.checkAccess(id);
      },
      error: (err) => {
        console.error('Error al cargar la receta:', err);
        this.error = 'The recipe failed to load.';
        this.cdr.detectChanges();
      }
    });
  }

  // Sirve para calcular las miniaturas de la receta
  private computeThumbnails(r: RecetaOriginal): string[] {
    const thumbs: string[] = [];

    const addImage = (path: string | null) => {
      if (!path) return;
      thumbs.push(this.authService.getAssetUrl(path, r.updated_at ?? undefined));
    };

    addImage(r.imagen_1);
    addImage(r.imagen_2);
    addImage(r.imagen_3);
    addImage(r.imagen_4);
    addImage(r.imagen_5);

    if (thumbs.length === 0) thumbs.push('assets/icons/DishlyIcon.webp');
    return thumbs;
  }

  // Sirve para calcular las instrucciones de la receta
  private computeInstructions(text: string): string[] {
    if (!text) return [];
    return text
      .split('\n')
      .map(s => s.trim().replace(/^\d+\.\s*/, ''))
      .filter(s => s.length > 0);
  }

  // Sirve para obtener el tiempo de preparación de la receta
  getTimeLabel(): string {
    if (!this.recipe) return '';
    const unit = this.recipe.tiempo_preparacion_unidad === 'hours' ? 'h' : 'min';
    return `${this.recipe.tiempo_preparacion} ${unit}`;
  }

  // Sirve para obtener el precio de la receta
  getDisplayPrice(): string {
    if (!this.recipe || this.recipe.price === null || this.recipe.price === undefined) return 'Free';
    const value = Number(this.recipe.price);
    return Number.isFinite(value) && value > 0 ? `${value.toFixed(2)}€` : 'Free';
  }

  // Sirve para obtener la fecha de publicación de la receta
  getPublishedDate(): string {
    if (!this.recipe?.fecha_creacion) return '';
    const date = new Date(this.recipe.fecha_creacion);
    if (Number.isNaN(date.getTime())) return this.recipe.fecha_creacion;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Sirve para obtener la URL del avatar del autor de la receta
  getAuthorAvatarUrl(): string | null {
    if (this.recipe?.autor_icon_path) {
      return this.authService.getAssetUrl(this.recipe.autor_icon_path, this.recipe.autor_updated_at ?? undefined);
    }

    if (
      this.recipe &&
      this.currentUserId !== null &&
      this.recipe.id_autor === this.currentUserId &&
      this.currentUserIconPath
    ) {
      return this.authService.getAssetUrl(this.currentUserIconPath, this.currentUserUpdatedAt ?? undefined);
    }

    return null;
  }

  // Sirve para obtener la URL del avatar del autor de la reseña
  getReviewAvatarUrl(review: Review): string | null {
    if (review.autor_icon_path) {
      return this.authService.getAssetUrl(review.autor_icon_path, review.autor_updated_at ?? undefined);
    }

    if (
      this.currentUserId !== null &&
      review.id_usuario === this.currentUserId &&
      this.currentUserIconPath
    ) {
      return this.authService.getAssetUrl(this.currentUserIconPath, this.currentUserUpdatedAt ?? undefined);
    }

    return null;
  }

  // Sirve para obtener el número de barras de dificultad
  getDifficultyBars(): number {
    if (!this.recipe) return 1;
    switch (this.recipe.dificultad) {
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 1;
    }
  }

  // Sirve para obtener la etiqueta de dificultad
  getDifficultyLabel(): string {
    if (!this.recipe) return '';
    switch (this.recipe.dificultad) {
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
      default: return this.recipe.dificultad;
    }
  }

  // Sirve para validar si la receta es premium
  isPremium(): boolean {
    if (!this.recipe || this.recipe.price === null || this.recipe.price === undefined) return false;
    const value = Number(this.recipe.price);
    return Number.isFinite(value) && value > 0;
  }

  // Sirve para validar si el usuario es administrador
  isAdminUser(): boolean {
    return this.currentUserRole === 'admin';
  }

  // Sirve para verificar el acceso a la receta
  private checkAccess(id: string): void {
    if (!this.recipe) return;

    if (this.isAdminUser()) {
      this.hasPurchased = true;
      this.isLocked = false;
      this.cdr.detectChanges();
      return;
    }

    if (this.isPremium()) {
      if (typeof this.recipe.purchased === 'boolean') {
        this.hasPurchased = this.recipe.purchased;
        this.isLocked = !this.recipe.purchased;
        this.cdr.detectChanges();
        return;
      }

      // Sirve para validar si la receta está bloqueada
      this.isLocked = true;
      if (this.authService.isAuthenticated()) {
        this.recetaService.checkPurchase(id).subscribe({
          next: (res) => {
            this.hasPurchased = res.purchased;
            this.isLocked = !res.purchased;
            this.cdr.detectChanges();
          }
        });
      }
    } else {
      this.hasPurchased = false;
      this.isLocked = false;
    }
  }

  // Sirve para validar si la receta tiene múltiples imágenes
  hasMultipleImages(): boolean {
    return this.thumbnails.length > 1;
  }

  // Sirve para agregar la receta al carrito
  addToCart(): void {
    if (!this.recipe || !this.isPremium()) {
      return;
    }

    if (this.hasPurchased) {
      this.cartNotice = 'You already own this recipe.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isInCart) {
      this.router.navigate(['/cart']);
      return;
    }

    this.cartService.addRecipe(this.recipe).subscribe({
      next: (result) => {
        this.isInCart = result.added || result.duplicate;
        this.cartNotice = result.added ? null : 'This recipe is already in your cart.';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cartNotice = err?.error?.message ?? 'Could not add this recipe to your cart.';
        this.cdr.detectChanges();
      }
    });
  }

  // Sirve para obtener las miniaturas visibles
  visibleThumbnails(): string[] {
    return this.hasMultipleImages() ? this.thumbnails.slice(0, 5) : this.thumbnails;
  }

  // Sirve para obtener el número de miniaturas ocultas
  hiddenThumbnailsCount(): number {
    return Math.max(0, this.thumbnails.length - 5);
  }

  // Sirve para validar si la miniatura es la de resumen
  isSummaryThumbnail(index: number): boolean {
    return this.hiddenThumbnailsCount() > 0 && index === 4;
  }

  // Sirve para seleccionar una miniatura
  selectThumbnail(index: number): void {
    if (index === this.selectedThumbnailIndex) return;
    if (!this.hasMultipleImages()) {
      this.selectedThumbnailIndex = index;
      this.syncMainImageSlideUrls();
      this.cdr.detectChanges();
      return;
    }
    const from = this.selectedThumbnailIndex;
    const to = index;
    const direction: 'next' | 'prev' = to > from ? 'next' : 'prev';
    this.startMainImageSlide(from, to, direction);
  }

  // Sirve para seleccionar la imagen anterior
  prevImage(): void {
    if (!this.hasMultipleImages()) {
      return;
    }
    const n = this.thumbnails.length;
    const from = this.selectedThumbnailIndex;
    const to = from > 0 ? from - 1 : n - 1;
    this.startMainImageSlide(from, to, 'prev');
  }

  // Sirve para seleccionar la imagen siguiente
  nextImage(): void {
    if (!this.hasMultipleImages()) {
      return;
    }
    const n = this.thumbnails.length;
    const from = this.selectedThumbnailIndex;
    const to = from < n - 1 ? from + 1 : 0;
    this.startMainImageSlide(from, to, 'next');
  }

  // Sirve para sincronizar las URLs de las imágenes principales
  private syncMainImageSlideUrls(): void {
    const src = this.thumbnails[this.selectedThumbnailIndex] ?? 'assets/icons/DishlyIcon.webp';
    this.mainImageSlideLeftSrc = src;
    this.mainImageSlideRightSrc = src;
    this.mainImageSlideTransform = 'translateX(0)';
    this.mainImageSlideNoTransition = true;
  }

  // Sirve para iniciar el slide de la imagen principal
  private startMainImageSlide(from: number, to: number, direction: 'next' | 'prev'): void {
    if (!this.hasMultipleImages() || from === to) {
      return;
    }
    if (this.mainImageSlideTransitioning) {
      return;
    }
    this.mainImageSlideTransitioning = true;

    if (direction === 'next') {
      this.mainImageSlideLeftSrc = this.thumbnails[from] ?? '';
      this.mainImageSlideRightSrc = this.thumbnails[to] ?? '';
      this.mainImageSlideNoTransition = true;
      this.mainImageSlideTransform = 'translateX(0)';
      this.cdr.detectChanges();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.mainImageSlideNoTransition = false;
          this.mainImageSlideTransform = 'translateX(-50%)';
          this.cdr.detectChanges();
          window.setTimeout(() => this.finishMainImageSlide(to), this.mainImageSlideDurationMs);
        });
      });
    } else {
      this.mainImageSlideLeftSrc = this.thumbnails[to] ?? '';
      this.mainImageSlideRightSrc = this.thumbnails[from] ?? '';
      this.mainImageSlideNoTransition = true;
      this.mainImageSlideTransform = 'translateX(-50%)';
      this.cdr.detectChanges();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.mainImageSlideNoTransition = false;
          this.mainImageSlideTransform = 'translateX(0)';
          this.cdr.detectChanges();
          window.setTimeout(() => this.finishMainImageSlide(to), this.mainImageSlideDurationMs);
        });
      });
    }
  }

  // Sirve para finalizar el slide de la imagen principal
  private finishMainImageSlide(to: number): void {
    this.selectedThumbnailIndex = to;
    const src = this.thumbnails[to] ?? 'assets/icons/DishlyIcon.webp';
    this.mainImageSlideNoTransition = true;
    this.mainImageSlideLeftSrc = src;
    this.mainImageSlideRightSrc = src;
    this.mainImageSlideTransform = 'translateX(0)';
    this.cdr.detectChanges();
    this.mainImageSlideTransitioning = false;
  }

  setRating(rating: number): void { this.userRating = rating; }
  setHoverRating(rating: number): void { this.hoverRating = rating; }
  setEditRating(rating: number): void { this.editingRating = rating; }
  setEditHoverRating(rating: number): void { this.editingHoverRating = rating; }

  // Sirve para obtener el número de páginas de reseñas
  get totalReviewPages(): number {
    return Math.max(1, Math.ceil(this.reviews.length / this.reviewsPerPage));
  }

  // Sirve para obtener la calificación promedio de las reseñas
  get reviewAverage(): number {
    this.reviewChanges();

    if (this.reviews.length === 0) {
      return Number(this.recipe?.media_valoraciones ?? 0);
    }

    const total = this.reviews.reduce((sum, review) => sum + Number(review.puntuacion || 0), 0);
    return total / this.reviews.length;
  }

  // Sirve para obtener las reseñas ordenadas
  get sortedReviews(): Review[] {
    const ownReviews: Review[] = [];
    const otherReviews: Review[] = [];

    for (const review of this.reviews) {
      if (this.isOwnReview(review)) {
        ownReviews.push(review);
      } else {
        otherReviews.push(review);
      }
    }

    ownReviews.sort((a, b) => this.compareReviewsBySort(a, b));
    otherReviews.sort((a, b) => this.compareReviewsBySort(a, b));

    return [...ownReviews, ...otherReviews];
  }

  // Sirve para comparar las reseñas por el criterio de ordenamiento
  private compareReviewsBySort(a: Review, b: Review): number {
    switch (this.reviewSort) {
      // Sirve para comparar las reseñas por la puntuación más alta
      case 'highest': {
        const scoreDiff = b.puntuacion - a.puntuacion;
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      }
      // Sirve para comparar las reseñas por la puntuación más baja
      case 'lowest': {
        const scoreDiff = a.puntuacion - b.puntuacion;
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      }
      // Sirve para comparar las reseñas por la fecha más reciente
      case 'latest':
      default: {
        const dateDiff = new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        if (dateDiff !== 0) return dateDiff;
        return b.id_valoracion - a.id_valoracion;
      }
    }
  }

  // Sirve para obtener las reseñas paginadas
  get paginatedReviews(): Review[] {
    const start = (this.currentReviewPage - 1) * this.reviewsPerPage;
    return this.sortedReviews.slice(start, start + this.reviewsPerPage);
  }

  // Sirve para validar si hay paginación de reseñas
  hasReviewPagination(): boolean {
    return this.reviews.length > this.reviewsPerPage;
  }

  // Sirve para establecer el criterio de ordenamiento de las reseñas
  setReviewSort(value: string): void {
    if (value !== 'latest' && value !== 'highest' && value !== 'lowest') {
      return;
    }
    const sort = value as ReviewSortOption;
    if (this.reviewSort === sort) {
      return;
    }

    this.reviewSort = sort;
    this.currentReviewPage = 1;
    this.cdr.detectChanges();
  }

  // Sirve para ir a la página de reseñas
  goToReviewPage(page: number): void {
    if (page < 1 || page > this.totalReviewPages || page === this.currentReviewPage) {
      return;
    }

    this.currentReviewPage = page;
    this.cdr.detectChanges();
  }

  // Sirve para obtener los números de página de reseñas
  reviewPageNumbers(): number[] {
    return Array.from({ length: this.totalReviewPages }, (_, index) => index + 1);
  }

  // Sirve para cargar las reseñas
  loadReviews(): void {
    if (!this.recipe) return;
    this.reviewService.getReviews(this.recipe.id_receta).subscribe({
      next: (data) => {
        this.reviews = data;
        this.currentReviewPage = 1;
        this.bumpReviewChanges();
        this.cdr.detectChanges();
      },
      error: () => {
        this.reviews = [];
        this.currentReviewPage = 1;
        this.bumpReviewChanges();
        this.cdr.detectChanges();
      }
    });
  }

  // Sirve para validar si la receta es propia
  isOwnRecipe(): boolean {
    return this.currentUserId !== null && this.recipe?.id_autor === this.currentUserId;
  }

  // Sirve para enviar una reseña
  submitReview(): void {
    if (!this.recipe) return;
    if (this.isOwnRecipe()) {
      this.submitError = "You can't review your own recipe.";
      this.cdr.detectChanges();
      return;
    }
    if (!this.authService.isAuthenticated()) {
      this.submitError = 'You must be logged in to submit a review.';
      this.cdr.detectChanges();
      return;
    }
    if (!this.userRating) {
      this.submitError = 'Please select a star rating before submitting.';
      this.cdr.detectChanges();
      return;
    }
    if (!this.reviewComment.trim()) {
      this.submitError = 'Please write a comment before submitting.';
      this.cdr.detectChanges();
      return;
    }

    this.submitting = true;
    this.submitError = null;
    this.cdr.detectChanges();

    // Sirve para enviar la reseña
    this.reviewService.submitReview({
      id_receta: this.recipe.id_receta,
      puntuacion: this.userRating,
      comentario: this.reviewComment.trim()
    }).subscribe({
      next: () => {
        this.reviewComment = '';
        this.userRating = 0;
        this.submitting = false;
        this.submitError = null;
        this.bumpReviewChanges();
        this.loadReviews();
      },
      error: (err: { error?: { message?: string } }) => {
        this.submitting = false;
        this.submitError = err?.error?.message ?? 'Could not submit review.';
        this.cdr.detectChanges();
      }
    });
  }

  // Sirve para iniciar la edición de una reseña
  startEdit(review: Review): void {
    this.editingReviewId = review.id_valoracion;
    this.editingComment = review.comentario;
    this.editingRating = review.puntuacion;
    this.editingHoverRating = 0;
    this.cdr.detectChanges();
  }

  // Sirve para cancelar la edición de una reseña
  cancelEdit(): void {
    this.editingReviewId = null;
    this.editingComment = '';
    this.editingRating = 0;
    this.editingHoverRating = 0;
    this.cdr.detectChanges();
  }

  // Sirve para guardar la edición de una reseña
  saveEdit(review: Review): void {
    if (!this.editingComment.trim() || !this.editingRating) return;
    this.reviewService.updateReviewWithPuntuacion(review.id_receta, this.editingRating, this.editingComment.trim()).subscribe({
      next: () => {
        review.comentario = this.editingComment.trim();
        review.puntuacion = this.editingRating;
        this.editingReviewId = null;
        this.editingComment = '';
        this.editingRating = 0;
        this.editingHoverRating = 0;
        this.bumpReviewChanges();
        this.cdr.detectChanges();
      },
      error: () => { }
    });
  }

  // Sirve para abrir el modal de eliminación de una reseña
  openDeleteModal(review: Review): void {
    this.reviewToDelete = review;
  }

  // Sirve para cerrar el modal de eliminación de una reseña
  closeDeleteModal(): void {
    this.reviewToDelete = null;
    this.isDeletingReview = false;
  }

  // Sirve para confirmar la eliminación de una reseña
  confirmDeleteReview(): void {
    if (!this.reviewToDelete) return;
    this.isDeletingReview = true;
    this.deleteReview(this.reviewToDelete);
  }

  // Sirve para eliminar una reseña
  deleteReview(review: Review): void {
    this.reviewService.deleteReview(review.id_valoracion).subscribe({
      next: () => {
        this.reviews = this.reviews.filter(r => r.id_valoracion !== review.id_valoracion);
        this.currentReviewPage = Math.min(this.currentReviewPage, this.totalReviewPages);
        // Sirve para actualizar el contador de cambios de reseñas
        this.bumpReviewChanges();
        this.reviewToDelete = null;
        this.isDeletingReview = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isDeletingReview = false;
      }
    });
  }

  // Sirve para validar si la reseña es propia
  isOwnReview(review: Review): boolean {
    return this.currentUserId !== null && review.id_usuario === this.currentUserId;
  }

  // Sirve para validar si se puede eliminar una reseña
  canDeleteReview(review: Review): boolean {
    return this.isOwnReview(review) || this.isAdminUser();
  }

  // Sirve para formatear la fecha de una reseña
  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Sirve para obtener las iniciales de un nombre
  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  // Sirve para actualizar el contador de cambios de reseñas
  private bumpReviewChanges(): void {
    this.reviewChanges.update((value) => value + 1);
  }
}
