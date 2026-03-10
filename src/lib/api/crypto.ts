import { fetchFastAPI } from './config';

export interface CryptoInfo {
	crypto_id: string;
	name: string;
	symbol: string;
	current_price: number;
	price_change_pct: number;
	market_cap: number;
	is_meme: boolean;
}

export interface CryptoDetail extends CryptoInfo {
	volume_24h?: number;
	high_24h?: number;
	low_24h?: number;
}

export interface CryptoCandle {
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

export interface CryptoEvent {
	event_type: string;
	crypto_id: string;
	name: string;
	description: string;
	timestamp: string;
}

export interface CryptoHolding {
	crypto_id: string;
	quantity: number;
	avg_price: number;
	current_price: number;
	profit_loss: number;
	profit_loss_pct: number;
}

export function getCryptoList() {
	return fetchFastAPI<{ crypto: CryptoInfo[]; count: number }>('/api/crypto');
}

export function getCryptoDetail(cryptoId: string) {
	return fetchFastAPI<CryptoDetail>(`/api/crypto/${cryptoId}`);
}

export async function getCryptoHistory(cryptoId: string, limit = 500, interval = 5) {
	const data = await fetchFastAPI<{ crypto_id: string; candles: CryptoCandle[] }>(`/api/crypto/history/${cryptoId}?limit=${limit}&interval=${interval}`);
	return data.candles ?? [];
}

export function getCryptoEvents() {
	return fetchFastAPI<{ delisting_events: CryptoEvent[]; listing_events: CryptoEvent[] }>('/api/crypto/events');
}

export function buyCrypto(crypto_id: string, quantity: number) {
	return fetchFastAPI('/api/crypto/buy', {
		method: 'POST',
		body: JSON.stringify({ crypto_id, quantity })
	});
}

export function sellCrypto(crypto_id: string, quantity: number) {
	return fetchFastAPI('/api/crypto/sell', {
		method: 'POST',
		body: JSON.stringify({ crypto_id, quantity })
	});
}

export type CryptoHoldingsResponse = {
	holdings: CryptoHolding[];
	total_crypto_value: number;
	cash_balance: number;
};

export async function getCryptoHoldings(opts?: { suppressAuth?: boolean }): Promise<CryptoHoldingsResponse> {
	const data = await fetchFastAPI<CryptoHoldingsResponse>('/api/crypto/holdings', opts?.suppressAuth ? { suppressAuth: true } : undefined);
	return {
		holdings: data.holdings ?? [],
		total_crypto_value: data.total_crypto_value ?? 0,
		cash_balance: data.cash_balance ?? 0,
	};
}
