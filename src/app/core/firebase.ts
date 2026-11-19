import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { APP_CONFIG } from './config';

/** Instâncias do Firebase criadas sob demanda (o SDK nem é baixado no modo demo). */
let app: Promise<FirebaseApp> | undefined;
let auth: Promise<Auth> | undefined;
let db: Promise<Firestore> | undefined;

export function firebaseApp(): Promise<FirebaseApp> {
  if (!APP_CONFIG.firebase) throw new Error('APP_CONFIG.firebase não configurado');
  const cfg = APP_CONFIG.firebase;
  app ??= import('firebase/app').then(({ initializeApp }) => initializeApp(cfg));
  return app;
}

export function firebaseAuth(): Promise<Auth> {
  auth ??= Promise.all([firebaseApp(), import('firebase/auth')]).then(([a, sdk]) => {
    const instance = sdk.getAuth(a);
    instance.languageCode = 'pt-BR';
    if (APP_CONFIG.useEmulators) sdk.connectAuthEmulator(instance, 'http://localhost:9099', { disableWarnings: true });
    return instance;
  });
  return auth;
}

export function firestore(): Promise<Firestore> {
  db ??= Promise.all([firebaseApp(), import('firebase/firestore')]).then(([a, sdk]) => {
    // Cache persistente: o app abre com os últimos dados mesmo offline.
    const instance = sdk.initializeFirestore(a, {
      localCache: sdk.persistentLocalCache({ tabManager: sdk.persistentMultipleTabManager() }),
    });
    if (APP_CONFIG.useEmulators) sdk.connectFirestoreEmulator(instance, 'localhost', 8080);
    return instance;
  });
  return db;
}
