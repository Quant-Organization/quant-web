import { fetchSpring } from './config';
import type { BankResponse, BankProductResponse } from './bank';

export type { BankResponse, BankProductResponse };

export interface LoanProductResponse {
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

export interface LoanApplyRequest {
	loanProductId: number;
	amount: number;
	termMonths: number;
	repaymentType: string;
}

export interface PaymentScheduleItem {
	month: number;
	principal: number;
	interest: number;
	totalPayment: number;
	remainingPrincipal: number;
}

export interface LoanEstimateResponse {
	loanAmount: number;
	termMonths: number;
	interestRate: number;
	repaymentType: string;
	repaymentTypeName: string;
	monthlyPayment: number;
	totalPayment: number;
	totalInterest: number;
	schedule: PaymentScheduleItem[];
}

export interface UserLoanResponse {
	id: number;
	bank: BankResponse;
	loanProduct: LoanProductResponse;
	principalAmount: number;
	remainingPrincipal: number;
	interestRate: number;
	termMonths: number;
	repaymentType: string;
	repaymentTypeName: string;
	monthlyPayment: number;
	nextPaymentDate: string;
	startDate: string;
	maturityDate: string;
	status: string;
	statusName: string;
	totalInterestPaid: number;
	paidMonths: number;
	remainingMonths: number;
	currentPrincipalDue: number;
	currentInterestDue: number;
	currentTotalDue: number;
}

export interface LoanSummaryResponse {
	activeLoanCount: number;
	totalRemainingPrincipal: number;
	totalBorrowedAmount: number;
	totalInterestPaid: number;
	nextPaymentDate: string;
	nextPaymentAmount: number;
}

export function getLoanProducts() {
	return fetchSpring<LoanProductResponse[]>('/api/loans/products');
}

export function getLoanProductsByTier(tier: number) {
	return fetchSpring<LoanProductResponse[]>(`/api/loans/products/tier/${tier}`);
}

export function estimateLoan(req: LoanApplyRequest) {
	return fetchSpring<LoanEstimateResponse>('/api/loans/estimate', {
		method: 'POST',
		body: JSON.stringify(req)
	});
}

export function applyLoan(req: LoanApplyRequest) {
	return fetchSpring<UserLoanResponse>('/api/loans/apply', {
		method: 'POST',
		body: JSON.stringify(req)
	});
}

export function getMyLoans() {
	return fetchSpring<UserLoanResponse[]>('/api/loans/my');
}

export function getActiveLoans() {
	return fetchSpring<UserLoanResponse[]>('/api/loans/my/active');
}

export function getLoanSummary() {
	return fetchSpring<LoanSummaryResponse>('/api/loans/my/summary');
}

export function getLoanDetail(loanId: number) {
	return fetchSpring<UserLoanResponse>(`/api/loans/my/${loanId}`);
}

export function getLoanSchedule(loanId: number) {
	return fetchSpring<PaymentScheduleItem[]>(`/api/loans/my/${loanId}/schedule`);
}

export function repayLoan(loanId: number) {
	return fetchSpring(`/api/loans/${loanId}/repay`, { method: 'POST' });
}

export function repayFullLoan(loanId: number) {
	return fetchSpring(`/api/loans/${loanId}/repay-full`, { method: 'POST' });
}
