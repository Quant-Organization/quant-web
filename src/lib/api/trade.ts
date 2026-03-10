import { fetchFastAPI } from './config';

export interface OrderRequest {
	company_id: string;
	quantity: number;
}

export interface OrderResponse {
	order_id: number;
	company_id: string;
	order_type: string;
	quantity: number;
	price: number;
	total_amount: number;
	created_at: string;
}

export interface AccountResponse {
	account_id: number;
	cash: number;
	total_value: number;
	holdings: Holding[];
}

export interface Holding {
	company_id: string;
	quantity: number;
	avg_price: number;
	current_price: number;
	profit_loss: number;
	profit_loss_pct: number;
}

export function buyStock(company_id: string, quantity: number) {
	return fetchFastAPI<OrderResponse>('/api/trade/buy', {
		method: 'POST',
		body: JSON.stringify({ company_id, quantity })
	});
}

export function sellStock(company_id: string, quantity: number) {
	return fetchFastAPI<OrderResponse>('/api/trade/sell', {
		method: 'POST',
		body: JSON.stringify({ company_id, quantity })
	});
}

export function getAccount() {
	return fetchFastAPI<AccountResponse>('/api/account');
}

export function getOrders(limit = 50) {
	return fetchFastAPI<OrderResponse[]>(`/api/orders?limit=${limit}`);
}

// Portfolio Dashboard (통합 엔드포인트)
export interface PortfolioDashboard {
	summary: PortfolioSummary;
	performance: PortfolioPerformance;
	holdings: PortfolioHolding[];
	allocation_by_sector: SectorAllocation[];
	top_holdings: PortfolioHolding[];
	recent_trades: RecentTrade[];
	total_trades: number;
}

export interface PortfolioSummary {
	total_assets: number;
	cash: number;
	stock_value: number;
	total_invested: number;
	total_profit_loss: number;
	total_profit_loss_pct: number;
	winning_count: number;
	losing_count: number;
}

export interface PortfolioPerformance {
	daily_return: number;
	weekly_return: number;
	monthly_return: number;
	cumulative_return: number;
}

export interface PortfolioHolding {
	company_id: string;
	company_name: string;
	quantity: number;
	avg_price: number;
	current_price: number;
	total_invested: number;
	current_value: number;
	profit_loss: number;
	profit_loss_pct: number;
	weight_pct: number;
}

export interface SectorAllocation {
	sector: string;
	percentage: number;
}

export interface RecentTrade {
	trade_date: string;
	type: string;
	company_id: string;
	company_name: string;
	quantity: number;
	price: number;
	total_amount: number;
}

export function getPortfolioDashboard() {
	return fetchFastAPI<PortfolioDashboard>('/api/portfolio/dashboard');
}
