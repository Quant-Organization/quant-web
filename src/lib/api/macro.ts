import { fetchFastAPI } from './config';

export interface Commodity {
	id: string;
	name: string;
	current_price: number;
	price_change_pct: number;
	volatility: number;
	updated_at: string;
}

export interface MacroIndicator {
	id: string;
	name: string;
	current_value: number;
	change_value: number;
	updated_at: string;
}

export interface GlobalEvent {
	id: string;
	name: string;
	description: string;
	impact: string;
	start_time: string;
	end_time: string;
}

export interface MarketEvent {
	id: string;
	name: string;
	description: string;
	event_type: string;
	impact: number;
	start_time: string;
	end_time: string;
}

export interface MarketState {
	current_round: number;
	economy_mode: string;
	market_volatility: number;
	commodity_prices: Record<string, number>;
	macro_values: Record<string, number>;
	active_events_count: number;
	active_events: GlobalEvent[];
}

export function getCommodities() {
	return fetchFastAPI<{ commodities: Commodity[] }>('/api/commodities');
}

export function getCommodityHistory(commodityId: string, limit = 500, interval = 5) {
	return fetchFastAPI(`/api/commodities/history/${commodityId}?limit=${limit}&interval=${interval}`);
}

export function getMacroIndicators() {
	return fetchFastAPI<{ indicators: MacroIndicator[] }>('/api/macro-indicators');
}

export function getMacroEconomy() {
	return fetchFastAPI('/api/macro-economy');
}

export function getGlobalEvents() {
	return fetchFastAPI<{ active_events: GlobalEvent[]; count: number }>('/api/global-events');
}

export async function getMarketEvents(activeOnly = true, limit = 10) {
	const data = await fetchFastAPI<{ events: MarketEvent[] }>(`/api/market-events?active_only=${activeOnly}&limit=${limit}`);
	return data.events ?? [];
}

export function getMarketState() {
	return fetchFastAPI<MarketState>('/api/market-state');
}
