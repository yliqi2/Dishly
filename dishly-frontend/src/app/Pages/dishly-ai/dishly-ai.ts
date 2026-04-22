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
            <p class="ai-eyebrow">Smart Recipe Assistant</p>
            <h2>Your Dishly kitchen copilot, with the same look and feel as the rest of the app.</h2>
            <p class="subtitle">Ask for recipes by ingredient, time, difficulty or mood, and jump straight into the full recipe when you find one you like.</p>
          </div>
          <div class="ai-hero-card__badge">
            <span class="ai-icon" aria-hidden="true">AI</span>
            <span>Live assistant</span>
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

