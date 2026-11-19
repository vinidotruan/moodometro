import { storage } from '../storage';
import { AuthBackend, AuthProviderId, AuthUser } from './auth.types';

const KEY = 'mm.demo.user';

/** Login simulado: nenhuma chamada de rede, só pra navegar pelo app. */
export class DemoAuthBackend implements AuthBackend {
  readonly kind = 'demo' as const;
  private notify: (u: AuthUser | null) => void = () => {};

  async init(onChange: (user: AuthUser | null) => void): Promise<void> {
    this.notify = onChange;
    onChange(storage.get<AuthUser | null>(KEY, null));
  }

  async signIn(provider: AuthProviderId): Promise<AuthUser> {
    await new Promise((r) => setTimeout(r, 600)); // simula o vai-e-volta do provedor
    const user: AuthUser = {
      uid: `demo-${provider}`,
      name: 'Ruan',
      email: provider === 'apple' ? 'xxxxx@privaterelay.appleid.com' : 'ruan@gmail.com',
      provider,
    };
    storage.set(KEY, user);
    this.notify(user);
    return user;
  }

  async signOut(): Promise<void> {
    storage.remove(KEY);
    this.notify(null);
  }
}
