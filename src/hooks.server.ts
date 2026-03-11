import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || 'http://52.79.105.249:8000';
const SPRING_URL = process.env.SPRING_BACKEND_URL || 'http://52.79.105.249';

export const handle: Handle = async ({ event, resolve }) => {
	// Skip proxying during build/prerender
	if (building) return resolve(event);

	const { pathname, search } = event.url;

	// Proxy /fastapi/* → FastAPI backend (strip /fastapi prefix)
	if (pathname.startsWith('/fastapi/')) {
		const backendPath = pathname.replace(/^\/fastapi/, '');
		return proxyRequest(event.request, `${FASTAPI_URL}${backendPath}${search}`);
	}

	// Proxy /api/* → Spring backend
	if (pathname.startsWith('/api/')) {
		return proxyRequest(event.request, `${SPRING_URL}${pathname}${search}`);
	}

	return resolve(event);
};

async function proxyRequest(request: Request, targetUrl: string): Promise<Response> {
	const headers = new Headers(request.headers);
	headers.delete('host');
	headers.delete('connection');

	const init: RequestInit = {
		method: request.method,
		headers
	};

	if (request.method !== 'GET' && request.method !== 'HEAD') {
		init.body = await request.arrayBuffer();
	}

	try {
		const res = await fetch(targetUrl, init);
		const responseHeaders = new Headers(res.headers);
		responseHeaders.delete('transfer-encoding');

		return new Response(res.body, {
			status: res.status,
			statusText: res.statusText,
			headers: responseHeaders
		});
	} catch {
		return new Response(JSON.stringify({ error: 'Backend unreachable' }), {
			status: 502,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
