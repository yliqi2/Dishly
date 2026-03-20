import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  importProvidersFrom
} from '@angular/core';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authInterceptor } from './Core/interceptors/auth-interceptor';

import {
  Calendar,
  ChefHat,
  Clock,
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
  Star,
  TrendingUp,
  Upload,
  User,
  Wheat
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(
      LucideAngularModule.pick({
        Calendar,
        ChefHat,
        Clock,
        Cpu,
        Crown,
        Eye,
        EyeOff,
        Lock,
        Mail,
        Pencil,
        ShieldCheck,
        ShoppingCart,
        Star,
        TrendingUp,
        Upload,
        User,
        Wheat
      })
    )
  ]
};