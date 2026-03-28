import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { dbGetAll, dbPut, dbDelete } from '$lib/db';

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

function uid(): string {
    return browser && crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function now(): string {
    return new Date().toISOString();
}

// Debounced per-project save to IDB
let saveTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
function debouncedSave(project: Project) {
    if (!browser) return;
    const existing = saveTimers.get(project.id);
    if (existing) clearTimeout(existing);
    saveTimers.set(project.id, setTimeout(() => {
        dbPut('projects', project);
        saveTimers.delete(project.id);
    }, 150));
}

function createProjectStore() {
    const { subscribe, set, update } = writable<Project[]>([]);

    // Hydrate from IndexedDB — only in the browser
    if (browser) {
        dbGetAll<Project>('projects').then((projects) => {
            set(projects.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)));
        }).catch((err) => {
            console.error('[projectStore] Failed to load from IndexedDB', err);
        });
    }

    function persistProject(project: Project) {
        debouncedSave(project);
    }

    function persistProjects(projects: Project[]) {
        if (!browser) return;
        projects.forEach(persistProject);
    }

    return {
        subscribe,

        set: (projects: Project[]) => {
            set(projects);
            persistProjects(projects);
        },

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
                if (browser) {
                    dbPut('projects', project);
                    import('$lib/notifications').then(({ notifyActionConfirmed }) => {
                        notifyActionConfirmed(`新项目 "${project.title}" 已创建！`);
                    });
                }
                return [...projects, project];
            });
        },

        updateProject(id: string, changes: Partial<Omit<Project, 'id' | 'createdAt' | 'notes'>>) {
            update((projects) => {
                const updated = projects.map((p) =>
                    p.id === id ? { ...p, ...changes, updatedAt: now() } : p
                );
                const changed = updated.find((p) => p.id === id);
                if (browser && changed) debouncedSave(changed);
                return updated;
            });
        },

        removeProject(id: string) {
            update((projects) => {
                if (browser) dbDelete('projects', id);
                return projects.filter((p) => p.id !== id);
            });
        },

        addNote(projectId: string, text: string) {
            const trimmed = text.trim();
            if (!trimmed) return;
            update((projects) => {
                const updated = projects.map((p) =>
                    p.id === projectId
                        ? {
                            ...p,
                            notes: [...p.notes, { id: uid(), text: trimmed, createdAt: now() }],
                            updatedAt: now()
                        }
                        : p
                );
                const changed = updated.find((p) => p.id === projectId);
                if (browser && changed) debouncedSave(changed);
                return updated;
            });
        },

        removeNote(projectId: string, noteId: string) {
            update((projects) => {
                const updated = projects.map((p) =>
                    p.id === projectId
                        ? { ...p, notes: p.notes.filter((n) => n.id !== noteId), updatedAt: now() }
                        : p
                );
                const changed = updated.find((p) => p.id === projectId);
                if (browser && changed) debouncedSave(changed);
                return updated;
            });
        },

        setDeadline(projectId: string, isoStringOrNull: string | null) {
            update((projects) => {
                const updated = projects.map((p) =>
                    p.id === projectId
                        ? { ...p, deadline: isoStringOrNull ?? undefined, updatedAt: now() }
                        : p
                );
                const changed = updated.find((p) => p.id === projectId);
                if (browser && changed) debouncedSave(changed);
                return updated;
            });
        },

        toggleStatus(projectId: string) {
            update((projects) => {
                const updated = projects.map((p) => {
                    if (p.id !== projectId) return p;
                    const newStatus: ProjectStatus = p.status === 'completed' ? 'active' : 'completed';
                    if (newStatus === 'completed' && browser) {
                        import('$lib/notifications').then(({ notifyActionConfirmed }) => {
                            notifyActionConfirmed(`🎉 项目 "${p.title}" 已完成！`);
                        });
                    }
                    return { ...p, status: newStatus, updatedAt: now() };
                });
                const changed = updated.find((p) => p.id === projectId);
                if (browser && changed) debouncedSave(changed);
                return updated;
            });
        }
    };
}

export const projectStore = createProjectStore();
