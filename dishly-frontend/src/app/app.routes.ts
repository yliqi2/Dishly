import { Routes } from '@angular/router';
import { Homepage } from './Pages/homepage/homepage';
import { Login } from './Pages/auth/login/login';
import { Register } from './Pages/auth/register/register';
import { Recipes } from './Pages/recipes/recipes';
import { Upload } from './Pages/upload/upload';
import { DishlyAi } from './Pages/dishly-ai/dishly-ai';
import { Forum } from './Pages/forum/forum';
import { Cart } from './Pages/cart/cart';
import { AuthGuard } from './Guards/auth.guard';
import { Profile } from './Pages/profile/profile';
import { NotFound } from './Pages/not-found/not-found';

export const routes: Routes = [
    {
        path: '',
        component: Homepage
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'register',
        component: Register
    },
    {
        path: 'recipes',
        component: Recipes
    },  
    {
        path: 'dishly-ai',
        component: DishlyAi
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
        path: 'profile',
        component: Profile,
        canActivate: [AuthGuard]
    },
    {
        path: '**',
        component: NotFound
    }

];