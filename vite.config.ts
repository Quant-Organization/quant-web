import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	return {
		plugins: [tailwindcss(), sveltekit()],
		server: {
			proxy: {
				'/fastapi': {
					target: env.VITE_FASTAPI_URL || 'http://localhost:8000',
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/fastapi/, '')
				}
			}
		}
	};
});
