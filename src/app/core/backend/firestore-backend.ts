import { computed, signal } from '@angular/core';
import type * as FS from 'firebase/firestore';
import { Mood, Relation } from '../../../lib/ui';
import { AuthUser } from '../auth/auth.types';
import { firestore } from '../firebase';
import { storage } from '../storage';
import { Backend, EMPTY_MOOD_PREFS, InvitePreview, isIntimateWant, MoodPrefs, MyDay, newInviteCode, Person, WANTS } from './types';

// ---------- formato dos documentos (espelha firestore.rules) ----------
interface ConnDoc {
  members: string[];
  relation: Relation;
  confirmedBy: Record<string, boolean>;
}
interface StatusDoc {
  mood: Mood;
  note: string;
  topics: string[];
  viewers: string[];
  sharedAt: FS.Timestamp | null;
}
interface InviteDoc {
  from: string;
  fromName: string;
  label: string;
  relation: Relation;
  createdAt: FS.Timestamp | null;
  expiresAt: FS.Timestamp;
  usedBy: string | null;
}
interface WantsDoc {
  values: Record<string, number>;
}

type Unsub = () => void;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RETRY_MS = 60_000;
const DRAFT_KEY = 'mm.draft';
const EMPTY_DRAFT: MyDay = { mood: null, note: '', topics: [], viewers: [], sharedAt: null };

export const pairId = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`);
const iso = (t: FS.Timestamp | null | undefined) => (t ? t.toDate().toISOString() : null);

/**
 * Dados no Firestore, em tempo real.
 * Cada parte do estado é um signal alimentado por um onSnapshot; `people` junta tudo.
 */
export class FirestoreBackend implements Backend {
  readonly kind = 'firestore' as const;

  private sdk!: typeof FS;
  private db!: FS.Firestore;
  private user: AuthUser | null = null;
  private uid = '';

  private globalSubs: Unsub[] = [];
  private connSubs = new Map<string, Unsub[]>();
  private intimateSubs = new Map<string, Unsub[]>();
  private retryTimers: ReturnType<typeof setTimeout>[] = [];
  private writeTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // ---------- estado cru ----------
  private readonly draft = signal<MyDay>(storage.get(DRAFT_KEY, EMPTY_DRAFT));
  private readonly myStatus = signal<StatusDoc | null>(null);
  private readonly connections = signal<Record<string, ConnDoc>>({});
  private readonly names = signal<Record<string, string>>({});
  private readonly statuses = signal<Record<string, StatusDoc | null>>({});
  /** chave: `${connId}/${uid}/wants|intimate` */
  private readonly wantDocs = signal<Record<string, Record<string, number>>>({});
  private readonly invites = signal<{ code: string; data: InviteDoc }[]>([]);

  private readonly labels = signal<Partial<Record<Mood, string>>>({});
  /** No Firestore, por enquanto, só os nomes dos 6 humores padrão. */
  readonly moodPrefs = computed<MoodPrefs>(() => ({ ...EMPTY_MOOD_PREFS, labels: this.labels() }));
  readonly canCustomizeMoods = false;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // ---------- estado derivado ----------
  readonly me = computed<MyDay>(() => ({ ...this.draft(), sharedAt: iso(this.myStatus()?.sharedAt) }));

  readonly people = computed<Person[]>(() => {
    const uid = this.uid;
    const conns = this.connections();
    const names = this.names();
    const statuses = this.statuses();
    const wants = this.wantDocs();

    const connected = Object.entries(conns).map(([id, c]): Person => {
      const other = c.members.find((m) => m !== uid) ?? '';
      const st = statuses[other];
      return {
        id: other,
        name: names[other] ?? '…',
        relation: c.relation,
        confirmedByMe: !!c.confirmedBy[uid],
        confirmedByThem: !!c.confirmedBy[other],
        mood: st?.mood ?? null,
        topic: st ? st.note || st.topics.join(', ') || null : null,
        when: iso(st?.sharedAt),
        theirWants: { ...wants[`${id}/${other}/wants`], ...wants[`${id}/${other}/intimate`] },
        myWants: { ...wants[`${id}/${uid}/wants`], ...wants[`${id}/${uid}/intimate`] },
      };
    });

    const pending = this.invites().map(({ code, data }): Person => ({
      id: code,
      inviteCode: code,
      name: data.label,
      relation: data.relation,
      pending: true,
      confirmedByMe: true,
      confirmedByThem: false,
      mood: null,
      topic: null,
      when: null,
      theirWants: {},
      myWants: {},
    }));

    return [...connected.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')), ...pending];
  });

  // ---------- ciclo de vida ----------
  async start(user: AuthUser): Promise<void> {
    if (this.uid === user.uid) return;
    this.stop();
    this.user = user;
    this.uid = user.uid;
    this.loading.set(true);

    const [sdk, db] = await Promise.all([import('firebase/firestore'), firestore()]);
    this.sdk = sdk;
    this.db = db;
    const { doc, collection, query, where, orderBy, onSnapshot, getDoc, setDoc, serverTimestamp } = sdk;

    try {
      // Cria o perfil só no primeiro login (a Apple só manda o nome nessa vez).
      const profileRef = doc(db, 'users', this.uid);
      const profile = await getDoc(profileRef);
      if (!profile.exists()) await setDoc(profileRef, { name: user.name.slice(0, 60), updatedAt: serverTimestamp() });
    } catch (e) {
      this.fail('Não deu pra carregar seu perfil', e);
    }

    this.globalSubs.push(
      onSnapshot(doc(db, 'users', this.uid), (s) => this.labels.set((s.data()?.['moodLabels'] as Partial<Record<Mood, string>>) ?? {}), (e) => this.fail('perfil', e)),

      onSnapshot(doc(db, 'statuses', this.uid), (s) => {
        const st = (s.data() as StatusDoc | undefined) ?? null;
        this.myStatus.set(st);
        // Primeira carga num aparelho novo: começa o rascunho a partir do que já foi compartilhado.
        if (st && this.draft().mood === null) {
          this.setDraft({ mood: st.mood, note: st.note, topics: st.topics, viewers: st.viewers, sharedAt: null });
        }
      }, (e) => this.fail('status', e)),

      onSnapshot(query(collection(db, 'connections'), where('members', 'array-contains', this.uid)), (snap) => {
        const next: Record<string, ConnDoc> = {};
        snap.forEach((d) => (next[d.id] = d.data() as ConnDoc));
        this.syncConnectionListeners(next);
        this.connections.set(next);
        this.loading.set(false);
      }, (e) => this.fail('conexões', e)),

      onSnapshot(
        query(collection(db, 'invites'), where('from', '==', this.uid), where('usedBy', '==', null), orderBy('createdAt', 'desc')),
        (snap) => this.invites.set(snap.docs.map((d) => ({ code: d.id, data: d.data() as InviteDoc }))),
        (e) => this.fail('convites', e),
      ),
    );
  }

  stop(): void {
    this.globalSubs.forEach((u) => u());
    this.connSubs.forEach((l) => l.forEach((u) => u()));
    this.intimateSubs.forEach((l) => l.forEach((u) => u()));
    this.retryTimers.forEach(clearTimeout);
    this.writeTimers.forEach(clearTimeout);
    this.globalSubs = [];
    this.connSubs.clear();
    this.intimateSubs.clear();
    this.retryTimers = [];
    this.writeTimers.clear();
    this.uid = '';
    this.user = null;
    this.myStatus.set(null);
    this.connections.set({});
    this.names.set({});
    this.statuses.set({});
    this.wantDocs.set({});
    this.invites.set([]);
    this.labels.set({});
    this.loading.set(true);
  }

  // ---------- listeners por conexão ----------
  private syncConnectionListeners(next: Record<string, ConnDoc>): void {
    for (const [id, subs] of this.connSubs) {
      if (!next[id]) {
        subs.forEach((u) => u());
        this.connSubs.delete(id);
        this.closeIntimate(id);
      }
    }
    for (const [id, c] of Object.entries(next)) {
      const other = c.members.find((m) => m !== this.uid)!;
      if (!this.connSubs.has(id)) this.connSubs.set(id, this.openConnection(id, other));
      const open = c.relation === 'namoro' && c.members.every((m) => c.confirmedBy[m]);
      if (open && !this.intimateSubs.has(id)) this.intimateSubs.set(id, this.openIntimate(id, other));
      if (!open) this.closeIntimate(id);
    }
  }

  private openConnection(id: string, other: string): Unsub[] {
    const { doc, onSnapshot } = this.sdk;
    return [
      onSnapshot(doc(this.db, 'users', other), (s) => {
        const name = (s.data()?.['name'] as string | undefined) ?? 'Alguém';
        this.names.update((n) => ({ ...n, [other]: name }));
      }, () => {}),
      this.watchStatus(other),
      this.watchWants(id, other, 'wants'),
      this.watchWants(id, this.uid, 'wants'),
    ];
  }

  /** Status do outro: se negar acesso (não sou viewer), esconde e tenta de novo depois. */
  private watchStatus(other: string): Unsub {
    const { doc, onSnapshot } = this.sdk;
    let unsub: Unsub = () => {};
    let alive = true;
    const listen = () => {
      unsub = onSnapshot(
        doc(this.db, 'statuses', other),
        (s) => this.statuses.update((m) => ({ ...m, [other]: (s.data() as StatusDoc | undefined) ?? null })),
        () => {
          this.statuses.update((m) => ({ ...m, [other]: null }));
          if (alive) this.retryTimers.push(setTimeout(() => alive && listen(), RETRY_MS));
        },
      );
    };
    listen();
    return () => {
      alive = false;
      unsub();
    };
  }

  private watchWants(connId: string, uid: string, sub: 'wants' | 'intimate'): Unsub {
    const { doc, onSnapshot } = this.sdk;
    const key = `${connId}/${uid}/${sub}`;
    return onSnapshot(
      doc(this.db, 'connections', connId, sub, uid),
      (s) => {
        // Não sobrescreve o que estou arrastando agora (escrita pendente).
        if (uid === this.uid && this.writeTimers.has(key)) return;
        this.wantDocs.update((w) => ({ ...w, [key]: (s.data() as WantsDoc | undefined)?.values ?? {} }));
      },
      () => this.wantDocs.update((w) => ({ ...w, [key]: {} })),
    );
  }

  private openIntimate(id: string, other: string): Unsub[] {
    return [this.watchWants(id, other, 'intimate'), this.watchWants(id, this.uid, 'intimate')];
  }

  private closeIntimate(id: string): void {
    this.intimateSubs.get(id)?.forEach((u) => u());
    this.intimateSubs.delete(id);
    // Some da memória também, não só da tela.
    this.wantDocs.update((w) => Object.fromEntries(Object.entries(w).filter(([k]) => !(k.startsWith(`${id}/`) && k.endsWith('/intimate')))));
  }

  // ---------- escrita ----------
  private setDraft(d: MyDay): void {
    this.draft.set(d);
    storage.set(DRAFT_KEY, d);
  }

  updateDraft(patch: Partial<Omit<MyDay, 'sharedAt'>>): void {
    this.setDraft({ ...this.draft(), ...patch });
  }

  async shareMood(): Promise<void> {
    const d = this.draft();
    if (!d.mood) return;
    const connected = new Set(this.people().filter((p) => !p.pending).map((p) => p.id));
    const { doc, setDoc, serverTimestamp } = this.sdk;
    await setDoc(doc(this.db, 'statuses', this.uid), {
      mood: d.mood,
      note: d.note.slice(0, 280),
      topics: d.topics.slice(0, 10),
      viewers: d.viewers.filter((v) => connected.has(v)).slice(0, 50),
      sharedAt: serverTimestamp(),
    });
  }

  setMyWant(personId: string, wantId: string, value: number): void {
    const p = this.people().find((x) => x.id === personId);
    if (!p || p.pending) return;
    const connId = pairId(this.uid, personId);
    const sub = isIntimateWant(wantId) ? 'intimate' : 'wants';
    const key = `${connId}/${this.uid}/${sub}`;

    // Otimista: atualiza a tela na hora…
    const values = { ...this.wantDocs()[key], [wantId]: value };
    this.wantDocs.update((w) => ({ ...w, [key]: values }));

    // …e grava 400 ms depois do último movimento, só com as chaves desta relação.
    clearTimeout(this.writeTimers.get(key));
    this.writeTimers.set(key, setTimeout(async () => {
      const allowed = new Set(WANTS[p.relation].filter((w) => isIntimateWant(w.id) === (sub === 'intimate')).map((w) => w.id));
      const latest = this.wantDocs()[key] ?? {};
      const clean = Object.fromEntries(Object.entries(latest).filter(([k]) => allowed.has(k)).map(([k, v]) => [k, Math.round(v)]));
      const { doc, setDoc, serverTimestamp } = this.sdk;
      try {
        await setDoc(doc(this.db, 'connections', connId, sub, this.uid), { values: clean, updatedAt: serverTimestamp() });
      } catch (e) {
        this.fail('Não deu pra salvar', e);
      } finally {
        this.writeTimers.delete(key);
      }
    }, 400));
  }

  async renameMood(id: Mood, label: string): Promise<void> {
    const { doc, setDoc, serverTimestamp } = this.sdk;
    await setDoc(doc(this.db, 'users', this.uid), { moodLabels: { [id]: label.trim().slice(0, 30) }, updatedAt: serverTimestamp() }, { merge: true });
  }

  // Fotos e humores novos ainda não existem no Firestore (regras só aceitam os 6 padrão).
  async setMoodPhoto(): Promise<void> {
    throw new Error('Fotos de humor ainda não funcionam com o Firebase.');
  }

  async addMood(): Promise<Mood> {
    throw new Error('Humores novos ainda não funcionam com o Firebase.');
  }

  async removeMood(): Promise<void> {
    throw new Error('Humores novos ainda não funcionam com o Firebase.');
  }

  // ---------- convites ----------
  async createInvite(label: string, relation: Relation): Promise<string> {
    const code = newInviteCode();
    const { doc, setDoc, serverTimestamp, Timestamp } = this.sdk;
    await setDoc(doc(this.db, 'invites', code), {
      from: this.uid,
      fromName: (this.user?.name ?? 'Alguém').slice(0, 60),
      label: label.slice(0, 60),
      relation,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + INVITE_TTL_MS),
      usedBy: null,
    });
    return code;
  }

  async readInvite(code: string): Promise<InvitePreview | null> {
    const { doc, getDoc } = this.sdk;
    try {
      const s = await getDoc(doc(this.db, 'invites', code));
      if (!s.exists()) return null;
      const d = s.data() as InviteDoc;
      return {
        code,
        fromName: d.fromName,
        relation: d.relation,
        expired: d.expiresAt.toMillis() < Date.now(),
        used: d.usedBy !== null,
        mine: d.from === this.uid,
      };
    } catch {
      return null;
    }
  }

  async acceptInvite(code: string): Promise<string> {
    const { doc, getDoc, writeBatch, serverTimestamp } = this.sdk;
    const inviteRef = doc(this.db, 'invites', code);
    const s = await getDoc(inviteRef);
    if (!s.exists()) throw new Error('Convite não encontrado');
    const inv = s.data() as InviteDoc;
    if (inv.from === this.uid) throw new Error('Esse convite é seu');
    if (inv.usedBy) throw new Error('Esse convite já foi usado');
    if (inv.expiresAt.toMillis() < Date.now()) throw new Error('Esse convite expirou');

    // Os dois writes vão juntos: as regras checam um contra o outro (getAfter / existsAfter).
    const batch = writeBatch(this.db);
    batch.set(doc(this.db, 'connections', pairId(this.uid, inv.from)), {
      members: [this.uid, inv.from],
      relation: inv.relation,
      confirmedBy: { [this.uid]: true, [inv.from]: true },
      inviteCode: code,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.update(inviteRef, { usedBy: this.uid });
    try {
      await batch.commit();
    } catch {
      throw new Error('Não deu pra aceitar. Vocês já estão conectados?');
    }
    return inv.from;
  }

  async cancelInvite(code: string): Promise<void> {
    const { doc, deleteDoc } = this.sdk;
    await deleteDoc(doc(this.db, 'invites', code));
  }

  // ---------- relação ----------
  async proposeRelation(personId: string, relation: Relation): Promise<void> {
    const { doc, updateDoc, serverTimestamp } = this.sdk;
    await updateDoc(doc(this.db, 'connections', pairId(this.uid, personId)), {
      relation,
      confirmedBy: { [this.uid]: true },
      updatedAt: serverTimestamp(),
    });
  }

  async setMyConfirmation(personId: string, confirmed: boolean): Promise<void> {
    const { doc, updateDoc, serverTimestamp, deleteField } = this.sdk;
    await updateDoc(doc(this.db, 'connections', pairId(this.uid, personId)), {
      [`confirmedBy.${this.uid}`]: confirmed ? true : deleteField(),
      updatedAt: serverTimestamp(),
    });
  }

  async disconnect(personId: string): Promise<void> {
    const { doc, deleteDoc, updateDoc, arrayRemove } = this.sdk;
    const connId = pairId(this.uid, personId);
    // Apaga meus dados nessa conexão antes de desfazer (depois as regras não deixam mais).
    await Promise.allSettled([
      deleteDoc(doc(this.db, 'connections', connId, 'wants', this.uid)),
      deleteDoc(doc(this.db, 'connections', connId, 'intimate', this.uid)),
    ]);
    await deleteDoc(doc(this.db, 'connections', connId));
    // Tira a pessoa da lista de quem vê meu humor (as regras já bloqueiam, isso é limpeza).
    if (this.myStatus()) {
      await updateDoc(doc(this.db, 'statuses', this.uid), { viewers: arrayRemove(personId) }).catch(() => {});
    }
    this.updateDraft({ viewers: this.draft().viewers.filter((v) => v !== personId) });
  }

  private fail(what: string, e: unknown): void {
    console.warn(`[firestore] ${what}`, e);
    this.error.set(what);
  }
}
