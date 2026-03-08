import { writable } from 'svelte/store';

export const showLoginModal = writable(false);
/** true when modal was opened by a 401 auth-required event */
export const loginModalAuthRequired = writable(false);
