import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dishly-ai',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <section class="page-header page-container mb-4">
      <div class="page-header__inner">
        <h1 class="page-title"><span class="notranslate" translate="no">Dishly AI</span></h1>
        <div class="page-underline" aria-hidden="true"></div>
      </div>
    </section>

    <section class="page-container dishly-ai-shell">
      <section class="ai-hero-card">
        <div class="ai-hero-card__copy">
          <p class="ai-eyebrow">AI Recipe Generation</p>
          <h2>Generate custom recipes in seconds based on your ingredients, time, and cravings.</h2>
          <p class="subtitle">Tell <span class="notranslate" translate="no">Dishly AI</span> what you have at home and it will generate a complete recipe with steps, timing, and serving ideas.</p>
        </div>
        <div class="ai-hero-card__badge">
          <span class="ai-icon" aria-hidden="true">AI</span>
          <span>Recipe generator online</span>
        </div>
      </section>

      <div class="ai-content">
        <router-outlet></router-outlet>
      </div>
    </section>
  `,
  styleUrls: ['./dishly-ai.css']
})
export class DishlyAi {}


