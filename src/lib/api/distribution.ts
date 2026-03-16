import { fetchSpring } from './config';
import type { ProductResponse } from './product';

export type { ProductResponse };

export interface MarketResponse {
	id: number;
	code: string;
	name: string;
	flagEmoji: string;
	totalMarketSize: number;
	availableMarketSize: number;
	shippingCostPerContainer: number;
	tariffRateMin: number;
	tariffRateMax: number;
	deliveryDaysMin: number;
	deliveryDaysMax: number;
}

export interface ProductInventoryResponse {
	productId: number;
	productCode: string;
	productName: string;
	category: string;
	gradeA: number;
	gradeB: number;
	gradeC: number;
	gradeD: number;
	total: number;
}

export interface DistributionSummaryResponse {
	totalFactoryWarehouseCapacity: number;
	totalFactoryInventory: number;
	warehouseUsagePercent: number;
	productInventories: ProductInventoryResponse[];
	activeShipments: number;
	inTransitQuantity: number;
	monthlyExportRevenue: number;
	monthlyShippingCost: number;
	monthlyTariffCost: number;
	activeMarkets: number;
}

export interface ShipmentResponse {
	id: number;
	companyId: number;
	companyName: string;
	sourceFactoryId: number;
	sourceFactoryName: string;
	targetMarket: MarketResponse;
	marketCode: string;
	marketName: string;
	product: ProductResponse;
	qualityGrade: string;
	quantity: number;
	shippingCost: number;
	tariffCost: number;
	tariffRate: number;
	totalCost: number;
	goodsValue: number;
	departureDate: string;
	estimatedArrivalDate: string;
	actualArrivalDate: string | null;
	status: string;
	statusName: string;
	remainingHours: number;
}

export interface CreateShipmentRequest {
	factoryId: number;
	productId: number;
	qualityGrade: string;
	marketCode: string;
	quantity: number;
}

export interface ShipmentEstimateResponse {
	quantity: number;
	containers: number;
	goodsValue: number;
	shippingCost: number;
	estimatedTariffMin: number;
	estimatedTariffMax: number;
	totalCostMin: number;
	totalCostMax: number;
	estimatedDaysMin: number;
	estimatedDaysMax: number;
}

export interface SalesRecordResponse {
	id: number;
	marketCode: string;
	marketName: string;
	productName: string;
	qualityGrade: string;
	saleDate: string;
	quantity: number;
	unitPrice: number;
	totalRevenue: number;
	productionCost: number;
	netProfit: number;
}

export function getDistributionSummary() {
	return fetchSpring<DistributionSummaryResponse>('/api/distribution/summary');
}

export function getMarkets() {
	return fetchSpring<MarketResponse[]>('/api/distribution/markets');
}

export function getMarketDetail(code: string) {
	return fetchSpring<MarketResponse>(`/api/distribution/markets/${code}`);
}

export function getShipments() {
	return fetchSpring<ShipmentResponse[]>('/api/distribution/shipments');
}

export function getActiveShipments() {
	return fetchSpring<ShipmentResponse[]>('/api/distribution/shipments/active');
}

export function estimateShipment(params: { factoryId: number; productId: number; qualityGrade: string; marketCode: string; quantity: number }) {
	const q = new URLSearchParams({
		factoryId: String(params.factoryId),
		productId: String(params.productId),
		qualityGrade: params.qualityGrade,
		marketCode: params.marketCode,
		quantity: String(params.quantity)
	});
	return fetchSpring<ShipmentEstimateResponse>(`/api/distribution/shipments/estimate?${q}`);
}

export function createShipment(req: CreateShipmentRequest) {
	return fetchSpring<ShipmentResponse>('/api/distribution/shipments', {
		method: 'POST',
		body: JSON.stringify(req)
	});
}

export function getSales() {
	return fetchSpring<SalesRecordResponse[]>('/api/distribution/sales');
}
