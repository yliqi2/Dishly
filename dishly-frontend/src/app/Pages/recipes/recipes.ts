import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './recipes.html',
  styleUrl: './recipes.css',
})
export class Recipes {
  recipe = {
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
      'https://images.unsplash.com/photo-1473093226795-af9932fe5856?q=80&w=2094&auto=format&fit=crop',
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
    ],
    reviews: [] // Empty for "No reviews yet" state
  };

  selectedThumbnailIndex = 0;
  userRating = 0;
  hoverRating = 0;

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
}
