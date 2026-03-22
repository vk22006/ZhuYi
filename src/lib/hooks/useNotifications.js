/**
 * useNotifications.js — Svelte-friendly reactive wrapper
 *
 * Initialises notifications on mount and re-exports all core helpers so
 * components only need a single import.
 *
 * Usage (inside a Svelte component):
 *
 *   import { useNotifications } from '$lib/hooks/useNotifications';
 *
 *   const { init, permissionStatus, notify, notifyTaskComplete, ... } = useNotifications();
 *
 *   $effect(() => { init(); });
 */

import { writable } from 'svelte/store';
import {
  initNotifications,
  notify,
  notifyTaskComplete,
  notifyDeadlineReminder,
  notifyActionConfirmed,
  scheduleReminder
} from '$lib/notifications';

/** @typedef {import('svelte/store').Writable<'granted'|'denied'|'default'>} PermissionStore */

/**
 * Svelte store tracking the current OS notification permission status.
 * @type {PermissionStore}
 */
export const permissionStatus = writable(/** @type {'granted'|'denied'|'default'} */ ('default'));

/**
 * useNotifications()
 *
 * Call once at the top of a Svelte component.
 * Invoke `init()` inside `$effect` or `onMount` to bootstrap permissions.
 *
 * @returns {{
 *   init: () => Promise<void>,
 *   permissionStatus: PermissionStore,
 *   notify: typeof notify,
 *   notifyTaskComplete: typeof notifyTaskComplete,
 *   notifyDeadlineReminder: typeof notifyDeadlineReminder,
 *   notifyActionConfirmed: typeof notifyActionConfirmed,
 *   scheduleReminder: typeof scheduleReminder
 * }}
 */
export function useNotifications() {
  async function init() {
    const status = await initNotifications();
    permissionStatus.set(status);
  }

  return {
    init,
    permissionStatus,
    notify,
    notifyTaskComplete,
    notifyDeadlineReminder,
    notifyActionConfirmed,
    scheduleReminder
  };
}
