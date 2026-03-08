import { fetchFastAPI, fetchSpring } from './config';

// FastAPI Auth
export interface FastAPIToken {
	access_token: string;
	token_type: string;
	user_id: number;
	username: string;
}

export function fastAPIRegister(username: string, email: string, password: string) {
	return fetchFastAPI<FastAPIToken>('/api/auth/register', {
		method: 'POST',
		body: JSON.stringify({ username, email, password })
	});
}

export function fastAPILogin(username: string, password: string) {
	return fetchFastAPI<FastAPIToken>('/api/auth/login', {
		method: 'POST',
		body: JSON.stringify({ username, password })
	});
}

export function fastAPIMe() {
	return fetchFastAPI<{ user_id: number; username: string; email: string; created_at: string }>('/api/auth/me');
}

// Spring Boot Auth
export interface SpringAuthResponse {
	id: number;
	username: string;
	playerName: string;
	level: number;
	fame: number;
	investmentStyle: string;
	title: string | null;
	token: string;
}

export function springRegister(username: string, password: string, playerName: string) {
	return fetchSpring<SpringAuthResponse>('/api/auth/register', {
		method: 'POST',
		body: JSON.stringify({ username, password, playerName })
	});
}

export function springLogin(username: string, password: string) {
	return fetchSpring<SpringAuthResponse>('/api/auth/login', {
		method: 'POST',
		body: JSON.stringify({ username, password })
	});
}

export function springMe() {
	return fetchSpring<{ id: number; username: string; playerName: string; level: number; experience: number; fame: number; investmentStyle: string; title: string }>('/api/auth/me');
}
