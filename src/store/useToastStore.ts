import { create } from 'zustand'
import type { TranslationStrings } from '../lib/i18n'

/** Translation key of the message a toast shows (rendered with the active locale) */
export type ToastKey = keyof TranslationStrings['toasts']

/** One transient notification */
export interface Toast {
  id: number
  key: ToastKey
}

interface ToastStore {
  toasts: Toast[]
  pushToast: (key: ToastKey) => void
  dismissToast: (id: number) => void
}

let nextId = 1

/** Global toast queue. Stores message KEYS, not text — the viewport renders
 *  them with the user's current locale, so a locale switch mid-toast is fine. */
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  pushToast: (key) =>
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id: nextId++, key }] })),
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
