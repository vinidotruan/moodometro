import type { Auth, User } from 'firebase/auth';
import { firebaseAuth } from '../firebase';
import { AuthBackend, AuthError, AuthUser, checkNewAccount, normalizeUsername } from './auth.types';

/**
 * Login real via Firebase Authentication com usuário e senha.
 * O Firebase só tem e-mail + senha, então o usuário vira um e-mail sintético
 * (`ruan@usuarios.moodometro.app`): o próprio Firebase garante que ele é único.
 * No console: Authentication → Sign-in method → ative "E-mail/senha".
 * O SDK é carregado sob demanda: no modo demo ele nem é baixado.
 */
const DOMAIN = 'usuarios.moodometro.app';
const toEmail = (username: string) => `${username}@${DOMAIN}`;

export class FirebaseAuthBackend implements AuthBackend {
  readonly kind = 'firebase' as const;
  private auth?: Auth;
  private sdk?: typeof import('firebase/auth');

  async init(onChange: (user: AuthUser | null) => void): Promise<void> {
    const [auth, sdk] = await Promise.all([firebaseAuth(), import('firebase/auth')]);
    this.sdk = sdk;
    this.auth = auth;
    await new Promise<void>((resolve) => {
      sdk.onAuthStateChanged(this.auth!, (u) => {
        onChange(u ? this.toUser(u) : null);
        resolve();
      });
    });
  }

  async signUp(rawUsername: string, name: string, password: string): Promise<AuthUser> {
    const username = normalizeUsername(rawUsername);
    checkNewAccount(name, password);
    const { auth, sdk } = this.ready();
    try {
      const cred = await sdk.createUserWithEmailAndPassword(auth, toEmail(username), password);
      await sdk.updateProfile(cred.user, { displayName: name.trim().slice(0, 40) });
      return this.toUser(cred.user);
    } catch (e) {
      throw this.mapError(e);
    }
  }

  async signIn(rawUsername: string, password: string): Promise<AuthUser> {
    const { auth, sdk } = this.ready();
    try {
      const cred = await sdk.signInWithEmailAndPassword(auth, toEmail(normalizeUsername(rawUsername)), password);
      return this.toUser(cred.user);
    } catch (e) {
      throw e instanceof AuthError ? new AuthError('Usuário ou senha incorretos.', 'wrong-credentials') : this.mapError(e);
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

  private mapError(e: unknown): AuthError {
    const code = (e as { code?: string }).code ?? '';
    if (code === 'auth/email-already-in-use') return new AuthError('Esse usuário já existe. Escolhe outro?', 'username-taken');
    if (code === 'auth/weak-password') return new AuthError('A senha precisa ter pelo menos 6 caracteres.', 'weak-password');
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return new AuthError('Usuário ou senha incorretos.', 'wrong-credentials');
    }
    return new AuthError('Não deu pra entrar agora. Tenta de novo?', 'unknown');
  }

  private toUser(u: User): AuthUser {
    const username = (u.email ?? '').split('@')[0];
    return { uid: u.uid, name: u.displayName || username || 'Você', username };
  }
}
