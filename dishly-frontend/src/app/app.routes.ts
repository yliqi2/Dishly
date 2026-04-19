import { Routes } from '@angular/router';
import { Homepage } from './Pages/homepage/homepage';
import { Login } from './Pages/auth/login/login';
import { Register } from './Pages/auth/register/register';
import { ForgotPassword } from './Pages/auth/forgot-password/forgot-password';
import { VerifyEmail } from './Pages/auth/verify-email/verify-email';
import { SearchRecipes } from './Pages/recipes/search-recipes/search-recipes';
import { RecipeDetail } from './Pages/recipes/recipe-detail/recipe-detail';
import { BoughtRecipes } from './Pages/recipes/bought-recipes/bought-recipes';
import { Upload } from './Pages/upload/upload';
import { DishlyAi } from './Pages/dishly-ai/dishly-ai';
import { Forum } from './Pages/forum/forum';
import { Cart } from './Pages/shopping/cart/cart';
import { PaymentMethod } from './Pages/shopping/payment-method/payment-method';
import { AuthGuard } from './Guards/auth.guard';
import { GuestGuard } from './Guards/guest.guard';
import { Profile } from './Pages/profile/profile';
import { EditProfile } from './Pages/edit-profile/edit-profile';
import { EditRecipe } from './Pages/edit-recipe/edit-recipe';
import { NotFound } from './Pages/not-found/not-found';
import { TermsaAndConditions } from './Pages/termsa-and-conditions/termsa-and-conditions';
import { Cookies } from './Pages/cookies/cookies';

export const routes: Routes = [
  {
    path: '',
    component: Homepage,
    title: 'Home',
  },
  {
    path: 'login',
    component: Login,
    canActivate: [GuestGuard],
    title: 'Login',
  },
  {
    path: 'register',
    component: Register,
    canActivate: [GuestGuard],
    title: 'Register',
  },
  {
    path: 'forgot-password',
    component: ForgotPassword,
    title: 'Forgot Password',
  },
  {
    path: 'verifyEmail',
    component: VerifyEmail,
    canActivate: [GuestGuard],
    title: 'Verify Email',
  },
  {
    path: 'recipes',
    children: [
      { path: '', component: SearchRecipes, title: 'Recipes' },
      { path: ':id/edit', component: EditRecipe, canActivate: [AuthGuard], title: 'Edit Recipe' },
      { path: ':id', component: RecipeDetail, title: 'Recipe' },
    ],
  },
  {
    path: 'my-recipes',
    component: BoughtRecipes,
    canActivate: [AuthGuard],
    title: 'My Purchased Recipes',
  },
  {
    path: 'dishly-ai',
    component: DishlyAi,
    title: 'Dishly AI',
  },
  {
    path: 'forum',
    component: Forum,
    title: 'Forum',
  },
  {
    path: 'upload',
    component: Upload,
    canActivate: [AuthGuard],
    title: 'Upload Recipe',
  },
  {
    path: 'cart',
    component: Cart,
    canActivate: [AuthGuard],
    title: 'Cart',
  },
  {
    path: 'payment',
    component: PaymentMethod,
    canActivate: [AuthGuard],
    title: 'Payment',
  },
  {
    path: 'profile',
    component: Profile,
    canActivate: [AuthGuard],
    title: 'Profile',
  },
  {
    path: 'profile/edit',
    component: EditProfile,
    canActivate: [AuthGuard],
    title: 'Edit Profile',
  },
  {
    path: 'terms-and-conditions',
    component: TermsaAndConditions,
    title: 'Terms and Conditions',
  },
  {
    path: 'cookies',
    component: Cookies,
    title: 'Cookie Policy',
  },
  {
    path: '**',
    component: NotFound,
    title: '404 Not Found',
  },
];
