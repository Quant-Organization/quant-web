<script>
	import { onMount, onDestroy } from 'svelte';

	let timeLeft = {
		hours: 12,
		minutes: 34,
		seconds: 56
	};

	let timer;

	onMount(() => {
		timer = setInterval(() => {
			if (timeLeft.seconds > 0) {
				timeLeft.seconds--;
			} else if (timeLeft.minutes > 0) {
				timeLeft.minutes--;
				timeLeft.seconds = 59;
			} else if (timeLeft.hours > 0) {
				timeLeft.hours--;
				timeLeft.minutes = 59;
				timeLeft.seconds = 59;
			}
			timeLeft = timeLeft;
		}, 1000);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});

	let bidAmount = '';

	const currentBids = [
		{ user: 'User1', amount: 120000000 },
		{ user: 'User2', amount: 115000000 },
		{ user: 'User3', amount: 110000000 },
		{ user: 'User4', amount: 105000000 },
		{ user: 'User5', amount: 100000000 }
	];

	const ongoingAuctions = [
		{
			title: 'Portrait of Abraham Belters',
			endDate: '경매 시작: 2025.11.18 18:00',
			startPrice: '$70,000,000',
			image: '/src/lib/images/picture.png'
		},
		{
			title: 'Ferrari 250 GTO',
			endDate: '경매 시작: 2025.11.18 18:00',
			startPrice: '$25,000,000',
			image: '/src/lib/images/250gto.png'
		},
		{
			title: 'Moissanite',
			endDate: '경매 시작: 2025.11.20 18:00',
			startPrice: '$10,000,000',
			image: '/src/lib/images/diamond.png'
		},
		{
			title: 'Patek Philippe Grand Complica...',
			endDate: '경매 시작: 2025.11.25 12:00',
			startPrice: '$15,000,000',
			image: '/src/lib/images/clock.png'
		}
	];

	const myAuctions = [
		{
			title: 'Portrait of Abraham Belters',
			myBid: '$70,000,000',
			highestBid: '-',
			status: '입찰 중 (최고가)',
			date: '2025-11-15',
			image: '🖼️'
		},
		{
			title: 'Ferrari 250 GTO',
			myBid: '$19,000,000',
			highestBid: '-',
			status: '입찰 중',
			date: '2025-11-15',
			image: '/src/lib/images/250gto.png'
		}
	];

	let activeTab = '진행 중';
	let selectedAuction = ongoingAuctions[1];

	function addToBid(amount) {
		const current = parseInt(bidAmount.replace(/[^0-9]/g, '')) || 0;
		bidAmount = (current + amount).toLocaleString();
	}

	function formatTime(num) {
		return String(num).padStart(2, '0');
	}

	function selectAuction(auction) {
		selectedAuction = auction;
		bidAmount = '';
	}
</script>

<div class="container">
	<div class="content">
		<h1 class="main-title">라이브 경매</h1>

		<!-- Live Auction Section -->
		<div class="grid-2">
			<!-- Car Image -->
			<div class="car-frame-outer">
				<div class="car-frame">
					<img src={selectedAuction.image} alt={selectedAuction.title} class="car-image" />
				</div>
			</div>

			<!-- Auction Details -->
			<div class="auction-details">
				<div class="auction-title">
					<h2>{selectedAuction.title}</h2>
				</div>

				<!-- Countdown Timer -->
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
						<p class="info-value price-yellow">$ 120,000,000</p>
					</div>
					<div class="info-box">
						<p class="info-label">총 입찰 횟수</p>
						<p class="info-value">15 Bids</p>
					</div>
				</div>

				<!-- Bid Input and Recent Bids -->
				<div class="bid-section">
					<div class="bid-card">
						<input
								type="text"
								placeholder="입찰 희망 금액"
								class="bid-input"
								bind:value={bidAmount}
						/>
						<div class="bid-btn" on:click={() => addToBid(5000000)} role="button" tabindex="0">
							+ 5,000,000
						</div>
						<div class="bid-btn" on:click={() => addToBid(1000000)} role="button" tabindex="0">
							+ 1,000,000
						</div>
						<div class="submit-btn" role="button" tabindex="0">입찰하기</div>
					</div>

					<!-- Recent Bids -->
					<div class="bids-list">
						<h3 class="bids-title">최근 입찰자 목록</h3>
						<div>
							{#each currentBids as bid, index}
								<div class="bid-item">
									<div class="bid-user">
										{#if index === 0}
											<div class="crown-wrapper">
												<img src="/src/lib/images/crown.svg" alt="crown" class="crown-icon" />
											</div>
										{/if}
										<img src="/src/lib/images/auction_profile.svg" alt="profile" class="profile-icon" />
										<span>{bid.user}</span>
									</div>
									<span class="bid-amount">${bid.amount.toLocaleString()}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Ongoing Auctions -->
		<div>
			<h2 class="section-title">현재 진행 중인 경매</h2>
			<div class="auctions-grid">
				{#each ongoingAuctions as auction}
					<div class="auction-card" on:click={() => selectAuction(auction)} role="button" tabindex="0">
						<div class="auction-image">
							{#if auction.image.startsWith('/')}
								<img src={auction.image} alt={auction.title} />
							{:else}
								{auction.image}
							{/if}
						</div>
						<div class="auction-info">
							<h3>{auction.title}</h3>
							<p class="auction-date">{auction.endDate}</p>
							<p class="auction-price">경매 시작가: {auction.startPrice}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- My Auctions -->
		<div>
			<h2 class="section-title">나의 경매 기록</h2>

			<!-- Tabs -->
			<div class="tabs">
				<button class="tab active" on:click={() => activeTab = '진행 중'}>
					진행 중
				</button>
				<button class="tab" on:click={() => activeTab = '낙찰'}>
					낙찰
				</button>
				<button class="tab" on:click={() => activeTab = '유찰'}>
					유찰
				</button>
			</div>

			<!-- Table Header -->
			<div class="table-header">
				<div>경매품</div>
				<div>나의 입찰가</div>
				<div>최종 낙찰가</div>
				<div>상태</div>
				<div>경매 종료일</div>
			</div>

			<!-- Table Rows -->
			{#each myAuctions as auction}
				<div class="table-row">
					<div class="item-cell">
						<div class="item-icon">
							{#if auction.image.startsWith('/')}
								<img src={auction.image} alt={auction.title} />
							{:else}
								{auction.image}
							{/if}
						</div>
						<span>{auction.title}</span>
					</div>
					<div>{auction.myBid}</div>
					<div>{auction.highestBid}</div>
					<div>
            <span class="status-badge {auction.status.includes('최고가') ? 'status-highest' : 'status-bidding'}">
              {auction.status}
            </span>
					</div>
					<div>{auction.date}</div>
				</div>
			{/each}
		</div>
	</div>
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
		align-items: center;
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
</style>