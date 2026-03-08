import { fetchSpring } from './config';

const ASSET_ERROR_MESSAGES: Record<string, string> = {
	L001: '레벨이 부족합니다.',
	A001: '잔액이 부족합니다.',
	AS002: '이미 보유한 자산입니다.',
	AS001: '자산을 찾을 수 없습니다.'
};

export function getAssetErrorMessage(e: unknown): string {
	if (e instanceof Error) {
		const code = (e as Error & { code?: string }).code;
		if (code && ASSET_ERROR_MESSAGES[code]) return ASSET_ERROR_MESSAGES[code];
		return e.message;
	}
	return '구매에 실패했습니다.';
}

export interface VehicleItem {
	id: number;
	name: string;
	brand: string;
	imageUrl: string;
	price: number;
	maxSpeed: number;
	color: string;
	interior: string;
	maintenanceCostPerDay: number;
	fameBonus: number;
	requiredLevel: number;
}

export interface JetItem {
	id: number;
	name: string;
	brand: string;
	imageUrl: string;
	price: number;
	maxSpeed: number;
	rangeKm: number;
	seats: number;
	maintenanceCostPerDay: number;
	fameBonus: number;
	requiredLevel: number;
	purchasedAt?: string;
}

export interface YachtItem {
	id: number;
	name: string;
	brand: string;
	imageUrl: string;
	price: number;
	maintenanceCostPerDay: number;
	fameBonus: number;
	requiredLevel: number;
}

export interface RealEstateItem {
	id: number;
	name: string;
	brand: string;
	imageUrl: string;
	price: number;
	maintenanceCostPerDay: number;
	fameBonus: number;
	requiredLevel: number;
}

export interface LuxuryItem {
	id: number;
	name: string;
	brand: string;
	imageUrl: string;
	price: number;
	maintenanceCostPerDay: number;
	fameBonus: number;
	requiredLevel: number;
}

export interface PageResponse<T> {
	content: T[];
	totalPages: number;
	totalElements: number;
	numberOfElements: number;
	first: boolean;
	last: boolean;
	size: number;
	number: number;
	empty: boolean;
}

export function getVehicles(page = 0, size = 20) {
	return fetchSpring<PageResponse<VehicleItem>>(`/api/assets/vehicles?page=${page}&size=${size}`);
}

export function getVehicleDetail(id: number) {
	return fetchSpring<VehicleItem>(`/api/assets/vehicles/${id}`);
}

export function getMyVehicles() {
	return fetchSpring<VehicleItem[]>('/api/assets/vehicles/my');
}

export function purchaseVehicle(id: number) {
	return fetchSpring(`/api/assets/vehicles/${id}/purchase`, { method: 'POST' });
}

export function sellVehicle(userVehicleId: number) {
	return fetchSpring(`/api/assets/vehicles/${userVehicleId}/sell`, { method: 'DELETE' });
}

export function getJets(page = 0, size = 20) {
	return fetchSpring<PageResponse<JetItem>>(`/api/assets/jets?page=${page}&size=${size}`);
}

export function getJetDetail(id: number) {
	return fetchSpring<JetItem>(`/api/assets/jets/${id}`);
}

export function getMyJets() {
	return fetchSpring<JetItem[]>('/api/assets/jets/my');
}

export function purchaseJet(id: number) {
	return fetchSpring(`/api/assets/jets/${id}/purchase`, { method: 'POST' });
}

export function sellJet(userJetId: number) {
	return fetchSpring(`/api/assets/jets/${userJetId}/sell`, { method: 'DELETE' });
}

export function getYachts(page = 0, size = 20) {
	return fetchSpring<PageResponse<YachtItem>>(`/api/assets/yachts?page=${page}&size=${size}`);
}

export function getYachtDetail(id: number) {
	return fetchSpring<YachtItem>(`/api/assets/yachts/${id}`);
}

export function getMyYachts() {
	return fetchSpring<YachtItem[]>('/api/assets/yachts/my');
}

export function purchaseYacht(id: number) {
	return fetchSpring(`/api/assets/yachts/${id}/purchase`, { method: 'POST' });
}

export function sellYacht(id: number) {
	return fetchSpring(`/api/assets/yachts/${id}/sell`, { method: 'POST' });
}

export function getRealEstates(page = 0, size = 20) {
	return fetchSpring<PageResponse<RealEstateItem>>(`/api/assets/real-estates?page=${page}&size=${size}`);
}

export function getRealEstateDetail(id: number) {
	return fetchSpring<RealEstateItem>(`/api/assets/real-estates/${id}`);
}

export function getMyRealEstates() {
	return fetchSpring<RealEstateItem[]>('/api/assets/real-estates/my');
}

export function purchaseRealEstate(id: number) {
	return fetchSpring(`/api/assets/real-estates/${id}/purchase`, { method: 'POST' });
}

export function sellRealEstate(id: number) {
	return fetchSpring(`/api/assets/real-estates/${id}/sell`, { method: 'POST' });
}

export function getLuxuryItems(page = 0, size = 20) {
	return fetchSpring<PageResponse<LuxuryItem>>(`/api/assets/luxury-items?page=${page}&size=${size}`);
}

export function getLuxuryItemDetail(id: number) {
	return fetchSpring<LuxuryItem>(`/api/assets/luxury-items/${id}`);
}

export function getMyLuxuryItems() {
	return fetchSpring<LuxuryItem[]>('/api/assets/luxury-items/my');
}

export function purchaseLuxuryItem(id: number) {
	return fetchSpring(`/api/assets/luxury-items/${id}/purchase`, { method: 'POST' });
}

export function sellLuxuryItem(id: number) {
	return fetchSpring(`/api/assets/luxury-items/${id}/sell`, { method: 'POST' });
}
