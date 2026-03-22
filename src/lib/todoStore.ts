import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface Todo {
  id: string | number;
  title: string;
  description?: string;
  done: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'zhuyi:tasks';

function createTodoStore() {
  const { subscribe, set, update } = writable<Todo[]>([]);

  // Safely initialize from localStorage only when running in the browser
  if (browser) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        set(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse todos from localStorage', e);
      }
    }
  }

  // Helper to save to localStorage and return the state
  function saveAndReturn(todos: Todo[]) {
    if (browser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }
    return todos;
  }

  return {
    subscribe,
    set: (todos: Todo[]) => {
      set(saveAndReturn(todos));
    },
    add: (todo: Omit<Todo, 'id' | 'createdAt' | 'done'>) => {
      update(todos => {
        const newTodo: Todo = {
          ...todo,
          // Generate a simple unique ID
          id: browser && window.crypto ? crypto.randomUUID() : Date.now().toString(),
          done: false,
          createdAt: new Date().toISOString()
        };
        return saveAndReturn([...todos, newTodo]);
      });
    },
    update: (id: string | number, changes: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
      update(todos => {
        const updated = todos.map(t => (t.id === id ? { ...t, ...changes } : t));
        return saveAndReturn(updated);
      });
    },
    toggle: (id: string | number) => {
      update(todos => {
        const updated = todos.map(t => {
          if (t.id !== id) return t;
          const toggled = { ...t, done: !t.done };
          // Fire a desktop notification only when transitioning to "done"
          if (toggled.done && browser) {
            import('$lib/notifications').then(({ notifyTaskComplete }) => {
              notifyTaskComplete(toggled.title);
            });
          }
          return toggled;
        });
        return saveAndReturn(updated);
      });
    },
    remove: (id: string | number) => {
      update(todos => {
        const updated = todos.filter(t => t.id !== id);
        return saveAndReturn(updated);
      });
    }
  };
}

export const todosStore = createTodoStore();
