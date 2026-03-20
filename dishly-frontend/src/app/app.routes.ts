import { Routes } from '@angular/router';
import { Homepage } from './Pages/homepage/homepage';
import { Login } from './Pages/auth/login/login';
import { Register } from './Pages/auth/register/register';
import { Recipes } from './Pages/recipes/recipes';
import { Upload } from './Pages/upload/upload';
import { EditRecipe } from './Pages/edit-recipe/upload';
import { DishlyAi } from './Pages/dishly-ai/dishly-ai';
import { Forum } from './Pages/forum/forum';
import { Cart } from './Pages/cart/cart';
import { AuthGuard } from './Guards/auth.guard';
import { Profile } from './Pages/profile/profile';
import { EditProfile } from './Pages/edit-profile/edit-profile';
import { NotFound } from './Pages/not-found/not-found';
import { RecipesDetails } from './Pages/recipes-details/recipes-details';

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
        path: 'recipesdetails/:id',
        component: RecipesDetails
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
        path: 'recipes/:id/edit',
        component: EditRecipe,
        canActivate: [AuthGuard]
    },
    {
        path: 'cart',
        component: Cart,
        canActivate: [AuthGuard]
    },
    {
        path: 'profile',
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
                component: Profile
            },
            {
                path: 'edit',
                component: EditProfile
            }
        ]
    },
    {
        path: '**',
        component: NotFound
    }

];