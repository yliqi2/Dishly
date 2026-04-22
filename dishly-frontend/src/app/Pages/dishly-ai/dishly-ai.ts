import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dishly-ai',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <section class="page-header page-container">
      <div class="page-header__inner">
        <h1 class="page-title">Dishly AI</h1>
        <div class="page-underline" aria-hidden="true"></div>
      </div>

      <div class="dishly-ai-shell page-container">
        <section class="ai-hero-card">
          <div class="ai-hero-card__copy">
            <p class="ai-eyebrow">AI Recipe Generation</p>
            <h2>Generate custom recipes in seconds based on your ingredients, time, and cravings.</h2>
            <p class="subtitle">Tell Dishly AI what you have at home and it will generate a complete recipe with steps, timing, and serving ideas.</p>
          </div>
          <div class="ai-hero-card__badge">
            <span class="ai-icon" aria-hidden="true">AI</span>
            <span>Recipe generator online</span>
          </div>
        </section>

        <div class="ai-content">
        <router-outlet></router-outlet>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./dishly-ai.scss']
})
export class DishlyAi {}

