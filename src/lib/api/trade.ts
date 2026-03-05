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
