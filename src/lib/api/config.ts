const ERROR_MESSAGES: Record<string, string> = {
	// Common
	C001: '입력값이 올바르지 않습니다.',
	C002: '서버 내부 오류가 발생했습니다.',
	C003: '요청한 데이터를 찾을 수 없습니다.',
	C004: '로그인이 필요합니다.',
	C005: '접근 권한이 없습니다.',
	// User
	U001: '사용자를 찾을 수 없습니다.',
	U002: '이미 사용 중인 아이디입니다.',
	U003: '아이디 또는 비밀번호가 올바르지 않습니다.',
	// Account
	A001: '잔액이 부족합니다.',
	A002: '계좌를 찾을 수 없습니다.',
	// Level
	L001: '레벨이 부족합니다.',
	L002: '이미 최대 레벨입니다.',
	// Assets
	AS001: '자산을 찾을 수 없습니다.',
	AS002: '이미 보유 중인 자산입니다.',
	AS003: '보유하지 않은 자산입니다.',
	// Region
	RG001: '지역을 찾을 수 없습니다.',
	// Company & Factory
	CO001: '회사를 찾을 수 없습니다.',
	CO002: '이미 회사를 보유하고 있습니다.',
	CO003: '유효하지 않은 회사 유형입니다.',
	CO004: '이미 사용 중인 회사 이름입니다.',
	F001: '공장을 찾을 수 없습니다.',
	F002: '유효하지 않은 공장 등급입니다.',
	F003: '재고가 부족합니다.',
	F004: '창고가 가득 찼습니다.',
	// Loan
	LO001: '대출을 찾을 수 없습니다.',
	LO002: '이미 상환된 대출입니다.',
	LO003: '유효하지 않은 대출 금액입니다.',
	// Auction
	AU001: '경매를 찾을 수 없습니다.',
	AU002: '진행 중이지 않은 경매입니다.',
	AU003: '입찰 금액이 너무 낮습니다.',
	AU004: '이미 최고 입찰자입니다.',
	// Mission
	M001: '미션을 찾을 수 없습니다.',
	M002: '아직 완료되지 않은 미션입니다.',
	M003: '이미 보상을 수령한 미션입니다.',
	// R&D
	R001: '연구 프로젝트를 찾을 수 없습니다.',
	R002: '이미 진행 중인 연구입니다.',
	R003: '이미 완료된 연구입니다.',
	R004: '가용 연구원이 부족합니다.',
	// Export
	E001: '수출 주문을 찾을 수 없습니다.',
	// General
	G001: '접근 권한이 없습니다.',
	G002: '이미 존재합니다.',
	G003: '잘못된 요청입니다.',
	G004: '유효하지 않은 상태입니다.',
	G005: '레벨이 부족합니다.',
	G006: '선행 조건을 충족하지 못했습니다.',
	G007: '동시 수정이 감지되었습니다. 다시 시도해주세요.',
	G008: '이미 결제되었습니다.',
};

export function friendlyError(e: unknown, fallback: string): string {
	if (!(e instanceof Error)) return fallback;
	const code = (e as Error & { code?: string }).code;
	if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
	return e.message || fallback;
}

// API Base URLs — uses Vercel/Vite proxy in production, env vars for local dev
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

/** Clear all cached responses and in-flight trackers (call on logout). */
export function clearAllCaches(): void {
	responseCache.clear();
	inflightRequests.clear();
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

		if (res.status === 204) return undefined as T;

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
			window.dispatchEvent(new CustomEvent('quant:fastapi-auth-required'));
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
