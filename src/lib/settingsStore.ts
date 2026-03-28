import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { dbGet, dbPut } from '$lib/db';

export type Theme = 'light' | 'dark';
export type FontSize = 'small' | 'medium' | 'large';

export interface Settings {
    theme: Theme;
    fontSize: FontSize;
}

const IDB_KEY = 'settings';

const defaults: Settings = {
    theme: 'light',
    fontSize: 'medium'
};

/** Apply theme + font-size classes to the document immediately (browser only). */
export function applySettings(settings: Settings) {
    if (!browser) return;
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
    document.documentElement.classList.add(`font-${settings.fontSize}`);
}

function saveSettings(settings: Settings): Promise<void> {
    if (!browser) return Promise.resolve();
    return dbPut('settings', { key: IDB_KEY, ...settings });
}

function createSettingsStore() {
    const { subscribe, set, update } = writable<Settings>({ ...defaults });

    return {
        subscribe,

        /**
         * Async init – loads from IndexedDB and applies to DOM.
         * Call once inside onMount (or +layout.svelte onMount).
         */
        async init() {
            if (!browser) return;
            try {
                const stored = await dbGet<Settings & { key: string }>('settings', IDB_KEY);
                const loaded: Settings = stored
                    ? { theme: stored.theme ?? defaults.theme, fontSize: stored.fontSize ?? defaults.fontSize }
                    : { ...defaults };
                set(loaded);
                applySettings(loaded);
            } catch (err) {
                console.error('[settingsStore] Failed to load from IndexedDB', err);
                applySettings({ ...defaults });
            }
        },

        setTheme(theme: Theme) {
            update((s) => {
                const next = { ...s, theme };
                saveSettings(next);
                applySettings(next);
                return next;
            });
        },

        setFontSize(fontSize: FontSize) {
            update((s) => {
                const next = { ...s, fontSize };
                saveSettings(next);
                applySettings(next);
                return next;
            });
        },

        reset() {
            const next = { ...defaults };
            set(next);
            saveSettings(next);
            applySettings(next);
        }
    };
}

export const settingsStore = createSettingsStore();
