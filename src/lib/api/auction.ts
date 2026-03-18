import { fetchSpring } from './config';

export interface AuctionResponse {
	id: number;
	itemType: string;
	itemId: number;
	itemName: string;
	itemImageUrl: string;
	itemDescription: string;
	startPrice: number;
	currentHighestBid: number;
	minBidIncrement: number;
	minimumBid: number;
	maxWinners: number;
	totalBids: number;
	startTime: string;
	endTime: string;
	status: string;
	statusName: string;
	remainingSeconds: number;
	canBid: boolean;
}

export interface AuctionBidResponse {
	id: number;
	auctionId: number;
	userId: number;
	playerName: string;
	bidAmount: number;
	bidTime: string;
	isWinningBid: boolean;
	bidRank: number;
}

export interface BidResponse {
	id: number;
	userId: number;
	bidderName: string;
	bidAmount: number;
	bidTime: string;
	isWinningBid: boolean;
}

export interface AuctionDetailResponse extends AuctionResponse {
	bids: BidResponse[];
}

export interface AuctionWinnerResponse {
	id: number;
	auction: AuctionResponse;
	userId: number;
	playerName: string;
	winningBidAmount: number;
	rank: number;
	isPaid: boolean;
	paidAt: string | null;
	isDelivered: boolean;
	deliveredAt: string | null;
}

export interface CreateAuctionRequest {
	itemType: string;
	itemId?: number;
	itemName: string;
	itemImageUrl?: string;
	itemDescription?: string;
	startPrice: number;
	minBidIncrement?: number;
	maxWinners?: number;
	startTime: string;
	endTime: string;
}

export interface UpdateAuctionRequest {
	itemName?: string;
	itemImageUrl?: string;
	itemDescription?: string;
	startPrice?: number;
	minBidIncrement?: number;
	maxWinners?: number;
	startTime?: string;
	endTime?: string;
}

export function getActiveAuctions() {
	return fetchSpring<AuctionResponse[]>('/api/auctions/active');
}

export function getScheduledAuctions() {
	return fetchSpring<AuctionResponse[]>('/api/auctions/scheduled');
}

export function getAuctionDetail(auctionId: number) {
	return fetchSpring<AuctionDetailResponse>(`/api/auctions/${auctionId}`);
}

export function getAuctionBids(auctionId: number) {
	return fetchSpring<AuctionBidResponse[]>(`/api/auctions/${auctionId}/bids`);
}

export function placeBid(auctionId: number, bidAmount: number) {
	return fetchSpring<AuctionBidResponse>(`/api/auctions/${auctionId}/bid`, {
		method: 'POST',
		body: JSON.stringify({ bidAmount })
	});
}

export function getMyBids() {
	return fetchSpring<AuctionBidResponse[]>('/api/auctions/my/bids');
}

export function getMyWins() {
	return fetchSpring<AuctionWinnerResponse[]>('/api/auctions/my/wins');
}

export function payForWin(winnerId: number) {
	return fetchSpring(`/api/auctions/wins/${winnerId}/pay`, { method: 'POST' });
}

// === 관리자용 API ===

export function getAllAuctionsAdmin() {
	return fetchSpring<AuctionResponse[]>('/api/admin/auctions');
}

export function createAuctionAdmin(request: CreateAuctionRequest) {
	return fetchSpring<AuctionResponse>('/api/admin/auctions', {
		method: 'POST',
		body: JSON.stringify(request)
	});
}

export function updateAuctionAdmin(auctionId: number, request: UpdateAuctionRequest) {
	return fetchSpring<AuctionResponse>(`/api/admin/auctions/${auctionId}`, {
		method: 'PUT',
		body: JSON.stringify(request)
	});
}

export function cancelAuctionAdmin(auctionId: number) {
	return fetchSpring<AuctionResponse>(`/api/admin/auctions/${auctionId}/cancel`, {
		method: 'POST'
	});
}

export function deleteAuctionAdmin(auctionId: number) {
	return fetchSpring<{ success: boolean; message: string }>(`/api/admin/auctions/${auctionId}`, {
		method: 'DELETE'
	});
}
