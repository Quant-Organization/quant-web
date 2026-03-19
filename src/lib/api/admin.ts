import { fetchSpring } from './config';

// Admin API 응답 타입
export interface AdminResponse {
	success: boolean;
	message: string;
}

/**
 * Redis → DB 마이그레이션
 * Redis의 잔고 데이터를 DB로 마이그레이션합니다. (1회성 작업)
 */
export function migrateRedisToDb() {
	return fetchSpring<AdminResponse>('/api/admin/migrate-redis-to-db', {
		method: 'POST'
	});
}