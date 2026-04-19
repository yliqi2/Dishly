import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  importProvidersFrom
} from '@angular/core';

import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authInterceptor } from './Core/interceptors/auth-interceptor';

import {
  ChevronLeft,
  ChevronRight,
  ChefHat,
  Cpu,
  Crown,
  Eye,
  EyeOff,
  Lock,
  LucideAngularModule,
  Mail,
  Pencil,
  ShieldCheck,
  ShoppingCart,
  ShoppingBag,
  TrendingUp,
  Upload,
  User,
  Clock,
  Users,
  Flame,
  Star,
  Heart,
  ClipboardList,
  Send,
  Calendar,
  Search,
  SearchX,
  CircleAlert,
  Trash2,
  Check,
  X
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
      })
    ),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    importProvidersFrom(
      LucideAngularModule.pick({
        ChevronLeft,
        ChevronRight,
        ChefHat,
        Cpu,
        Crown,
        Eye,
        EyeOff,
        Lock,
        Mail,
        Pencil,
        ShieldCheck,
        ShoppingCart,
        ShoppingBag,
        TrendingUp,
        Upload,
        User,
        Clock,
        Users,
        Flame,
        Star,
        Heart,
        ClipboardList,
        Send,
        Calendar,
        Search,
        SearchX,
        CircleAlert,
        Trash2,
        Check,
        X
      })
    )
  ]
};