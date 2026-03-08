import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: number;
	message: string;
	type: ToastType;
	duration: number;
}

let nextId = 0;

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	function add(message: string, type: ToastType = 'info', duration = 3000) {
		const id = nextId++;
		update((toasts) => [...toasts, { id, message, type, duration }]);
		setTimeout(() => remove(id), duration);
	}

	function remove(id: number) {
		update((toasts) => toasts.filter((t) => t.id !== id));
	}

	return {
		subscribe,
		success: (message: string, duration?: number) => add(message, 'success', duration),
		error: (message: string, duration?: number) => add(message, 'error', duration ?? 4000),
		warning: (message: string, duration?: number) => add(message, 'warning', duration),
		info: (message: string, duration?: number) => add(message, 'info', duration),
		remove
	};
}

export const toast = createToastStore();
