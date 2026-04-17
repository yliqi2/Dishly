// routes.ts - Actualizado con la ruta del chatbot
import { Routes } from '@angular/router';
import { Homepage } from './Pages/homepage/homepage';
import { Login } from './Pages/auth/login/login';
import { Register } from './Pages/auth/register/register';
import { ForgotPassword } from './Pages/auth/forgot-password/forgot-password';
import { VerifyEmail } from './Pages/auth/verify-email/verify-email';
import { SearchRecipes } from './Pages/recipes/search-recipes/search-recipes';
import { RecipeDetail } from './Pages/recipes/recipe-detail/recipe-detail';
import { Upload } from './Pages/upload/upload';
import { DishlyAi } from './Pages/dishly-ai/dishly-ai';
import { Forum } from './Pages/forum/forum';
import { Cart } from './Pages/shopping/cart/cart';
import { PaymentMethod } from './Pages/shopping/payment-method/payment-method';
import { AuthGuard } from './Guards/auth.guard';
import { GuestGuard } from './Guards/guest.guard';
import { Profile } from './Pages/profile/profile';
import { EditProfile } from './Pages/edit-profile/edit-profile';
import { EditRecipe } from './Pages/edit-recipe/upload';
import { NotFound } from './Pages/not-found/not-found';
import { RecipeChatbot } from './Pages/dishly-ai/recipe-chatbot/recipe-chatbot';

export const routes: Routes = [
    {
        path: 'dishly-ai',
        component: DishlyAi,
        children: [
            { path: '', redirectTo: 'chatbot', pathMatch: 'full' },
            { path: 'chatbot', component: RecipeChatbot }
        ]
    },
    {
        path: '',
        component: Homepage
    },
    {
        path: 'login',
        component: Login,
        canActivate: [GuestGuard]
    },
    {
        path: 'register',
        component: Register,
        canActivate: [GuestGuard]
    },
    {
        path: 'forgot-password',
        component: ForgotPassword
    },
    {
        path: 'verifyEmail',
        component: VerifyEmail,
        canActivate: [GuestGuard]
    },
    {
        path: 'recipes',
        children: [
            { path: '', component: SearchRecipes },
            { path: ':id/edit', component: EditRecipe, canActivate: [AuthGuard] },
            { path: ':id', component: RecipeDetail }
        ]
    },

    {
        path: 'forum',
        component: Forum
    },
    {
        path: 'upload',
        component: Upload,
        canActivate: [AuthGuard]
    },
    {
        path: 'cart',
        component: Cart,
        canActivate: [AuthGuard]
    },
    {
        path: 'payment',
        component: PaymentMethod,
        canActivate: [AuthGuard]
    },
    {
        path: 'profile',
        component: Profile,
        canActivate: [AuthGuard]
    },
    {
        path: 'profile/edit',
        component: EditProfile,
        canActivate: [AuthGuard]
    },
    {
        path: '**',
        component: NotFound
    }
];