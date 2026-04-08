import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ReviewService } from '../../../Core/Services/Recipes/review.service';
import { AuthServices } from '../../../Core/Services/Auth/auth-services';
import { CartService } from '../../../Core/Services/Cart/cart.service';
import { RecetaDetailsService } from '../../../Core/Services/Core/receta-details-service';
import { RecetaOriginal } from '../../../Core/Interfaces/RecetaOriginal';
import { Review } from '../../../Core/Interfaces/Review';
import { LoadingPage } from '../../loading-page/loading-page';

type ReviewSortOption = 'latest' | 'highest' | 'lowest';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule, LoadingPage],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.css',
})
export class RecipeDetail implements OnInit {
  recipe: RecetaOriginal | null = null;
  loading = true;
  error: string | null = null;

  thumbnails: string[] = [];
  instructions: string[] = [];

  selectedThumbnailIndex = 0;
  imageAnimationClass = '';
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
  reviewComment = '';
  submitError: string | null = null;
  cartNotice: string | null = null;
  submitting = false;
  editingReviewId: number | null = null;
  editingComment = '';
  editingRating = 0;
  editingHoverRating = 0;
  isInCart = false;
  private currentUserId: number | null = null;
  private currentUserRole: string | null = null;
  private currentUserIconPath: string | null = null;
  private currentUserUpdatedAt: string | null = null;

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
      this.loading = false;
      return;
    }

    this.recetaService.getRecipeById(id).subscribe({
      next: (data) => {
        this.recipe = data;
        this.thumbnails = this.computeThumbnails(data);
        this.instructions = this.computeInstructions(data.instrucciones);
        this.isInCart = this.cartService.hasRecipe(data.id_receta);
        this.loading = false;
        this.cdr.detectChanges();
        this.loadReviews();
        this.checkAccess(id);
      },
      error: (err) => {
        console.error('Error al cargar la receta:', err);
        this.error = 'The recipe failed to load.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private computeThumbnails(r: RecetaOriginal): string[] {
    const thumbs: string[] = [];

    const addImage = (path: string | null) => {
      if (!path) return;
      thumbs.push(this.authService.getAssetUrl(path));
    };

    addImage(r.imagen_1);
    addImage(r.imagen_2);
    addImage(r.imagen_3);
    addImage(r.imagen_4);
    addImage(r.imagen_5);

    if (thumbs.length === 0) thumbs.push('assets/placeholder.jpg');
    return thumbs;
  }

  private computeInstructions(text: string): string[] {
    if (!text) return [];
    return text
      .split('\n')
      .map(s => s.trim().replace(/^\d+\.\s*/, ''))
      .filter(s => s.length > 0);
  }

  getTimeLabel(): string {
    if (!this.recipe) return '';
    const unit = this.recipe.tiempo_preparacion_unidad === 'hours' ? 'h' : 'min';
    return `${this.recipe.tiempo_preparacion} ${unit}`;
  }

  getDisplayPrice(): string {
    if (!this.recipe || this.recipe.price === null || this.recipe.price === undefined) return 'Free';
    const value = Number(this.recipe.price);
    return Number.isFinite(value) && value > 0 ? `${value.toFixed(2)}€` : 'Free';
  }

  getPublishedDate(): string {
    if (!this.recipe?.fecha_creacion) return '';
    const date = new Date(this.recipe.fecha_creacion);
    if (Number.isNaN(date.getTime())) return this.recipe.fecha_creacion;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

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

  getDifficultyBars(): number {
    if (!this.recipe) return 1;
    switch (this.recipe.dificultad) {
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 1;
    }
  }

  getDifficultyLabel(): string {
    if (!this.recipe) return '';
    switch (this.recipe.dificultad) {
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
      default: return this.recipe.dificultad;
    }
  }

  isPremium(): boolean {
    if (!this.recipe || this.recipe.price === null || this.recipe.price === undefined) return false;
    const value = Number(this.recipe.price);
    return Number.isFinite(value) && value > 0;
  }

  isAdminUser(): boolean {
    return this.currentUserRole === 'admin';
  }

  private checkAccess(id: string): void {
    if (!this.recipe) return;

    if (this.isAdminUser()) {
      this.isLocked = false;
      this.cdr.detectChanges();
      return;
    }

    if (this.isPremium()) {
      this.isLocked = true;
      if (this.authService.isAuthenticated()) {
        this.recetaService.checkPurchase(id).subscribe({
          next: (res) => {
            this.isLocked = !res.purchased;
            this.cdr.detectChanges();
          }
        });
      }
    } else {
      this.isLocked = false;
    }
  }

  hasMultipleImages(): boolean {
    return this.thumbnails.length > 1;
  }

  addToCart(): void {
    if (!this.recipe || !this.isPremium()) {
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

    const result = this.cartService.addRecipe(this.recipe);
    this.isInCart = result.added || result.duplicate;
    this.cartNotice = result.added
      ? 'Recipe added to your cart.'
      : 'This recipe is already in your cart.';
    this.cdr.detectChanges();
  }

  visibleThumbnails(): string[] {
    return this.hasMultipleImages() ? this.thumbnails.slice(0, 5) : this.thumbnails;
  }

  hiddenThumbnailsCount(): number {
    return Math.max(0, this.thumbnails.length - 5);
  }

  isSummaryThumbnail(index: number): boolean {
    return this.hiddenThumbnailsCount() > 0 && index === 4;
  }

  selectThumbnail(index: number): void {
    if (index === this.selectedThumbnailIndex) return;

    this.triggerImageAnimation(index > this.selectedThumbnailIndex ? 'slide-next' : 'slide-prev');
    this.selectedThumbnailIndex = index;
  }

  prevImage(): void {
    this.triggerImageAnimation('slide-prev');
    this.selectedThumbnailIndex = (this.selectedThumbnailIndex > 0)
      ? this.selectedThumbnailIndex - 1
      : this.thumbnails.length - 1;
  }

  nextImage(): void {
    this.triggerImageAnimation('slide-next');
    this.selectedThumbnailIndex = (this.selectedThumbnailIndex < this.thumbnails.length - 1)
      ? this.selectedThumbnailIndex + 1
      : 0;
  }

  private triggerImageAnimation(direction: 'slide-next' | 'slide-prev'): void {
    this.imageAnimationClass = '';
    this.cdr.detectChanges();

    requestAnimationFrame(() => {
      this.imageAnimationClass = direction;
      this.cdr.detectChanges();

      window.setTimeout(() => {
        if (this.imageAnimationClass === direction) {
          this.imageAnimationClass = '';
          this.cdr.detectChanges();
        }
      }, 320);
    });
  }

  setRating(rating: number): void { this.userRating = rating; }
  setHoverRating(rating: number): void { this.hoverRating = rating; }
  setEditRating(rating: number): void { this.editingRating = rating; }
  setEditHoverRating(rating: number): void { this.editingHoverRating = rating; }

  get totalReviewPages(): number {
    return Math.max(1, Math.ceil(this.reviews.length / this.reviewsPerPage));
  }

  get sortedReviews(): Review[] {
    const reviews = [...this.reviews];

    switch (this.reviewSort) {
      case 'highest':
        return reviews.sort((a, b) => {
          const scoreDiff = b.puntuacion - a.puntuacion;
          if (scoreDiff !== 0) return scoreDiff;
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        });
      case 'lowest':
        return reviews.sort((a, b) => {
          const scoreDiff = a.puntuacion - b.puntuacion;
          if (scoreDiff !== 0) return scoreDiff;
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        });
      case 'latest':
      default:
        return reviews.sort((a, b) => {
          const dateDiff = new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
          if (dateDiff !== 0) return dateDiff;
          return b.id_valoracion - a.id_valoracion;
        });
    }
  }

  get paginatedReviews(): Review[] {
    const start = (this.currentReviewPage - 1) * this.reviewsPerPage;
    return this.sortedReviews.slice(start, start + this.reviewsPerPage);
  }

  hasReviewPagination(): boolean {
    return this.reviews.length > this.reviewsPerPage;
  }

  setReviewSort(sort: ReviewSortOption): void {
    if (this.reviewSort === sort) {
      return;
    }

    this.reviewSort = sort;
    this.currentReviewPage = 1;
    this.cdr.detectChanges();
  }

  goToReviewPage(page: number): void {
    if (page < 1 || page > this.totalReviewPages || page === this.currentReviewPage) {
      return;
    }

    this.currentReviewPage = page;
    this.cdr.detectChanges();
  }

  reviewPageNumbers(): number[] {
    return Array.from({ length: this.totalReviewPages }, (_, index) => index + 1);
  }

  loadReviews(): void {
    if (!this.recipe) return;
    this.reviewService.getReviews(this.recipe.id_receta).subscribe({
      next: (data) => {
        this.reviews = data;
        this.currentReviewPage = 1;
        this.cdr.detectChanges();
      },
      error: () => {
        this.reviews = [];
        this.currentReviewPage = 1;
        this.cdr.detectChanges();
      }
    });
  }

  isOwnRecipe(): boolean {
    return this.currentUserId !== null && this.recipe?.id_autor === this.currentUserId;
  }

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
        this.loadReviews();
      },
      error: (err: { error?: { message?: string } }) => {
        this.submitting = false;
        this.submitError = err?.error?.message ?? 'Could not submit review.';
        this.cdr.detectChanges();
      }
    });
  }

  startEdit(review: Review): void {
    this.editingReviewId = review.id_valoracion;
    this.editingComment = review.comentario;
    this.editingRating = review.puntuacion;
    this.editingHoverRating = 0;
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    this.editingReviewId = null;
    this.editingComment = '';
    this.editingRating = 0;
    this.editingHoverRating = 0;
    this.cdr.detectChanges();
  }

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
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  deleteReview(review: Review): void {
    this.reviewService.deleteReview(review.id_valoracion).subscribe({
      next: () => {
        this.reviews = this.reviews.filter(r => r.id_valoracion !== review.id_valoracion);
        this.currentReviewPage = Math.min(this.currentReviewPage, this.totalReviewPages);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  isOwnReview(review: Review): boolean {
    return this.currentUserId !== null && review.id_usuario === this.currentUserId;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
}
