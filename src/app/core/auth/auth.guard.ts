import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const requireAuth: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady();
  // Guarda pra onde ia (ex.: link de convite) e volta depois do login.
  return auth.signedIn() ? true : router.createUrlTree(['/entrar'], { queryParams: { volta: state.url } });
};

export const redirectIfSignedIn: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady();
  return auth.signedIn() ? router.createUrlTree(['/hoje']) : true;
};
