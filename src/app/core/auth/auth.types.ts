export type AuthProviderId = 'google' | 'apple';

export interface AuthUser {
  uid: string;
  name: string;
  email: string | null;
  provider: AuthProviderId;
}

/** Implementação concreta do login (demo ou Firebase). */
export interface AuthBackend {
  readonly kind: 'demo' | 'firebase';
  /** Restaura a sessão e avisa sempre que o usuário mudar. */
  init(onChange: (user: AuthUser | null) => void): Promise<void>;
  signIn(provider: AuthProviderId): Promise<AuthUser>;
  signOut(): Promise<void>;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: 'cancelled' | 'popup-blocked' | 'not-configured' | 'unknown',
  ) {
    super(message);
  }
}
