import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dishly-ai',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="dishly-ai-container">
      <div class="ai-header">
        <h1>
          <span class="ai-icon">🤖</span>
          Dishly AI - Tu Chef Virtual
        </h1>
        <p class="subtitle">Pregúntame cualquier cosa sobre recetas, ingredientes o cocina</p>
      </div>
      
      <div class="ai-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styleUrls: ['./dishly-ai.scss']
})
export class DishlyAi {}