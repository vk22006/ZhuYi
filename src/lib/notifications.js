/**
 * notifications.js — ZhuYi core notification utility
 *
 * Wraps @tauri-apps/plugin-notification so nothing else in the app touches
 * the plugin directly. All Tauri-specific imports are dynamic to guarantee
 * SSR-safety and graceful degradation when running in a plain browser.
 *
 * @module notifications
 */

import { browser } from '$app/environment';

/** @typedef {'granted'|'denied'|'default'} PermissionStatus */

/**
 * Module-level permission cache. Prevents OS permission dialog spam.
 * @type {PermissionStatus|null}
 */
let _permissionStatus = /** @type {PermissionStatus|null} */ (null);

/**
 * Lazily load the Tauri notification plugin.
 * Returns null when not running inside a Tauri context (plain browser).
 * @returns {Promise<import('@tauri-apps/plugin-notification')|null>}
 */
async function getPlugin() {
  if (!browser) return null;
  try {
    return await import('@tauri-apps/plugin-notification');
  } catch {
    return null;
  }
}

/**
 * Request OS notification permission once per session.
 * Subsequent calls return the cached status without re-prompting.
 * @returns {Promise<PermissionStatus>}
 */
export async function initNotifications() {
  if (!browser) return 'default';
  if (_permissionStatus !== null) return _permissionStatus;

  const plugin = await getPlugin();
  if (!plugin) {
    _permissionStatus = 'denied';
    return _permissionStatus;
  }

  const { isPermissionGranted, requestPermission } = plugin;

  try {
    const granted = await isPermissionGranted();
    if (granted) {
      _permissionStatus = 'granted';
    } else {
      const response = await requestPermission();
      _permissionStatus = /** @type {PermissionStatus} */ (response);
    }
  } catch (err) {
    console.warn('[ZhuYi notifications] Permission request failed:', err);
    _permissionStatus = 'denied';
  }

  return _permissionStatus;
}

/**
 * @typedef {Object} NotifyOptions
 * @property {string} [sound]  - Platform-specific sound name (optional)
 * @property {string} [icon]   - Icon path or resource identifier (optional)
 */

/**
 * Core notification dispatcher. No-ops gracefully if permission is not
 * granted or if the Tauri plugin is unavailable.
 * @param {string} title
 * @param {string} body
 * @param {NotifyOptions} [options]
 * @returns {Promise<void>}
 */
export async function notify(title, body, options = {}) {
  if (!browser) return;

  const status = await initNotifications();
  if (status !== 'granted') return;

  const plugin = await getPlugin();
  if (!plugin) return;

  try {
    await plugin.sendNotification({
      title,
      body,
      ...(options.sound ? { sound: options.sound } : {}),
      ...(options.icon  ? { icon: options.icon }   : {})
    });
  } catch (err) {
    console.warn('[ZhuYi notifications] Failed to send notification:', err);
  }
}

// ---------------------------------------------------------------------------
// Domain-specific event helpers
// ---------------------------------------------------------------------------

/**
 * Fired when the user marks a TODO task as complete.
 * @param {string} taskTitle
 * @returns {Promise<void>}
 */
export async function notifyTaskComplete(taskTitle) {
  await notify('✅ 任务完成', `"${taskTitle}" 已标记为完成！`);
}

/**
 * Fired when a task deadline is approaching.
 * @param {string} taskTitle
 * @param {number} minutesLeft
 * @returns {Promise<void>}
 */
export async function notifyDeadlineReminder(taskTitle, minutesLeft) {
  const timeStr = minutesLeft <= 1 ? '不到1分钟' : `${minutesLeft} 分钟`;
  await notify('⏰ 截止日期提醒', `"${taskTitle}" 将在 ${timeStr} 内到期`);
}

/**
 * Fired when an important user action is confirmed.
 * @param {string} message
 * @returns {Promise<void>}
 */
export async function notifyActionConfirmed(message) {
  await notify('🔔 ZhuYi', message);
}

// ---------------------------------------------------------------------------
// Scheduling
// ---------------------------------------------------------------------------

/**
 * @typedef {{ cancel: () => void }} ReminderHandle
 */

/**
 * Schedule a one-off notification after a delay.
 * Returns a handle with a `cancel()` method to abort before firing.
 * @param {string} title
 * @param {string} body
 * @param {number} delayMs
 * @returns {ReminderHandle}
 */
export function scheduleReminder(title, body, delayMs) {
  const handle = setTimeout(() => notify(title, body), delayMs);
  return { cancel: () => clearTimeout(handle) };
}
