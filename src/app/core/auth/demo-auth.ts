import { storage } from '../storage';
import { AuthBackend, AuthError, AuthUser, checkNewAccount, normalizeUsername } from './auth.types';

const KEY = 'mm.demo.user';
const ACCOUNTS = 'mm.demo.accounts';

interface DemoAccount {
  name: string;
  salt: string;
  hash: string;
}

const WRONG = () => new AuthError('Usuário ou senha incorretos.', 'wrong-credentials');
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function hashPassword(password: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function newSalt(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Login simulado com usuário e senha: as contas ficam só neste navegador (localStorage),
 * com a senha em hash. Serve pra navegar pelo app; não é autenticação de verdade.
 */
export class DemoAuthBackend implements AuthBackend {
  readonly kind = 'demo' as const;
  private notify: (u: AuthUser | null) => void = () => {};

  async init(onChange: (user: AuthUser | null) => void): Promise<void> {
    this.notify = onChange;
    const saved = storage.get<AuthUser | null>(KEY, null);
    // Sessões antigas (login Apple/Google simulado) não têm username: pede login de novo.
    if (saved && !saved.username) storage.remove(KEY);
    onChange(saved?.username ? saved : null);
  }

  async signUp(rawUsername: string, name: string, password: string): Promise<AuthUser> {
    const username = normalizeUsername(rawUsername);
    checkNewAccount(name, password);
    await wait(300);
    const accounts = storage.get<Record<string, DemoAccount>>(ACCOUNTS, {});
    if (accounts[username]) throw new AuthError('Esse usuário já existe. Escolhe outro?', 'username-taken');
    const salt = newSalt();
    accounts[username] = { name: name.trim().slice(0, 40), salt, hash: await hashPassword(password, salt) };
    storage.set(ACCOUNTS, accounts);
    return this.enter(username, accounts[username].name);
  }

  async signIn(rawUsername: string, password: string): Promise<AuthUser> {
    let username: string;
    try {
      username = normalizeUsername(rawUsername);
    } catch {
      throw WRONG();
    }
    await wait(300);
    const acc = storage.get<Record<string, DemoAccount>>(ACCOUNTS, {})[username];
    if (!acc || (await hashPassword(password, acc.salt)) !== acc.hash) throw WRONG();
    return this.enter(username, acc.name);
  }

  async signOut(): Promise<void> {
    storage.remove(KEY);
    this.notify(null);
  }

  private enter(username: string, name: string): AuthUser {
    const user: AuthUser = { uid: `demo-${username}`, name, username };
    storage.set(KEY, user);
    this.notify(user);
    return user;
  }
}
