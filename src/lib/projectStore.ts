import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProjectNote {
    id: string;
    text: string;
    createdAt: string;
}

export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface Project {
    id: string;
    title: string;
    description?: string;
    notes: ProjectNote[];
    deadline?: string; // ISO 8601 UTC
    status: ProjectStatus;
    createdAt: string;
    updatedAt: string;
}

// ─── Helpers (pure – no store dependency) ─────────────────────────────────────

export function isOverdue(project: Project): boolean {
    if (!project.deadline || project.status === 'completed') return false;
    return new Date(project.deadline).getTime() < Date.now();
}

export function isDueSoon(project: Project, days = 3): boolean {
    if (!project.deadline || project.status === 'completed') return false;
    const ms = new Date(project.deadline).getTime() - Date.now();
    return ms >= 0 && ms <= days * 24 * 60 * 60 * 1000;
}

export function formatDeadline(isoString: string | undefined): string {
    if (!isoString) return '';
    const diff = new Date(isoString).getTime() - Date.now();
    const absDiff = Math.abs(diff);
    const mins = Math.floor(absDiff / 60_000);
    const hours = Math.floor(absDiff / 3_600_000);
    const days = Math.floor(absDiff / 86_400_000);

    if (diff < 0) {
        // overdue
        if (mins < 60) return `${mins}m 前过期`;
        if (hours < 24) return `${hours}h 前过期`;
        return `${days}天 前过期`;
    } else {
        if (mins < 60) return `${mins}分钟后`;
        if (hours < 24) return `${hours}小时后`;
        return `${days}天后`;
    }
}

export interface ProjectStats {
    total: number;
    active: number;
    completed: number;
    overdue: number;
    dueSoon: number;
}

export function getStats(projects: Project[]): ProjectStats {
    return {
        total: projects.length,
        active: projects.filter((p) => p.status === 'active').length,
        completed: projects.filter((p) => p.status === 'completed').length,
        overdue: projects.filter(isOverdue).length,
        dueSoon: projects.filter((p) => isDueSoon(p) && !isOverdue(p)).length
    };
}

// ─── Store ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'zhuyi:projects';

function uid(): string {
    return browser && crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function now(): string {
    return new Date().toISOString();
}

// Debounced save to avoid hammering localStorage on rapid updates
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedSave(projects: Project[]) {
    if (!browser) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }, 200);
}

function createProjectStore() {
    const { subscribe, set, update } = writable<Project[]>([]);

    // Hydrate from localStorage — only in the browser
    if (browser) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                set(JSON.parse(raw) as Project[]);
            } catch {
                console.error('[projectStore] Failed to parse localStorage data');
            }
        }
    }

    function saveAndReturn(projects: Project[]): Project[] {
        debouncedSave(projects);
        return projects;
    }

    return {
        subscribe,
        set: (projects: Project[]) => set(saveAndReturn(projects)),

        addProject(payload: Pick<Project, 'title' | 'description' | 'deadline'>) {
            update((projects) => {
                const project: Project = {
                    id: uid(),
                    title: payload.title.trim(),
                    description: payload.description?.trim() || undefined,
                    notes: [],
                    deadline: payload.deadline || undefined,
                    status: 'active',
                    createdAt: now(),
                    updatedAt: now()
                };
                return saveAndReturn([...projects, project]);
            });
        },

        updateProject(id: string, changes: Partial<Omit<Project, 'id' | 'createdAt' | 'notes'>>) {
            update((projects) =>
                saveAndReturn(
                    projects.map((p) =>
                        p.id === id ? { ...p, ...changes, updatedAt: now() } : p
                    )
                )
            );
        },

        removeProject(id: string) {
            update((projects) => saveAndReturn(projects.filter((p) => p.id !== id)));
        },

        addNote(projectId: string, text: string) {
            const trimmed = text.trim();
            if (!trimmed) return;
            update((projects) =>
                saveAndReturn(
                    projects.map((p) =>
                        p.id === projectId
                            ? {
                                ...p,
                                notes: [...p.notes, { id: uid(), text: trimmed, createdAt: now() }],
                                updatedAt: now()
                            }
                            : p
                    )
                )
            );
        },

        removeNote(projectId: string, noteId: string) {
            update((projects) =>
                saveAndReturn(
                    projects.map((p) =>
                        p.id === projectId
                            ? { ...p, notes: p.notes.filter((n) => n.id !== noteId), updatedAt: now() }
                            : p
                    )
                )
            );
        },

        setDeadline(projectId: string, isoStringOrNull: string | null) {
            update((projects) =>
                saveAndReturn(
                    projects.map((p) =>
                        p.id === projectId
                            ? { ...p, deadline: isoStringOrNull ?? undefined, updatedAt: now() }
                            : p
                    )
                )
            );
        },

        toggleStatus(projectId: string) {
            update((projects) =>
                saveAndReturn(
                    projects.map((p) =>
                        p.id === projectId
                            ? {
                                ...p,
                                status: p.status === 'completed' ? 'active' : 'completed',
                                updatedAt: now()
                            }
                            : p
                    )
                )
            );
        }
    };
}

export const projectStore = createProjectStore();
