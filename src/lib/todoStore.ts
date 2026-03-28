import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { dbGetAll, dbPut, dbDelete } from '$lib/db';

export interface Todo {
  id: string | number;
  title: string;
  description?: string;
  done: boolean;
  createdAt: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

function createTodoStore() {
  const { subscribe, set, update } = writable<Todo[]>([]);

  // Hydrate from IndexedDB (async – fires after store is usable)
  if (browser) {
    dbGetAll<Todo>('todos').then((todos) => {
      // Sort by createdAt ascending so order is stable after reload
      set(todos.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)));
    }).catch((err) => {
      console.error('[todoStore] Failed to load from IndexedDB', err);
    });
  }

  return {
    subscribe,

    /** Replace the entire list (persists each item). */
    set: (todos: Todo[]) => {
      set(todos);
      if (browser) {
        // Persist all items; deletions are handled by individual remove()
        todos.forEach((t) => dbPut('todos', t));
      }
    },

    add: (todo: Omit<Todo, 'id' | 'createdAt' | 'done'>) => {
      update((todos) => {
        const newTodo: Todo = {
          ...todo,
          id: browser && window.crypto ? crypto.randomUUID() : Date.now().toString(),
          done: false,
          createdAt: new Date().toISOString()
        };
        if (browser) dbPut('todos', newTodo);
        return [...todos, newTodo];
      });
    },

    update: (id: string | number, changes: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
      update((todos) => {
        const updated = todos.map((t) => (t.id === id ? { ...t, ...changes } : t));
        const changed = updated.find((t) => t.id === id);
        if (browser && changed) dbPut('todos', changed);
        return updated;
      });
    },

    toggle: (id: string | number) => {
      update((todos) => {
        const updated = todos.map((t) => {
          if (t.id !== id) return t;
          const toggled = { ...t, done: !t.done };
          if (toggled.done && browser) {
            import('$lib/notifications').then(({ notifyTaskComplete }) => {
              notifyTaskComplete(toggled.title);
            });
          }
          if (browser) dbPut('todos', toggled);
          return toggled;
        });
        return updated;
      });
    },

    remove: (id: string | number) => {
      update((todos) => {
        if (browser) dbDelete('todos', id as IDBValidKey);
        return todos.filter((t) => t.id !== id);
      });
    }
  };
}

export const todosStore = createTodoStore();
