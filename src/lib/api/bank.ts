import { fetchSpring } from './config';

export interface BankResponse {
	id: number;
	name: string;
	tier: number;
	tierName: string;
	interestRate: number;
	logoUrl: string;
}

export interface BankProductResponse {
	id: number;
	bank: BankResponse;
	name: string;
	loanType: string;
	loanTypeName: string;
	minAmount: number;
	maxAmount: number;
	minTermMonths: number;
	maxTermMonths: number;
	baseInterestRate: number;
	requiredCreditScore: number;
	requiredLevel: number;
	description: string;
}

export function getBanks() {
	return fetchSpring<BankResponse[]>('/api/banks');
}

export function getBanksByTier(tier: number) {
	return fetchSpring<BankResponse[]>(`/api/banks/tier/${tier}`);
}

export function getBankProducts(bankId: number) {
	return fetchSpring<BankProductResponse[]>(`/api/banks/${bankId}/products`);
}
