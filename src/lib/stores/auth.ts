import { writable, derived } from 'svelte/store';

export interface User {
	id: number;
	username: string;
	playerName?: string;
	email?: string;
	level?: number;
	fame?: number;
	investmentStyle?: string;
	title?: string | null;
}

function createAuthStore() {
	const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
	const storedUser = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;

	const token = writable<string | null>(storedToken);
	const user = writable<User | null>(storedUser ? JSON.parse(storedUser) : null);

	token.subscribe((val) => {
		if (typeof window === 'undefined') return;
		if (val) localStorage.setItem('auth_token', val);
		else localStorage.removeItem('auth_token');
	});

	user.subscribe((val) => {
		if (typeof window === 'undefined') return;
		if (val) localStorage.setItem('auth_user', JSON.stringify(val));
		else localStorage.removeItem('auth_user');
	});

	function login(tokenVal: string, userVal: User) {
		token.set(tokenVal);
		user.set(userVal);
	}

	function logout() {
		token.set(null);
		user.set(null);
	}

	const isLoggedIn = derived(token, ($token) => !!$token);

	return { token, user, isLoggedIn, login, logout };
}

export const auth = createAuthStore();
