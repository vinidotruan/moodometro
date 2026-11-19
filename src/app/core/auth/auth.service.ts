import { computed, Injectable, signal } from '@angular/core';
import { isFirebaseMode } from '../config';
import { DemoAuthBackend } from './demo-auth';
import { FirebaseAuthBackend } from './firebase-auth';
import { AuthBackend, AuthError, AuthProviderId, AuthUser } from './auth.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly backend: AuthBackend =
    isFirebaseMode ? new FirebaseAuthBackend() : new DemoAuthBackend();

  private readonly _user = signal<AuthUser | null>(null);
  private readonly _ready = signal(false);
  private initPromise?: Promise<void>;

  readonly user = this._user.asReadonly();
  readonly ready = this._ready.asReadonly();
  readonly signedIn = computed(() => this._user() !== null);
  readonly isDemo = this.backend.kind === 'demo';

  /** Chamado pelo guard; resolve quando a sessão salva foi restaurada. */
  whenReady(): Promise<void> {
    this.initPromise ??= this.backend
      .init((u) => this._user.set(u))
      .finally(() => this._ready.set(true));
    return this.initPromise;
  }

  async signIn(provider: AuthProviderId): Promise<AuthUser> {
    await this.whenReady();
    try {
      return await this.backend.signIn(provider);
    } catch (e) {
      throw e instanceof AuthError ? e : new AuthError('Não deu pra entrar agora.', 'unknown');
    }
  }

  async signOut(): Promise<void> {
    await this.whenReady();
    await this.backend.signOut();
  }
}
