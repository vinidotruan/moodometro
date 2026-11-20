export interface AuthUser {
  uid: string;
  name: string;
  /** Nome de usuário: minúsculo, 3 a 20 caracteres (letras, números, ponto e _). */
  username: string;
}

/** Implementação concreta do login (demo ou Firebase). */
export interface AuthBackend {
  readonly kind: 'demo' | 'firebase';
  /** Restaura a sessão e avisa sempre que o usuário mudar. */
  init(onChange: (user: AuthUser | null) => void): Promise<void>;
  signIn(username: string, password: string): Promise<AuthUser>;
  signUp(username: string, name: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
}

export type AuthErrorCode =
  | 'invalid-username'
  | 'missing-name'
  | 'weak-password'
  | 'username-taken'
  | 'wrong-credentials'
  | 'not-configured'
  | 'unknown';

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: AuthErrorCode,
  ) {
    super(message);
  }
}

/** Normaliza ("@Ruan " → "ruan") e valida o nome de usuário. */
export function normalizeUsername(raw: string): string {
  const u = raw.trim().toLowerCase().replace(/^@/, '');
  if (!/^[a-z0-9._]{3,20}$/.test(u)) {
    throw new AuthError('O usuário precisa ter de 3 a 20 letras, números, ponto ou _.', 'invalid-username');
  }
  return u;
}

export function checkNewAccount(name: string, password: string): void {
  if (!name.trim()) throw new AuthError('Conta como você quer ser chamado.', 'missing-name');
  if (password.length < 6) throw new AuthError('A senha precisa ter pelo menos 6 caracteres.', 'weak-password');
}
