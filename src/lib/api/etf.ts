import { fetchFastAPI } from './config';

export interface ETFHolding {
	id: string;
	target_weight: number;
	value: number;
	actual_weight: number;
	price: number;
}

export interface ETF {
	id: string;
	name: string;
	ticker: string;
	sector: string;
	nav: number;
	change_pct: number;
	change_amount: number;
	constituents: string[];
	weights: Record<string, number>;
	holdings: ETFHolding[];
	expense_ratio: number;
	description: string;
}

export interface ETFCandle {
	timestamp: string;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

export function getETFs() {
	return fetchFastAPI<{ etfs: ETF[] }>('/api/etfs');
}

export function getETFDetail(etfId: string) {
	return fetchFastAPI<ETF>(`/api/etfs/${etfId}`);
}

export async function getETFHistory(etfId: string, limit = 500) {
	const data = await fetchFastAPI<{ candles: ETFCandle[] }>(`/api/etfs/history/${etfId}?limit=${limit}`);
	return data.candles ?? [];
}
