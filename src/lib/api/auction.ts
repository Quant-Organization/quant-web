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
