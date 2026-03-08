<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import {
		getActiveAuctions, getScheduledAuctions, getAuctionBids, placeBid, getMyBids, getMyWins,
		getAuctionDetail, payForWin,
		type AuctionResponse, type AuctionBidResponse, type AuctionWinnerResponse,
		type AuctionDetailResponse
	} from '$lib/api/auction';
	import Skeleton from '$lib/components/Skeleton.svelte';
	let timeLeft = $state({ hours: 0, minutes: 0, seconds: 0 });
	let timer: ReturnType<typeof setInterval> | undefined;

	function startTimerFrom(seconds: number) {
		if (timer) clearInterval(timer);
		let remaining = seconds;
		timeLeft = {
			hours: Math.floor(remaining / 3600),
			minutes: Math.floor((remaining % 3600) / 60),
			seconds: remaining % 60
		};
		timer = setInterval(() => {
			if (remaining > 0) {
				remaining--;
				timeLeft = {
					hours: Math.floor(remaining / 3600),
					minutes: Math.floor((remaining % 3600) / 60),
					seconds: remaining % 60
				};
			} else {
				clearInterval(timer);
			}
		}, 1000);
	}

	onDestroy(() => { if (timer) clearInterval(timer); });

	// --- 상태 ---
	let bidAmount = $state('');
	let activeAuctions = $state<AuctionResponse[]>([]);
	let scheduledAuctions = $state<AuctionResponse[]>([]);
	let currentBids = $state<AuctionBidResponse[]>([]);
	let myBids = $state<AuctionBidResponse[]>([]);
	let myWins = $state<AuctionWinnerResponse[]>([]);
	let selectedAuction = $state<AuctionResponse | null>(null);
	let activeTab = $state('진행 중');
	let bidError = $state('');
	let bidSuccess = $state('');
	let loading = $state(true);
	let modalOpen = $state(false);
	let detailAuction = $state<AuctionDetailResponse | null>(null);
	let detailLoading = $state(false);
	let payingId = $state<number | null>(null);
	let payResults = $state<Partial<Record<number, { success?: string; error?: string }>>>({});

	onMount(async () => {
		try {
			const [active, scheduled, bids, wins] = await Promise.all([
				getActiveAuctions().catch(() => [] as AuctionResponse[]),
				getScheduledAuctions().catch(() => [] as AuctionResponse[]),
				getMyBids().catch(() => [] as AuctionBidResponse[]),
				getMyWins().catch(() => [] as AuctionWinnerResponse[])
			]);
			activeAuctions = active;
			scheduledAuctions = scheduled;
			myBids = bids;
			myWins = wins;
			if (activeAuctions.length > 0) {
				await selectAuction(activeAuctions[0]);
			}
		} catch (e) {
			console.error('경매 데이터 로드 실패:', e);
		} finally {
			loading = false;
		}
	});

	async function selectAuction(auction: AuctionResponse) {
		selectedAuction = auction;
		bidAmount = '';
		bidError = '';
		bidSuccess = '';
		startTimerFrom(auction.remainingSeconds);
		try {
			currentBids = await getAuctionBids(auction.id);
		} catch {
			currentBids = [];
		}
	}

	async function submitBid() {
		if (!selectedAuction) return;
		const amount = parseInt(bidAmount.replace(/[^0-9]/g, ''));
		if (!amount || amount < selectedAuction.minimumBid) {
			bidError = `최소 입찰가는 ${(selectedAuction.minimumBid ?? 0).toLocaleString()}원입니다.`;
			return;
		}
		bidError = '';
		try {
			await placeBid(selectedAuction.id, amount);
			bidSuccess = '입찰이 완료되었습니다!';
			toast.success('입찰이 완료되었습니다.');
			bidAmount = '';
			// 최신 데이터 갱신
			const [updated, bids] = await Promise.all([
				getActiveAuctions(),
				getAuctionBids(selectedAuction.id)
			]);
			activeAuctions = updated;
			currentBids = bids;
			const found = updated.find(a => a.id === selectedAuction!.id);
			if (found) selectedAuction = found;
		} catch (e: unknown) {
			bidError = e instanceof Error ? e.message : '입찰 실패';
			toast.error(bidError);
		}
	}

	function addToBid(amount: number) {
		const current = parseInt(bidAmount.replace(/[^0-9]/g, '')) || 0;
		bidAmount = (current + amount).toLocaleString();
	}

	function formatTime(num: number) {
		return String(num).padStart(2, '0');
	}

	// 내 입찰 기록에서 특정 경매의 최고 입찰가
	function getMyHighestBid(auctionId: number) {
		return myBids.filter(b => b.auctionId === auctionId).sort((a, b) => b.bidAmount - a.bidAmount)[0];
	}

	async function openDetailModal(auction: AuctionResponse) {
		modalOpen = true;
		detailLoading = true;
		detailAuction = null;
		selectAuction(auction);
		try {
			detailAuction = await getAuctionDetail(auction.id);
		} catch {
			detailAuction = null;
		} finally {
			detailLoading = false;
		}
	}

	function closeDetailModal() {
		modalOpen = false;
		detailAuction = null;
	}

	async function handlePay(winId: number) {
		payingId = winId;
		payResults = { ...payResults, [winId]: {} };
		try {
			await payForWin(winId);
			payResults = { ...payResults, [winId]: { success: '결제가 완료되었습니다!' } };
			toast.success('결제가 완료되었습니다.');
			myWins = await getMyWins().catch(() => myWins);
		} catch (e) {
			const errMsg = e instanceof Error ? e.message : '결제 실패';
			payResults = { ...payResults, [winId]: { error: errMsg } };
			toast.error(errMsg);
		} finally {
			payingId = null;
		}
	}
</script>

<div class="container">
	<div class="content">
		<h1 class="main-title">라이브 경매</h1>

		{#if loading}
			<div class="loading" style="display: flex; flex-direction: column; gap: 1rem; padding: 2rem;">
				<div style="display: flex; gap: 2rem;">
					<Skeleton width="50%" height="20rem" radius="1rem" />
					<div style="flex: 1; display: flex; flex-direction: column; gap: 0.75rem;">
						<Skeleton width="60%" height="1.5rem" />
						<Skeleton width="40%" height="1.25rem" />
						<Skeleton width="100%" height="3rem" radius="0.5rem" />
						<Skeleton width="100%" height="3rem" radius="0.5rem" />
					</div>
				</div>
			</div>
		{:else}
		<!-- Live Auction Section -->
		{#if selectedAuction}
		<div class="grid-2">
			<!-- Item Image -->
			<div class="car-frame-outer">
				<div class="car-frame">
					{#if selectedAuction.itemImageUrl}
						<img src={selectedAuction.itemImageUrl} alt={selectedAuction.itemName} class="car-image" />
					{:else}
						<div class="no-image">🏺</div>
					{/if}
				</div>
			</div>

			<!-- Auction Details -->
			<div class="auction-details">
				<div class="auction-title">
					<h2>{selectedAuction.itemName}</h2>
				</div>

				<div class="countdown-label">
					<p>경매 종료까지 남은 시간</p>
				</div>
				<div class="timer">
					<div class="timer-unit">
						<div class="timer-number">{formatTime(timeLeft.hours)}</div>
						<div class="timer-label">Hours</div>
					</div>
					<div class="timer-unit">
						<div class="timer-number">{formatTime(timeLeft.minutes)}</div>
						<div class="timer-label">Minutes</div>
					</div>
					<div class="timer-unit">
						<div class="timer-number">{formatTime(timeLeft.seconds)}</div>
						<div class="timer-label">Seconds</div>
					</div>
				</div>

				<!-- Bidding Section -->
				<div class="info-grid">
					<div class="info-box">
						<p class="info-label">현재 최고 입찰가</p>
						<p class="info-value price-yellow">{(selectedAuction.currentHighestBid ?? 0).toLocaleString()}원</p>
					</div>
					<div class="info-box">
						<p class="info-label">총 입찰 횟수</p>
						<p class="info-value">{selectedAuction.totalBids} Bids</p>
					</div>
				</div>

				<!-- Bid Input and Recent Bids -->
				<div class="bid-section">
					<div class="bid-card">
						{#if bidError}<p class="bid-error">{bidError}</p>{/if}
						{#if bidSuccess}<p class="bid-success">{bidSuccess}</p>{/if}
						<input
								type="text"
								placeholder="입찰 희망 금액 (최소 {(selectedAuction.minimumBid ?? 0).toLocaleString()}원)"
								class="bid-input"
								bind:value={bidAmount}
						/>
						<div class="bid-btn" onclick={() => addToBid(5000000)} role="button" tabindex="0">
							+ 5,000,000
						</div>
						<div class="bid-btn" onclick={() => addToBid(1000000)} role="button" tabindex="0">
							+ 1,000,000
						</div>
						<div class="submit-btn" onclick={submitBid} role="button" tabindex="0">입찰하기</div>
					</div>

					<!-- Recent Bids -->
					<div class="bids-list">
						<h3 class="bids-title">최근 입찰자 목록</h3>
						<div>
							{#each currentBids.slice(0, 5) as bid, index}
								<div class="bid-item">
									<div class="bid-user">
										{#if index === 0}
											<div class="crown-wrapper">
												<img src="/src/lib/images/crown.svg" alt="crown" class="crown-icon" />
											</div>
										{/if}
										<img src="/src/lib/images/auction_profile.svg" alt="profile" class="profile-icon" />
										<span>{bid.playerName}</span>
									</div>
									<span class="bid-amount">{(bid.bidAmount ?? 0).toLocaleString()}원</span>
								</div>
							{/each}
							{#if currentBids.length === 0}
								<p class="no-bids">아직 입찰자가 없습니다.</p>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
		{/if}

		<!-- Ongoing Auctions -->
		<div>
			<h2 class="section-title">현재 진행 중인 경매</h2>
			<div class="auctions-grid">
				{#each activeAuctions as auction}
					<div class="auction-card" onclick={() => openDetailModal(auction)} role="button" tabindex="0"
						class:selected={selectedAuction?.id === auction.id}>
						<div class="auction-image">
							{#if auction.itemImageUrl}
								<img src={auction.itemImageUrl} alt={auction.itemName} />
							{:else}
								<span>🏺</span>
							{/if}
						</div>
						<div class="auction-info">
							<h3>{auction.itemName}</h3>
							<p class="auction-date">종료: {new Date(auction.endTime).toLocaleString('ko-KR')}</p>
							<p class="auction-price">현재가: {(auction.currentHighestBid ?? 0).toLocaleString()}원</p>
						</div>
					</div>
				{/each}
				{#if activeAuctions.length === 0}
					<p class="empty-text">진행 중인 경매가 없습니다.</p>
				{/if}
			</div>
		</div>

		<!-- Scheduled Auctions -->
		{#if scheduledAuctions.length > 0}
		<div>
			<h2 class="section-title">예정된 경매</h2>
			<div class="auctions-grid">
				{#each scheduledAuctions as auction}
					<div class="auction-card" role="button" tabindex="0">
						<div class="auction-image">
							{#if auction.itemImageUrl}
								<img src={auction.itemImageUrl} alt={auction.itemName} />
							{:else}
								<span>🏺</span>
							{/if}
						</div>
						<div class="auction-info">
							<h3>{auction.itemName}</h3>
							<p class="auction-date">시작: {new Date(auction.startTime).toLocaleString('ko-KR')}</p>
							<p class="auction-price">시작가: {(auction.startPrice ?? 0).toLocaleString()}원</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
		{/if}

		<!-- My Auctions -->
		<div>
			<h2 class="section-title">나의 경매 기록</h2>

			<!-- Tabs -->
			<div class="tabs">
				<button class="tab" class:active={activeTab === '진행 중'} onclick={() => activeTab = '진행 중'}>
					진행 중
				</button>
				<button class="tab" class:active={activeTab === '낙찰'} onclick={() => activeTab = '낙찰'}>
					낙찰
				</button>
			</div>

			<!-- Table Header (진행 중 tab) -->
			<div class="table-header">
				<div>경매품</div>
				<div>나의 입찰가</div>
				<div>낙찰 여부</div>
				<div>상태</div>
				<div>입찰 시간</div>
			</div>

			{#if activeTab === '진행 중'}
				{#each myBids as bid}
					<div class="table-row">
						<div class="item-cell">
							<div class="item-icon">🏺</div>
							<span>경매 #{bid.auctionId}</span>
						</div>
						<div>{(bid.bidAmount ?? 0).toLocaleString()}원</div>
						<div>{bid.isWinningBid ? '낙찰' : '입찰 중'}</div>
						<div>
							<span class="status-badge {bid.isWinningBid ? 'status-highest' : 'status-bidding'}">
								{bid.isWinningBid ? '최고가' : `${bid.bidRank}위`}
							</span>
						</div>
						<div>{new Date(bid.bidTime).toLocaleString('ko-KR')}</div>
					</div>
				{/each}
				{#if myBids.length === 0}
					<p class="empty-text">입찰 기록이 없습니다.</p>
				{/if}
			{:else}
				<!-- Table Header for wins (6 columns) -->
				<div class="table-header wins-cols">
					<div>경매품</div>
					<div>낙찰가</div>
					<div>낙찰 순위</div>
					<div>상태</div>
					<div>경매 종료</div>
					<div>결제</div>
				</div>
				{#each myWins as win}
					<div class="table-row wins-cols">
						<div class="item-cell">
							<div class="item-icon">🏆</div>
							<span>{win.auction.itemName}</span>
						</div>
						<div>{(win.winningBidAmount ?? 0).toLocaleString()}원</div>
						<div>{win.rank}위 낙찰</div>
						<div>
							<span class="status-badge {win.isPaid || payResults[win.id]?.success ? 'status-highest' : 'status-bidding'}">
								{win.isPaid || payResults[win.id]?.success ? '결제완료' : '결제대기'}
							</span>
						</div>
						<div>{win.auction.endTime ? new Date(win.auction.endTime).toLocaleDateString('ko-KR') : '-'}</div>
						<div class="pay-cell">
							{#if !win.isPaid && !payResults[win.id]?.success}
								<button class="pay-btn" onclick={() => handlePay(win.id)} disabled={payingId === win.id}>
									{payingId === win.id ? '처리 중...' : '결제하기'}
								</button>
								{#if payResults[win.id]?.error}
									<p class="pay-error">{payResults[win.id]?.error}</p>
								{/if}
							{/if}
						</div>
					</div>
				{/each}
				{#if myWins.length === 0}
					<p class="empty-text">낙찰 기록이 없습니다.</p>
				{/if}
			{/if}
		</div>
		{/if}
	</div>

	<!-- Detail Modal -->
	{#if modalOpen}
		<div class="modal-overlay" onclick={closeDetailModal} role="presentation">
			<div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
				<div class="modal-header">
					<h2>{detailAuction ? detailAuction.itemName : '로딩 중...'}</h2>
					<button class="modal-close" onclick={closeDetailModal}>✕</button>
				</div>
				{#if detailLoading}
					<p class="loading">데이터를 불러오는 중...</p>
				{:else if detailAuction}
					<div class="modal-body">
						{#if detailAuction.itemImageUrl}
							<img src={detailAuction.itemImageUrl} alt={detailAuction.itemName} class="modal-image" />
						{/if}
						<div class="modal-info-row">
							<span>현재 최고 입찰가: <strong class="price-yellow">{(detailAuction.currentHighestBid ?? 0).toLocaleString()}원</strong></span>
							<span>총 입찰: {detailAuction.totalBids}회</span>
						</div>
						<h3 class="bids-title">입찰 내역</h3>
						<div class="modal-bids">
							{#each (detailAuction.bids ?? []) as bid, i}
								<div class="bid-item">
									<div class="bid-user">
										{#if i === 0}
											<div class="crown-wrapper">
												<img src="/src/lib/images/crown.svg" alt="crown" class="crown-icon" />
											</div>
										{/if}
										<img src="/src/lib/images/auction_profile.svg" alt="profile" class="profile-icon" />
										<span>{bid.bidderName}</span>
									</div>
									<span class="bid-amount">{(bid.bidAmount ?? 0).toLocaleString()}원</span>
								</div>
							{/each}
							{#if detailAuction.bids.length === 0}
								<p class="no-bids">입찰 내역이 없습니다.</p>
							{/if}
						</div>
					</div>
				{:else}
					<p class="loading">경매 정보를 불러올 수 없습니다.</p>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.container, .content, .auction-title, .timer, .info-box, .bid-card, .bids-list, .auction-card, .main-title, .section-title, .countdown-label, .timer-number, .timer-label, .info-label, .info-value, .bids-title, .auction-info h3 {
		font-family: '국립박물관문화재단클래식', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-weight: 300;
	}

	.container {
		min-height: 100vh;
		max-width: 80%;
		color: #fff;
		margin: 0 auto;
		display: flex;
		align-items: flex-start;
	}

	.content {
		width: 100%;
	}

	.main-title {
		font-size: 2.5rem;
		margin-bottom: 2rem;
	}

	.grid-2 {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		margin-bottom: 4rem;
		align-items: start;
	}

	@media (min-width: 1024px) {
		.grid-2 {
			grid-template-columns: 1fr 1fr;
		}
	}

	.auction-details {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.car-frame-outer {
		border: 1px solid #454544;
		border-radius: 0.5rem;
		padding: 1.2rem;
		background: #1D1D1D;
		height: fit-content;
	}

	.car-frame {
		border: 1px solid #987625;
		border-radius: 0.5rem;
		padding: 1.2rem 0;
		display: flex;
		align-items: center;
		background: #1D1D1D;
		height: fit-content;
	}

	.car-image {
		width: 100%;
		height: auto;
		display: block;
	}

	.auction-title {
		border-top: 1px solid #DCA82D;
		border-bottom: 1px solid #DCA82D;
		padding: 1rem 0;
		margin-bottom: 1.5rem;
		text-align: center;
		font-size: 1.875rem;
	}

	.auction-title h2 {
		font-size: 1.5rem;
	}

	.countdown-label {
		color: #9ca3af;
		margin-bottom: 1rem;
		text-align: center;
	}

	.timer {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.timer-unit {
		text-align: center;
	}

	.timer-number {
		font-size: 3rem;
	}

	.timer-label {
		font-size: 0.875rem;
		color: #9ca3af;
	}

	.info-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 3rem;
	}

	.bid-section {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1.5rem;
		flex: 1;
		align-items: stretch;
	}

	.info-box {
		background-color: #1D1D1D;
		padding: 1rem;
		border: 1px solid rgba(220, 168, 45, 0.1);
		border-radius: 0.375rem;
	}

	.bid-card {
		background-color: #1D1D1D;
		padding: 1rem;
		border: 1px solid rgba(220, 168, 45, 0.1);
		border-radius: 0.375rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.info-label {
		color: #9ca3af;
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
	}

	.info-value {
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.price-yellow {
		color: #eab308;
	}

	.bid-input {
		background-color: transparent;
		width: 100%;
		border: 1px solid #707070;
		border-radius: 0.375rem;
		padding: 1rem 1rem;
		color: #fff;
		box-sizing: border-box;
		font-size: 1rem;
	}

	.bid-btn {
		background-color: rgba(0, 0, 0, 0.3);
		border: none;
		padding: 0.8rem;
		border-radius: 0.375rem;
		color: #fff;
		cursor: pointer;
		text-align: center;
		font-size: 1.2rem;
	}

	.bid-btn:hover {
		background-color: #374151;
	}

	.submit-btn {
		width: 100%;
		background-color: transparent;
		border: 1px solid #ca8a04;
		padding: 0.8rem;
		border-radius: 0.375rem;
		color: #987625;
		font-size: 1rem;
		cursor: pointer;
		text-align: center;
	}

	.submit-btn:hover {
		background-color: #4e3005;
	}

	.bids-list {
		background-color: #1D1D1D;
		border: 1px solid rgba(220, 168, 45, 0.1);
		border-radius: 0.375rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.bids-title {
		margin-bottom: 1.2rem;
	}

	.bid-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem 0;
	}

	.bid-user {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		position: relative;
	}

	.crown-wrapper {
		position: absolute;
		left: 0;
		bottom: 100%;
		margin-bottom: -0.3rem;
	}

	.crown-icon {
		width: 1.5rem;
		height: 1.5rem;
	}

	.profile-icon {
		width: 1.5rem;
		height: 1.5rem;
	}

	.bid-user span {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.bid-amount {
		font-size: 1rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.section-title {
		font-size: 1.875rem;
		margin-bottom: 1.5rem;
	}

	.auctions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 4rem;
	}

	.auction-card {
		border: 1px solid #4b5563;
		border-radius: 0.5rem;
		overflow: hidden;
		cursor: pointer;
		transition: border-color 0.3s;
	}

	.auction-card:hover {
		border-color: #ca8a04;
	}

	.auction-image {
		aspect-ratio: 1;
		background: linear-gradient(to bottom, #1f2937, #000);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 4rem;
	}

	.auction-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.auction-info {
		padding: 1rem;
	}

	.auction-info h3 {
		margin-bottom: 0.5rem;
	}

	.auction-date {
		font-size: 0.875rem;
		color: #9ca3af;
		margin-bottom: 0.5rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.auction-price {
		color: #eab308;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.tabs {
		display: flex;
		gap: 2rem;
		border-bottom: 1px solid #4b5563;
		margin-bottom: 1.5rem;
	}

	.tab {
		padding-bottom: 1rem;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		color: #9ca3af;
		cursor: pointer;
		font-size: 1rem;
	}

	.tab.active {
		border-bottom-color: #eab308;
		color: #fff;
	}

	.tab:hover {
		color: #fff;
	}

	.table-header {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
		gap: 1rem;
		padding: 0.75rem 1rem;
		color: #9ca3af;
		font-size: 0.875rem;
		border-bottom: 1px solid #1f2937;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.table-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
		gap: 1rem;
		padding: 1rem;
		align-items: center;
		border-bottom: 1px solid #1f2937;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.table-row:hover {
		background-color: #111827;
	}

	.item-cell {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.item-icon {
		width: 3rem;
		height: 3rem;
		background-color: #1f2937;
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
	}

	.item-icon img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 0.375rem;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
	}

	.status-highest {
		background-color: #713f12;
		color: #eab308;
	}

	.status-bidding {
		background-color: #1f2937;
		color: #d1d5db;
	}

	.loading, .empty-text, .no-bids {
		color: #9ca3af;
		padding: 1rem 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.bid-error {
		color: #ef4444;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.bid-success {
		color: #10b981;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.no-image {
		font-size: 5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 200px;
	}

	.auction-card.selected {
		border-color: #ca8a04;
	}

	.wins-cols {
		grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
	}

	.pay-cell {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
	}

	.pay-btn {
		background-color: transparent;
		border: 1px solid #ca8a04;
		padding: 0.3rem 0.75rem;
		border-radius: 0.25rem;
		color: #eab308;
		font-size: 0.875rem;
		cursor: pointer;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.pay-btn:hover:not(:disabled) {
		background-color: #4e3005;
	}

	.pay-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pay-error {
		color: #ef4444;
		font-size: 0.75rem;
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: #1D1D1D;
		border: 1px solid #454544;
		border-radius: 0.75rem;
		padding: 2rem;
		width: 90%;
		max-width: 600px;
		max-height: 80vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid #DCA82D;
		padding-bottom: 1rem;
		margin-bottom: 1.5rem;
	}

	.modal-header h2 {
		font-size: 1.25rem;
		font-family: '국립박물관문화재단클래식', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-weight: 300;
	}

	.modal-close {
		background: none;
		border: none;
		color: #9ca3af;
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
	}

	.modal-close:hover {
		color: #fff;
	}

	.modal-image {
		width: 100%;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.modal-info-row {
		display: flex;
		gap: 2rem;
		margin-bottom: 1.5rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		color: #d1d5db;
	}

	.modal-bids {
		max-height: 250px;
		overflow-y: auto;
	}
</style>