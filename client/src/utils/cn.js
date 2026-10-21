/**
 * cn.js — Class name utility
 * Joins class strings, filtering falsy values.
 * A lightweight replacement for clsx/classnames.
 *
 * @param {...(string|undefined|null|false)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
