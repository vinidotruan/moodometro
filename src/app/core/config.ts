/**
 * Configuração do app.
 *
 * mode: 'demo'     → login simulado + dados no navegador (localStorage). Sem rede.
 * mode: 'firebase' → login real (Google + Apple) + dados no Firestore.
 *
 * Para ligar o modo firebase:
 * 1. Console do Firebase → crie um projeto e um app Web; cole o config abaixo.
 * 2. Authentication → Sign-in method → ative "Google" e "Apple".
 *    Apple: precisa de conta Apple Developer (paga). Crie um Services ID + chave
 *    "Sign in with Apple" e cole no provedor Apple do Firebase. Cadastre o
 *    redirect https://<projeto>.firebaseapp.com/__/auth/handler.
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
