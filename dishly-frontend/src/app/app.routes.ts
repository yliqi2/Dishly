import { Routes } from '@angular/router';
import { Homepage } from './Pages/homepage/homepage';
import { Login } from './Pages/auth/login/login';
import { Register } from './Pages/auth/register/register';
import { Recipes } from './Pages/recipes/recipes';
import { Upload } from './Pages/upload/upload';

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
        path: 'upload',
        component: Upload
    }

];