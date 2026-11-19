/**
 * Testes das regras do Firestore (firestore.rules).
 * Rodam contra o emulador:  npm run test:rules
 *
 * Personagens: alice e bob namoram; carol é amiga da alice; eve é estranha.
 */
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import {
  deleteDoc,
  deleteField,
  doc,
  Firestore,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const pairId = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`);
const AB = pairId('alice', 'bob');
const AC = pairId('alice', 'carol');
const CODE = 'abcdefghijkmnpqrstuvw'; // 21 chars
const inAWeek = () => Timestamp.fromMillis(Date.now() + 6 * 24 * 3600 * 1000);

let env: RulesTestEnvironment;
const as = (uid: string): Firestore => env.authenticatedContext(uid).firestore() as unknown as Firestore;
const anon = (): Firestore => env.unauthenticatedContext().firestore() as unknown as Firestore;

/** Estado base, gravado sem regras. */
async function seed(extra?: (db: Firestore) => Promise<void>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    for (const [uid, name] of [['alice', 'Alice'], ['bob', 'Bob'], ['carol', 'Carol'], ['eve', 'Eve']]) {
      await setDoc(doc(db, 'users', uid), { name });
    }
    await setDoc(doc(db, 'connections', AB), {
      members: ['alice', 'bob'], relation: 'namoro', confirmedBy: { alice: true, bob: true },
      inviteCode: 'x', createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });
    await setDoc(doc(db, 'connections', AC), {
      members: ['alice', 'carol'], relation: 'amizade', confirmedBy: { alice: true, carol: true },
      inviteCode: 'y', createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });
    await setDoc(doc(db, 'statuses', 'alice'), {
      mood: 'alegre', note: 'oi', topics: [], viewers: ['bob'], sharedAt: Timestamp.now(),
    });
    await setDoc(doc(db, 'connections', AB, 'intimate', 'bob'), { values: { sexo: 70 }, updatedAt: Timestamp.now() });
    await setDoc(doc(db, 'connections', AB, 'wants', 'bob'), { values: { carinho: 80 }, updatedAt: Timestamp.now() });
    if (extra) await extra(db);
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'moodometro-rules-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
afterAll(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await seed();
});

// ------------------------------------------------------------------
describe('users', () => {
  it('lê o próprio perfil e o de quem está conectado', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), 'users', 'alice')));
    await assertSucceeds(getDoc(doc(as('alice'), 'users', 'bob')));
  });
  it('não lê perfil de estranho nem sem login', async () => {
    await assertFails(getDoc(doc(as('eve'), 'users', 'alice')));
    await assertFails(getDoc(doc(anon(), 'users', 'alice')));
  });
  it('só escreve o próprio, com chaves permitidas', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'users', 'alice'), { name: 'Alice', moodLabels: { choroso: 'Chorão' } }));
    await assertFails(setDoc(doc(as('eve'), 'users', 'alice'), { name: 'hack' }));
    await assertFails(setDoc(doc(as('alice'), 'users', 'alice'), { name: 'Alice', admin: true }));
    await assertFails(setDoc(doc(as('alice'), 'users', 'alice'), { name: '' }));
    await assertFails(setDoc(doc(as('alice'), 'users', 'alice'), { name: 'A', moodLabels: { feliz: 'x' } }));
  });
});

// ------------------------------------------------------------------
describe('statuses', () => {
  it('viewer conectado lê; quem não é viewer não lê', async () => {
    await assertSucceeds(getDoc(doc(as('bob'), 'statuses', 'alice')));
    await assertFails(getDoc(doc(as('carol'), 'statuses', 'alice'))); // conectada, mas não é viewer
    await assertFails(getDoc(doc(as('eve'), 'statuses', 'alice')));
  });
  it('perde acesso ao desfazer a conexão, mesmo continuando em viewers', async () => {
    await assertSucceeds(deleteDoc(doc(as('bob'), 'connections', AB)));
    await assertFails(getDoc(doc(as('bob'), 'statuses', 'alice')));
  });
  it('status que ainda não existe pode ser lido (vazio)', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), 'statuses', 'carol')));
  });
  it('listar status é proibido', async () => {
    await assertFails(getDocs(query(collection(as('bob'), 'statuses'), where('viewers', 'array-contains', 'bob'))));
  });
  it('compartilhar exige hora do servidor e campos válidos', async () => {
    const ok = { mood: 'carente', note: 'oi', topics: ['Nós dois'], viewers: ['alice'], sharedAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(as('bob'), 'statuses', 'bob'), ok));
    await assertFails(setDoc(doc(as('bob'), 'statuses', 'bob'), { ...ok, sharedAt: Timestamp.fromMillis(0) }));
    await assertFails(setDoc(doc(as('bob'), 'statuses', 'bob'), { ...ok, mood: 'feliz' }));
    await assertFails(setDoc(doc(as('bob'), 'statuses', 'bob'), { ...ok, viewers: ['bob'] }));
    await assertFails(setDoc(doc(as('bob'), 'statuses', 'bob'), { ...ok, note: 'x'.repeat(281) }));
    await assertFails(setDoc(doc(as('eve'), 'statuses', 'bob'), ok));
  });
  it('dá pra tirar alguém de viewers sem mudar a hora', async () => {
    await assertSucceeds(updateDoc(doc(as('alice'), 'statuses', 'alice'), { viewers: [] }));
  });
});

// ------------------------------------------------------------------
describe('convites', () => {
  const invite = (from = 'alice', relation = 'amizade') => ({
    from, fromName: 'Alice', label: 'Dani', relation,
    createdAt: serverTimestamp(), expiresAt: inAWeek(), usedBy: null,
  });

  it('cria convite próprio; código curto, outra pessoa ou validade longa falham', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'invites', CODE), invite()));
    await assertFails(setDoc(doc(as('alice'), 'invites', 'curto'), invite()));
    await assertFails(setDoc(doc(as('alice'), 'invites', CODE + 'b'), invite('bob')));
    await assertFails(setDoc(doc(as('alice'), 'invites', CODE + 'c'), {
      ...invite(), expiresAt: Timestamp.fromMillis(Date.now() + 30 * 24 * 3600 * 1000),
    }));
  });

  it('quem tem o código lê; listar só os próprios', async () => {
    await setDoc(doc(as('alice'), 'invites', CODE), invite());
    await assertSucceeds(getDoc(doc(as('eve'), 'invites', CODE)));
    await assertSucceeds(getDocs(query(collection(as('alice'), 'invites'), where('from', '==', 'alice'))));
    await assertFails(getDocs(query(collection(as('eve'), 'invites'), where('from', '==', 'alice'))));
  });

  async function accept(db: Firestore, uid: string, from: string, relation: string, code = CODE) {
    const b = writeBatch(db);
    b.set(doc(db, 'connections', pairId(uid, from)), {
      members: [uid, from], relation, confirmedBy: { [uid]: true, [from]: true },
      inviteCode: code, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    b.update(doc(db, 'invites', code), { usedBy: uid });
    return b.commit();
  }

  it('aceitar cria a conexão e marca o convite no mesmo batch', async () => {
    await setDoc(doc(as('alice'), 'invites', CODE), invite());
    await assertSucceeds(accept(as('eve'), 'eve', 'alice', 'amizade'));
  });

  it('não dá pra aceitar trocando a relação (amizade → namoro)', async () => {
    await setDoc(doc(as('alice'), 'invites', CODE), invite());
    await assertFails(accept(as('eve'), 'eve', 'alice', 'namoro'));
  });

  it('não dá pra criar conexão sem marcar o convite, nem reusar', async () => {
    await setDoc(doc(as('alice'), 'invites', CODE), invite());
    const db = as('eve');
    await assertFails(setDoc(doc(db, 'connections', pairId('eve', 'alice')), {
      members: ['eve', 'alice'], relation: 'amizade', confirmedBy: { eve: true, alice: true },
      inviteCode: CODE, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    }));
    await assertSucceeds(accept(db, 'eve', 'alice', 'amizade'));
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, 'users', 'zoe'), { name: 'Zoe' });
    });
    await assertFails(accept(as('zoe'), 'zoe', 'alice', 'amizade')); // já usado
  });

  it('convite expirado não pode ser aceito', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, 'invites', CODE), {
        from: 'alice', fromName: 'Alice', label: 'Dani', relation: 'amizade',
        createdAt: Timestamp.now(), expiresAt: Timestamp.fromMillis(Date.now() - 1000), usedBy: null,
      });
    });
    await assertFails(accept(as('eve'), 'eve', 'alice', 'amizade'));
  });

  it('não aceita o próprio convite', async () => {
    await setDoc(doc(as('alice'), 'invites', CODE), invite());
    await assertFails(accept(as('alice'), 'alice', 'alice', 'amizade'));
  });
});

// ------------------------------------------------------------------
describe('conexões e confirmação', () => {
  it('só membros leem', async () => {
    await assertSucceeds(getDoc(doc(as('bob'), 'connections', AB)));
    await assertFails(getDoc(doc(as('eve'), 'connections', AB)));
  });

  it('propor outra relação zera as confirmações e deixa só a minha', async () => {
    await assertSucceeds(updateDoc(doc(as('alice'), 'connections', AB), {
      relation: 'amizade', confirmedBy: { alice: true }, updatedAt: serverTimestamp(),
    }));
  });

  it('não dá pra propor confirmando pelo outro', async () => {
    await assertFails(updateDoc(doc(as('alice'), 'connections', AB), {
      relation: 'amizade', confirmedBy: { alice: true, bob: true }, updatedAt: serverTimestamp(),
    }));
  });

  it('cada um confirma ou retira só a própria confirmação', async () => {
    await assertSucceeds(updateDoc(doc(as('alice'), 'connections', AB), {
      'confirmedBy.alice': deleteField(), updatedAt: serverTimestamp(),
    }));
    await assertFails(updateDoc(doc(as('alice'), 'connections', AB), {
      'confirmedBy.bob': deleteField(), updatedAt: serverTimestamp(),
    }));
    await assertSucceeds(updateDoc(doc(as('alice'), 'connections', AB), {
      'confirmedBy.alice': true, updatedAt: serverTimestamp(),
    }));
  });

  it('não dá pra trocar os membros', async () => {
    await assertFails(updateDoc(doc(as('alice'), 'connections', AB), {
      members: ['alice', 'eve'], updatedAt: serverTimestamp(),
    }));
  });

  it('estranho não mexe', async () => {
    await assertFails(updateDoc(doc(as('eve'), 'connections', AB), {
      'confirmedBy.eve': true, updatedAt: serverTimestamp(),
    }));
    await assertFails(deleteDoc(doc(as('eve'), 'connections', AB)));
  });
});

// ------------------------------------------------------------------
describe('wants (o que eu quero)', () => {
  const w = (values: Record<string, unknown>) => ({ values, updatedAt: serverTimestamp() });

  it('membros leem; estranho não', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), 'connections', AB, 'wants', 'bob')));
    await assertFails(getDoc(doc(as('eve'), 'connections', AB, 'wants', 'bob')));
  });
  it('cada um escreve só o seu, com chaves conhecidas e 0–100', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'connections', AB, 'wants', 'alice'), w({ carinho: 70, comida: 0 })));
    await assertFails(setDoc(doc(as('alice'), 'connections', AB, 'wants', 'bob'), w({ carinho: 70 })));
    await assertFails(setDoc(doc(as('alice'), 'connections', AB, 'wants', 'alice'), w({ carinho: 101 })));
    await assertFails(setDoc(doc(as('alice'), 'connections', AB, 'wants', 'alice'), w({ carinho: 50.5 })));
    await assertFails(setDoc(doc(as('alice'), 'connections', AB, 'wants', 'alice'), w({ dinheiro: 50 })));
    await assertFails(setDoc(doc(as('alice'), 'connections', AB, 'wants', 'alice'), w({ sexo: 50 }))); // íntimo no lugar errado
  });
});

// ------------------------------------------------------------------
describe('intimate (parte íntima)', () => {
  const w = (values: Record<string, unknown>) => ({ values, updatedAt: serverTimestamp() });
  const ref = (db: Firestore, uid: string, conn = AB) => doc(db, 'connections', conn, 'intimate', uid);

  it('aberto em namoro com os dois confirmados', async () => {
    await assertSucceeds(getDoc(ref(as('alice'), 'bob')));
    await assertSucceeds(setDoc(ref(as('alice'), 'alice'), w({ sexo: 40, intensidade: 60 })));
  });

  it('nunca aberto pra estranho', async () => {
    await assertFails(getDoc(ref(as('eve'), 'bob')));
  });

  it('fechado em amizade', async () => {
    await assertFails(getDoc(ref(as('alice'), 'carol', AC)));
    await assertFails(setDoc(ref(as('alice'), 'alice', AC), w({ sexo: 40 })));
  });

  it('fecha na hora quando alguém propõe rebaixar pra amizade', async () => {
    await updateDoc(doc(as('bob'), 'connections', AB), {
      relation: 'amizade', confirmedBy: { bob: true }, updatedAt: serverTimestamp(),
    });
    await assertFails(getDoc(ref(as('alice'), 'bob')));
    await assertFails(getDoc(ref(as('bob'), 'bob')));
  });

  it('fecha quando qualquer um retira a confirmação', async () => {
    await updateDoc(doc(as('bob'), 'connections', AB), {
      'confirmedBy.bob': deleteField(), updatedAt: serverTimestamp(),
    });
    await assertFails(getDoc(ref(as('alice'), 'bob')));
    await assertFails(setDoc(ref(as('alice'), 'alice'), w({ sexo: 40 })));
  });

  it('fecha quando proposto namoro mas o outro ainda não confirmou', async () => {
    await updateDoc(doc(as('alice'), 'connections', AC), {
      relation: 'namoro', confirmedBy: { alice: true }, updatedAt: serverTimestamp(),
    });
    await assertFails(setDoc(ref(as('alice'), 'alice', AC), w({ sexo: 40 })));
  });

  it('valida chaves e valores', async () => {
    await assertFails(setDoc(ref(as('alice'), 'alice'), w({ carinho: 40 })));
    await assertFails(setDoc(ref(as('alice'), 'alice'), w({ sexo: -1 })));
  });

  it('apagar o próprio dado íntimo é sempre permitido', async () => {
    await updateDoc(doc(as('bob'), 'connections', AB), {
      'confirmedBy.bob': deleteField(), updatedAt: serverTimestamp(),
    });
    await assertSucceeds(deleteDoc(ref(as('bob'), 'bob')));
  });
});
