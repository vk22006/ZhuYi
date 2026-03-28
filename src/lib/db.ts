/**
 * db.ts – Shared IndexedDB layer for ZhuYi
 *
 * Database : "zhuyi-db"  (version 1)
 * Object stores:
 *   • todos    – keyPath: "id"
 *   • projects – keyPath: "id"
 *   • settings – keyPath: "key"  (single row: { key: "settings", ...data })
 *
 * All public helpers are async and browser-safe (they no-op on SSR).
 */

import { browser } from '$app/environment';

const DB_NAME = 'zhuyi-db';
const DB_VERSION = 1;

// ─── Open / upgrade ──────────────────────────────────────────────────────────

let _db: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
    if (_db) return Promise.resolve(_db);

    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('todos')) {
                db.createObjectStore('todos', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('projects')) {
                db.createObjectStore('projects', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        };

        req.onsuccess = (event) => {
            _db = (event.target as IDBOpenDBRequest).result;
            resolve(_db);
        };

        req.onerror = () => reject(req.error);
    });
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

type StoreName = 'todos' | 'projects' | 'settings';

export async function dbGetAll<T>(store: StoreName): Promise<T[]> {
    if (!browser) return [];
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly');
        const req = tx.objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
    });
}

export async function dbGet<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
    if (!browser) return undefined;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly');
        const req = tx.objectStore(store).get(key);
        req.onsuccess = () => resolve(req.result as T | undefined);
        req.onerror = () => reject(req.error);
    });
}

export async function dbPut(store: StoreName, value: object): Promise<void> {
    if (!browser) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        const req = tx.objectStore(store).put(value);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

export async function dbDelete(store: StoreName, key: IDBValidKey): Promise<void> {
    if (!browser) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        const req = tx.objectStore(store).delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

export async function dbPutAll(store: StoreName, values: object[]): Promise<void> {
    if (!browser || values.length === 0) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        const os = tx.objectStore(store);
        for (const v of values) os.put(v);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function dbClear(store: StoreName): Promise<void> {
    if (!browser) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        const req = tx.objectStore(store).clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

// ─── One-time localStorage → IndexedDB migration ─────────────────────────────

const MIGRATION_FLAG = 'zhuyi:idb-migrated';

export async function migrateFromLocalStorage(): Promise<void> {
    if (!browser) return;
    if (localStorage.getItem(MIGRATION_FLAG)) return; // already done

    const migrations: Promise<void>[] = [];

    // Todos
    const rawTodos = localStorage.getItem('zhuyi:tasks');
    if (rawTodos) {
        try {
            const todos = JSON.parse(rawTodos);
            if (Array.isArray(todos) && todos.length > 0) {
                migrations.push(dbPutAll('todos', todos));
            }
        } catch { /* ignore */ }
    }

    // Projects
    const rawProjects = localStorage.getItem('zhuyi:projects');
    if (rawProjects) {
        try {
            const projects = JSON.parse(rawProjects);
            if (Array.isArray(projects) && projects.length > 0) {
                migrations.push(dbPutAll('projects', projects));
            }
        } catch { /* ignore */ }
    }

    // Settings
    const rawSettings = localStorage.getItem('zhuyi:settings');
    if (rawSettings) {
        try {
            const settings = JSON.parse(rawSettings);
            migrations.push(dbPut('settings', { key: 'settings', ...settings }));
        } catch { /* ignore */ }
    }

    await Promise.all(migrations);
    localStorage.setItem(MIGRATION_FLAG, '1');
}
