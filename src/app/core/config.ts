/**
 * Configuração do app.
 *
 * mode: 'demo'     → contas (usuário e senha) e dados só no navegador (localStorage). Sem rede.
 * mode: 'firebase' → login real com usuário e senha (Firebase Auth) + dados no Firestore.
 *
 * Para ligar o modo firebase:
 * 1. Console do Firebase → crie um projeto e um app Web; cole o config abaixo.
 * 2. Authentication → Sign-in method → ative "E-mail/senha". O usuário vira um e-mail
 *    sintético (ruan@usuarios.moodometro.app), então o próprio Firebase garante que é único.
 * 3. Authentication → Settings → Authorized domains: o domínio onde o app roda.
 * 4. Firestore Database → criar (modo produção). Depois, no terminal:
 *      npx firebase login
 *      npx firebase use <id-do-projeto>
 *      npx firebase deploy --only firestore
 * 5. Troque mode para 'firebase'.
 *
 * useEmulators: true → aponta Auth e Firestore pros emuladores locais
 * (npm run emulators). Bom pra desenvolver sem mexer em dado real.
 */
export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

export interface AppConfig {
  mode: 'demo' | 'firebase';
  firebase: FirebaseWebConfig | null;
  useEmulators: boolean;
}

export const APP_CONFIG: AppConfig = {
  mode: 'demo',
  firebase: null,
  // firebase: {
  //   apiKey: '...',
  //   authDomain: 'seu-projeto.firebaseapp.com',
  //   projectId: 'seu-projeto',
  //   appId: '...',
  // },
  useEmulators: false,
};

export const isFirebaseMode = APP_CONFIG.mode === 'firebase' && APP_CONFIG.firebase !== null;
