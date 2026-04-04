import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ReviewService } from '../../../Core/Services/Recipes/review.service';
import { AuthServices } from '../../../Core/Services/Auth/auth-services';
import { Review } from '../../../Core/Interfaces/Review';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.css',
})
export class RecipeDetail implements OnInit {
  recipe = {
    id_receta: 1, // Added ID so reviews can attach to something
    author: {
      name: 'Franchesco',
      initials: 'F'
    },
    title: 'Truffle Pasta Carbonara',
    rating: 4.8,
    price: 12.50,
    mainImage: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=2071&auto=format&fit=crop',
    thumbnails: [
      'https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=2071&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1473093226795-af9932fe5855?q=80&w=2094&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=2132&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558985250-27a406d64cb3?q=80&w=2070&auto=format&fit=crop'
    ],
    badges: ['Pasta', 'Premium'],
    difficulty: 'Easy',
    stats: {
      time: '35 min',
      servings: '4 people',
      level: 'Easy'
    },
    description: "This isn't just mac and cheese; it's a masterpiece of creamy indulgence. Our signature baked macaroni is a celebration of texture and flavor, where every forkful delivers the ultimate comfort food experience.",
    ingredients: [
      { name: 'Fresh Pasta', amount: '400g' },
      { name: 'Pancetta', amount: '200g' },
      { name: 'Egg Yolks', amount: '4 large' },
      { name: 'Parmesan', amount: '100g' },
      { name: 'Black Truffle', amount: '30g' },
      { name: 'Black Pepper', amount: '2 tsp' },
      { name: 'Garlic', amount: '2 cloves' },
      { name: 'Salt', amount: 'To taste' }
    ],
    instructions: [
      'Bring a large pot of salted water to boil. Cook pasta until al dente, reserving 1 cup of pasta water.',
      'While pasta cooks, crisp pancetta in a large pan over medium heat until golden. Add minced garlic.',
      'Whisk egg yolks with grated Parmesan in a bowl. Season with black pepper.',
      'Drain pasta and add to the pancetta pan. Remove from heat and quickly mix in egg mixture, adding pasta water to create a creamy sauce.',
      'Shave fresh black truffle over the top and serve immediately with extra Parmesan.'
    ]
  };

  selectedThumbnailIndex = 0;
  userRating = 0;
  hoverRating = 0;

  // Review-related properties
  private reviewService = inject(ReviewService);
  private authService = inject(AuthServices);
  private cdr = inject(ChangeDetectorRef);

  reviews: Review[] = [];
  reviewComment = '';
  submitError: string | null = null;
  submitting = false;
  editingReviewId: number | null = null;
  editingComment = '';
  private currentUserId: number | null = null;

  ngOnInit(): void {
    const user = this.authService.getUser() as { id_usuario?: number } | null;
    this.currentUserId = user?.id_usuario ?? null;
    this.loadReviews();
  }

  // Visual carousel functions
  selectThumbnail(index: number) {
    this.selectedThumbnailIndex = index;
  }

  prevImage() {
    this.selectedThumbnailIndex = (this.selectedThumbnailIndex > 0) 
      ? this.selectedThumbnailIndex - 1 
      : this.recipe.thumbnails.length - 1;
  }

  nextImage() {
    this.selectedThumbnailIndex = (this.selectedThumbnailIndex < this.recipe.thumbnails.length - 1) 
      ? this.selectedThumbnailIndex + 1 
      : 0;
  }

  setRating(rating: number) {
    this.userRating = rating;
  }

  setHoverRating(rating: number) {
    this.hoverRating = rating;
  }

  // Logic functions for Reviews
  loadReviews(): void {
    this.reviewService.getReviews(this.recipe.id_receta).subscribe({
      next: (data) => {
        this.reviews = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.reviews = [];
        this.cdr.detectChanges();
      }
    });
  }

  submitReview(): void {
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
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    this.editingReviewId = null;
    this.editingComment = '';
    this.cdr.detectChanges();
  }

  saveEdit(review: Review): void {
    if (!this.editingComment.trim()) return;
    this.reviewService.updateReviewWithPuntuacion(review.id_receta, review.puntuacion, this.editingComment.trim()).subscribe({
      next: () => {
        review.comentario = this.editingComment.trim();
        this.editingReviewId = null;
        this.editingComment = '';
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  deleteReview(review: Review): void {
    this.reviewService.deleteReview(review.id_valoracion).subscribe({
      next: () => {
        this.reviews = this.reviews.filter(r => r.id_valoracion !== review.id_valoracion);
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
