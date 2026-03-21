import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';
export type FontSize = 'small' | 'medium' | 'large';

export interface Settings {
    theme: Theme;
    fontSize: FontSize;
}

const STORAGE_KEY = 'zhuyi:settings';

const defaults: Settings = {
    theme: 'light',
    fontSize: 'medium'
};

function loadSettings(): Settings {
    if (!browser) return { ...defaults };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch {
        // ignore parse errors
    }
    return { ...defaults };
}

function saveSettings(settings: Settings) {
    if (!browser) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/** Apply theme + font-size classes to the document immediately (browser only). */
export function applySettings(settings: Settings) {
    if (!browser) return;

    // Theme: toggle "dark" class on <html>
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');

    // Font size: set a class on <html> so rem-based Tailwind utilities scale
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
    document.documentElement.classList.add(`font-${settings.fontSize}`);
}

function createSettingsStore() {
    const { subscribe, set, update } = writable<Settings>(loadSettings());

    return {
        subscribe,

        /** Initialise from localStorage and apply to the DOM. Call inside onMount. */
        init() {
            const loaded = loadSettings();
            set(loaded);
            applySettings(loaded);
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
