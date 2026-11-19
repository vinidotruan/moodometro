import type { Auth, User, UserCredential } from 'firebase/auth';
import { firebaseAuth } from '../firebase';
import { AuthBackend, AuthError, AuthProviderId, AuthUser } from './auth.types';

/**
 * Login real via Firebase Authentication (Google + Apple).
 * O SDK é carregado sob demanda: no modo demo ele nem é baixado.
 */
export class FirebaseAuthBackend implements AuthBackend {
  readonly kind = 'firebase' as const;
  private auth?: Auth;
  private sdk?: typeof import('firebase/auth');

  async init(onChange: (user: AuthUser | null) => void): Promise<void> {
    const [auth, sdk] = await Promise.all([firebaseAuth(), import('firebase/auth')]);
    this.sdk = sdk;
    this.auth = auth;

    // Volta de um signInWithRedirect (fluxo usado quando o popup é bloqueado).
    await sdk.getRedirectResult(this.auth).catch(() => null);

    await new Promise<void>((resolve) => {
      sdk.onAuthStateChanged(this.auth!, (u) => {
        onChange(u ? this.toUser(u) : null);
        resolve();
      });
    });
  }

  async signIn(provider: AuthProviderId): Promise<AuthUser> {
    const { auth, sdk } = this.ready();
    const p =
      provider === 'google'
        ? new sdk.GoogleAuthProvider()
        : (() => {
            const apple = new sdk.OAuthProvider('apple.com');
            apple.addScope('email');
            apple.addScope('name');
            apple.setCustomParameters({ locale: 'pt_BR' });
            return apple;
          })();

    try {
      const cred: UserCredential = await sdk.signInWithPopup(auth, p);
      return this.toUser(cred.user);
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await sdk.signInWithRedirect(auth, p); // a página recarrega e o init() pega o resultado
        throw new AuthError('Redirecionando…', 'popup-blocked');
      }
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        throw new AuthError('Login cancelado', 'cancelled');
      }
      throw new AuthError('Não deu pra entrar agora. Tenta de novo?', 'unknown');
    }
  }

  async signOut(): Promise<void> {
    const { auth, sdk } = this.ready();
    await sdk.signOut(auth);
  }

  private ready() {
    if (!this.auth || !this.sdk) throw new AuthError('Firebase não inicializado', 'not-configured');
    return { auth: this.auth, sdk: this.sdk };
  }

  private toUser(u: User): AuthUser {
    const providerId = u.providerData[0]?.providerId;
    return {
      uid: u.uid,
      // A Apple só manda o nome no PRIMEIRO login; depois disso vem vazio.
      name: u.displayName ?? u.email?.split('@')[0] ?? 'Você',
      email: u.email,
      provider: providerId === 'apple.com' ? 'apple' : 'google',
    };
  }
}
