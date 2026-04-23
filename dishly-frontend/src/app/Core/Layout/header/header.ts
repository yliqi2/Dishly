import { ChangeDetectionStrategy, Component, computed, signal, inject, HostListener } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthServices } from '../../Services/Auth/auth-services';
import { CartService } from '../../Services/Cart/cart.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';

type AuthUser = {
  nombre?: string;
  name?: string;
  email?: string;
  icon_path?: string | null;
  updated_at?: string;
  chef?: boolean;
};

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, NgOptimizedImage, LucideAngularModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private static readonly LANGUAGE_SWITCH_COOLDOWN_MS = 2000;
  private static readonly GOOGLE_SYNC_RETRY_MS = 350;
  private static readonly GOOGLE_SYNC_MAX_RETRIES = 3;

  private authService = inject(AuthServices);
  private cartService = inject(CartService);

  protected readonly menuOpen = signal(false);
  protected readonly mobileMenuOpen = signal(false);
  protected readonly isLoggingOut = signal(false);
  protected readonly currentLanguage = signal<'en' | 'es' | 'ca'>('en');
  protected readonly languageCooldownActive = signal(false);

  private readonly user = toSignal<AuthUser | null>(this.authService.user$, { initialValue: null });
  private readonly cartItems = toSignal(this.cartService.items$, { initialValue: [] });

  protected readonly isAuthenticated = computed(() => !!this.user());
  protected readonly cartCount = computed(() => this.cartItems().length);
  protected readonly cartBadgeText = computed(() => this.cartCount() > 99 ? '99+' : String(this.cartCount()));
  protected readonly displayName = computed(() => this.user()?.nombre || this.user()?.name || 'User');
  protected readonly chef = computed(() => this.user()?.chef ?? false);
  protected readonly userInitial = computed(() => this.displayName().charAt(0).toUpperCase());
  protected readonly iconUrl = computed(() => {
    const u = this.user() ?? (this.authService.getUser() as AuthUser | null);
    if (!u?.icon_path) return null;
    return this.authService.getAssetUrl(u.icon_path, u.updated_at);
  });

  protected readonly navItems = [
    { label: 'Home', route: '/' },
    { label: 'Recipes', route: '/my-recipes' },
    { label: 'Dishly AI', route: '/dishly-ai' },
    { label: 'Forum', route: '/forum' },
  ];

  constructor() {
    this.syncCurrentLanguageWithGoogleTranslate();
  }

  protected toggleMenu(): void {
    this.menuOpen.update(value => !value);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected onMenuFocusOut(event: FocusEvent): void {
    const wrapper = event.currentTarget as HTMLElement | null;
    const next = event.relatedTarget as Node | null;
    if (!wrapper || (next && wrapper.contains(next))) return;
    this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (this.menuOpen()) this.closeMenu();
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update(value => !value);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected logout(): void {
    this.isLoggingOut.set(true);
    this.closeMenu();
    this.closeMobileMenu();
    this.authService.logout().subscribe({
      error: () => this.isLoggingOut.set(false),
    });
  }

  protected switchLanguage(language: 'en' | 'es' | 'ca', event: Event): void {
    event.preventDefault();

    if (this.languageCooldownActive()) return;

    this.languageCooldownActive.set(true);
    setTimeout(() => this.languageCooldownActive.set(false), Header.LANGUAGE_SWITCH_COOLDOWN_MS);

    this.currentLanguage.set(language);

    const doc = globalThis.document;
    if (!doc) return;

    const translateSelect = doc.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (!translateSelect) return;

    if (translateSelect.value === language) return;

    translateSelect.value = language;
    translateSelect.dispatchEvent(new Event('change'));
  }

  private syncCurrentLanguageWithGoogleTranslate(retries = Header.GOOGLE_SYNC_MAX_RETRIES): void {
    const doc = globalThis.document;
    if (!doc) return;

    const cookieLanguage = this.getLanguageFromGoogleCookie(doc.cookie);
    if (cookieLanguage) {
      this.currentLanguage.set(cookieLanguage);
    }

    const translateSelect = doc.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    const selectedLanguage = translateSelect?.value ?? '';
    if (this.isSupportedLanguage(selectedLanguage)) {
      this.currentLanguage.set(selectedLanguage);
      return;
    }

    if (retries <= 0) return;

    setTimeout(() => {
      this.syncCurrentLanguageWithGoogleTranslate(retries - 1);
    }, Header.GOOGLE_SYNC_RETRY_MS);
  }

  private getLanguageFromGoogleCookie(cookie: string): 'en' | 'es' | 'ca' | null {
    const match = cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (!match) return null;

    const value = decodeURIComponent(match[1] ?? '');
    const cookieLanguage = value.split('/').at(-1) ?? '';
    return this.isSupportedLanguage(cookieLanguage) ? cookieLanguage : null;
  }

  private isSupportedLanguage(language: string): language is 'en' | 'es' | 'ca' {
    return language === 'en' || language === 'es' || language === 'ca';
  }
}
