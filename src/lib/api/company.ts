import { fetchSpring } from './config';

export interface CompanyResponse {
	id: number;
	name: string;
	companyType: string;
	ceoName: string;
	headquartersRegionId: number;
	headquartersRegionName: string;
	foundedDate: string;
	mainProduct: string;
	totalRevenue: number;
	monthlyRevenue: number;
	operatingCost: number;
	netIncome: number;
	totalEmployees: number;
	competitivenessScore: number;
	marketShare: number;
	createdAt: string;
	updatedAt: string;
}

export interface CompanyType {
	typeCode: string;
	displayName: string;
	description: string;
	initialCost: number;
	requiredLevel: number;
	primaryMaterial: string;
	marginRateMin: number;
	marginRateMax: number;
	marketVolatility: string;
}

export interface CreateCompanyRequest {
	name: string;
	companyType: string;
	ceoName?: string;
	headquartersRegionId: number;
	mainProduct?: string;
}

export function getMyCompanies(page = 0, size = 20) {
	return fetchSpring<{ companies: CompanyResponse[]; totalElements: number; totalPages: number; currentPage: number }>(`/api/companies/my?page=${page}&size=${size}`);
}

export function getCompanyDetail(id: number) {
	return fetchSpring<CompanyResponse>(`/api/companies/${id}`);
}

export function getCompanyTypes() {
	return fetchSpring<CompanyType[]>('/api/companies/types');
}

export function getAvailableCompanyTypes() {
	return fetchSpring<CompanyType[]>('/api/companies/types/available');
}

export function getCompanyStats() {
	return fetchSpring<Record<string, unknown>>('/api/companies/stats');
}

export function createCompany(req: CreateCompanyRequest) {
	return fetchSpring<CompanyResponse>('/api/companies', { method: 'POST', body: JSON.stringify(req) });
}

export function updateCompany(id: number, data: { name?: string; ceoName?: string; mainProduct?: string }) {
	return fetchSpring(`/api/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteCompany(id: number) {
	return fetchSpring(`/api/companies/${id}`, { method: 'DELETE' });
}
