// API Base URLs
export const FASTAPI_BASE = 'http://52.79.105.249:8000';
export const SPRING_BASE = 'http://52.79.105.249';

function getSpringToken(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('spring_token') || localStorage.getItem('auth_token');
}

function getFastAPIToken(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('fastapi_token');
}

export function authHeaders(): Record<string, string> {
	const token = getSpringToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchFastAPI<T = unknown>(path: string, options?: RequestInit): Promise<T> {
	const token = getFastAPIToken();
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (token) headers['Authorization'] = `Bearer ${token}`;

	const res = await fetch(`${FASTAPI_BASE}${path}`, {
		...options,
		headers: { ...headers, ...options?.headers }
	});
	if (!res.ok) {
		if (res.status === 401 && typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('quant:auth-required'));
		}
		const err = await res.json().catch(() => ({ detail: res.statusText }));
		throw new Error(err.detail || err.message || `FastAPI Error ${res.status}`);
	}
	return res.json();
}

export async function fetchSpring<T = unknown>(path: string, options?: RequestInit): Promise<T> {
	const token = getSpringToken();
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (token) headers['Authorization'] = `Bearer ${token}`;

	const res = await fetch(`${SPRING_BASE}${path}`, {
		...options,
		headers: { ...headers, ...options?.headers }
	});
	if (!res.ok) {
		if (res.status === 401 && typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('quant:auth-required'));
		}
		const err = await res.json().catch(() => ({ message: res.statusText }));
		// Parse validation errors array from Spring Boot
		if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
			throw new Error(err.errors.map((e: { reason?: string; field?: string }) => e.reason || e.field).join(', '));
		}
		throw new Error(err.message || `Spring Error ${res.status}`);
	}
	return res.json();
}
