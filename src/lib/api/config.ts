// API Base URLs — uses Netlify proxy redirects in production
export const FASTAPI_BASE = '/fastapi';
export const SPRING_BASE = import.meta.env.VITE_SPRING_API_URL || '';

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

export type FetchOptions = RequestInit & {
	suppressAuth?: boolean;
	cacheMode?: 'default' | 'no-store';
	cacheTtlMs?: number;
};

type CacheEntry = {
	data: unknown;
	expiresAt: number;
	etag?: string;
	lastModified?: string;
};

const responseCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<unknown>>();

function cloneJson<T>(data: T): T {
	if (data === null || data === undefined) return data;
	return JSON.parse(JSON.stringify(data)) as T;
}

function normalizeMethod(method?: string): string {
	return (method || 'GET').toUpperCase();
}

function buildCacheKey(base: string, path: string, method: string, token: string | null): string {
	return `${base}|${method}|${path}|${token ?? 'anon'}`;
}

function defaultTtlMs(path: string): number {
	if (path.includes('/api/market/prices') || path.includes('/api/market-state')) return 4000;
	if (path.includes('/api/orders') || path.includes('/api/account') || path.includes('/api/holdings')) return 5000;
	return 15000;
}

async function parseJsonSafe<T>(res: Response): Promise<T> {
	const text = await res.text();
	if (!text) throw new Error('Empty response body');
	try {
		return JSON.parse(text) as T;
	} catch {
		return text as T;
	}
}

function invalidateCacheByBase(base: string): void {
	for (const key of responseCache.keys()) {
		if (key.startsWith(`${base}|`)) responseCache.delete(key);
	}
}

async function requestWithSmartCache<T = unknown>(
	base: string,
	path: string,
	token: string | null,
	options: FetchOptions | undefined,
	getErrorMessage: (errPayload: Record<string, unknown>, status: number) => string
): Promise<T> {
	const method = normalizeMethod(options?.method);
	const isGet = method === 'GET';
	const useCache = isGet && options?.cacheMode !== 'no-store';
	const ttlMs = options?.cacheTtlMs ?? defaultTtlMs(path);
	const cacheKey = buildCacheKey(base, path, method, token);
	const now = Date.now();

	if (useCache) {
		const cached = responseCache.get(cacheKey);
		if (cached && cached.expiresAt > now) return cloneJson(cached.data as T);
		const inflight = inflightRequests.get(cacheKey) as Promise<T> | undefined;
		if (inflight) return inflight;
	}

	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (token) headers['Authorization'] = `Bearer ${token}`;

	if (useCache) {
		const stale = responseCache.get(cacheKey);
		if (stale?.etag) headers['If-None-Match'] = stale.etag;
		if (stale?.lastModified) headers['If-Modified-Since'] = stale.lastModified;
	}

	const requestPromise = (async () => {
		const res = await fetch(`${base}${path}`, {
			...options,
			method,
			headers: { ...headers, ...options?.headers }
		});

		// 304 means cached body is still valid.
		if (useCache && res.status === 304) {
			const stale = responseCache.get(cacheKey);
			if (stale) {
				stale.expiresAt = Date.now() + ttlMs;
				responseCache.set(cacheKey, stale);
				return cloneJson(stale.data as T);
			}
		}

		if (!res.ok) {
			const err = await parseJsonSafe<Record<string, unknown>>(res).catch(() => ({}) as Record<string, unknown>);
			const error = new Error(getErrorMessage(err, res.status));
			(error as Error & { status?: number; code?: string }).status = res.status;
			if (typeof err.code === 'string') {
				(error as Error & { code?: string }).code = err.code;
			}
			throw error;
		}

		const data = await parseJsonSafe<T>(res);

		if (useCache) {
			responseCache.set(cacheKey, {
				data: cloneJson(data),
				expiresAt: Date.now() + ttlMs,
				etag: res.headers.get('ETag') ?? undefined,
				lastModified: res.headers.get('Last-Modified') ?? undefined
			});
		} else {
			// Any mutating request should invalidate cached reads.
			invalidateCacheByBase(base);
		}

		return data;
	})();

	if (useCache) inflightRequests.set(cacheKey, requestPromise);
	try {
		return await requestPromise;
	} finally {
		if (useCache) inflightRequests.delete(cacheKey);
	}
}

export async function fetchFastAPI<T = unknown>(path: string, options?: FetchOptions): Promise<T> {
	const token = getFastAPIToken();
	try {
		return await requestWithSmartCache<T>(
			FASTAPI_BASE,
			path,
			token,
			options,
			(err, status) => String(err.detail || err.message || `FastAPI Error ${status}`)
		);
	} catch (e) {
		const status = (e as Error & { status?: number })?.status;
		if ((status === 401 || (status === 403 && token)) && typeof window !== 'undefined' && !options?.suppressAuth) {
			localStorage.removeItem('fastapi_token');
			window.dispatchEvent(new CustomEvent('quant:auth-required'));
		}
		throw e;
	}
}

export async function fetchSpring<T = unknown>(path: string, options?: FetchOptions): Promise<T> {
	const token = getSpringToken();
	try {
		return await requestWithSmartCache<T>(
			SPRING_BASE,
			path,
			token,
			options,
			(err, status) => {
				if (Array.isArray(err.errors) && err.errors.length > 0) {
					return err.errors
						.map((e: unknown) => {
							if (typeof e === 'object' && e !== null) {
								const rec = e as Record<string, unknown>;
								return String(rec.reason || rec.field || '');
							}
							return '';
						})
						.filter(Boolean)
						.join(', ');
				}
				const detail = err.message || err.error;
				return String(detail || `Spring Error ${status}`);
			}
		);
	} catch (e) {
		const status = (e as Error & { status?: number })?.status;
		if ((status === 401 || (status === 403 && token)) && typeof window !== 'undefined' && !options?.suppressAuth) {
			localStorage.removeItem('spring_token');
			localStorage.removeItem('auth_token');
			window.dispatchEvent(new CustomEvent('quant:auth-required'));
		}
		throw e;
	}
}
