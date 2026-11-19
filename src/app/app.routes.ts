import { Routes } from '@angular/router';
import { redirectIfSignedIn, requireAuth } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'entrar',
    canActivate: [redirectIfSignedIn],
    title: 'Entrar · Moodômetro',
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'convite/:code',
    canActivate: [requireAuth],
    title: 'Convite · Moodômetro',
    loadComponent: () => import('./pages/convite.page').then((m) => m.ConvitePage),
  },
  {
    path: '',
    canActivate: [requireAuth],
    loadComponent: () => import('./pages/shell.page').then((m) => m.ShellPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'hoje' },
      { path: 'hoje', title: 'Hoje · Moodômetro', loadComponent: () => import('./pages/hoje.page').then((m) => m.HojePage) },
      { path: 'pessoas', title: 'Pessoas · Moodômetro', loadComponent: () => import('./pages/pessoas.page').then((m) => m.PessoasPage) },
      { path: 'pessoas/:id', title: 'Pessoa · Moodômetro', loadComponent: () => import('./pages/pessoa.page').then((m) => m.PessoaPage) },
      { path: 'convidar', title: 'Convidar · Moodômetro', loadComponent: () => import('./pages/convidar.page').then((m) => m.ConvidarPage) },
      { path: 'perfil', title: 'Perfil · Moodômetro', loadComponent: () => import('./pages/perfil.page').then((m) => m.PerfilPage) },
    ],
  },
  { path: '**', redirectTo: 'hoje' },
];
