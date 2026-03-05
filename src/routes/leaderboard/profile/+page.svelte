<script lang="ts">
  import { onMount } from 'svelte';
  import { getProfileStats, type ProfileStats } from '$lib/api/dashboard';
  import { auth } from '$lib/stores/auth';

  // --- State ---
  let profile = $state<ProfileStats | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let currentUser = $state(auth.user);

  function formatCurrency(n: number): string {
    if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(2) + 'B';
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
    return '$' + n.toFixed(0);
  }

  function getAvatarUrl(username: string): string {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
  }

  // Derived sub-stats
  let subStats = $derived(profile ? [
    {
      title: '비즈니스 수익',
      value: formatCurrency(profile.businessIncome),
      trendValue: '',
      trend: 'up' as const,
      iconType: 'arrow' as const
    },
    {
      title: '배당 수익',
      value: formatCurrency(profile.dividendIncome),
      trendValue: '',
      trend: 'up' as const,
      iconType: 'arrow' as const
    },
    {
      title: '보유 자산 수',
      value: String(
        profile.vehicleCount + profile.jetCount + profile.yachtCount +
        profile.realEstateCount + profile.luxuryCount
      ) + '개',
      trendValue: '',
      iconType: 'fire' as const
    }
  ] : []);

  // Companies placeholder — profile has company count but not list
  let assetCounts = $derived(profile ? [
    { label: '기업', count: profile.companyCount },
    { label: '공장', count: profile.factoryCount },
    { label: '부동산', count: profile.realEstateCount },
    { label: '차량', count: profile.vehicleCount },
    { label: '전용기', count: profile.jetCount },
    { label: '요트', count: profile.yachtCount },
    { label: '럭셔리', count: profile.luxuryCount },
  ] : []);

  const chartData = [
    { label: '비즈니스', color: '#EF4444', percent: '10%' },
    { label: '주식', color: '#60A5FA', percent: '10%' },
    { label: '부동산', color: '#2563EB', percent: '10%' },
    { label: '암호화폐', color: '#3B82F6', percent: '10%' },
  ];

  const activities = [
    { id: 1, action: '삼성전자 주식 매도', time: '22 hours ago' },
    { id: 2, action: '포트폴리오 리밸런싱', time: '1 day ago' },
    { id: 3, action: '부동산 임대 수익 발생', time: '2 days ago' }
  ];

  onMount(async () => {
    try {
      profile = await getProfileStats();
    } catch (e) {
      error = '프로필 데이터를 불러오지 못했습니다.';
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>내 프로필</title>
</svelte:head>

<div class="page-container">
  <header class="page-header">
    <div class="header-text">
      <h1>내 프로필</h1>
      <p>나의 자산 현황과 투자 성과를 확인하세요.</p>
    </div>
  </header>

  {#if loading}
    <div class="loading-state">데이터를 불러오는 중...</div>
  {:else if error}
    <div class="error-state">{error}</div>
  {:else if profile}
    <section class="card profile-card">
      <div class="avatar-wrapper">
        <img src={getAvatarUrl($currentUser?.username ?? 'user')} alt="Profile" />
      </div>
      <div class="profile-info">
        <div class="name-row">
          <h1>{$currentUser?.playerName ?? $currentUser?.username ?? '플레이어'}</h1>
          {#if profile.title}
            <span class="badge">{profile.title}</span>
          {/if}
        </div>
        <p class="level-info">
          레벨 {$currentUser?.level ?? '-'} · {profile.title ?? '-'}
          {#if profile.investmentStyle}
            · {profile.investmentStyle}
          {/if}
        </p>
      </div>
    </section>

    <section class="grid-2">
      <div class="card big-stat">
        <span class="label">보유 현금</span>
        <h2 class="value">{formatCurrency(profile.currentBalance)}</h2>
      </div>
      <div class="card big-stat">
        <span class="label">총 자산</span>
        <h2 class="value">{formatCurrency(profile.totalAssetValue)}</h2>
      </div>
    </section>

    <section class="grid-3">
      {#each subStats as stat}
        <div class="card sub-stat">
          <div class="stat-content">
            <span class="label">{stat.title}</span>
            <div class="value-row">
              <span class="value-md">{stat.value}</span>
              {#if stat.trendValue}
                <span class="trend up">{stat.trendValue}</span>
              {/if}
            </div>
          </div>
          <div class="icon-circle {stat.iconType}">
            {#if stat.iconType === 'fire'}
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15c-.75 0-1.41-.42-1.75-1.03-.68-1.24-.26-2.61.05-3.37.28-.68.65-1.46.65-2.07 0-.58-.33-1.09-.82-1.34.82-1.72 3.16-1.55 3.56.09.43 1.76-1.09 3.06-1.2 4.19-.08.82.35 1.53 1.15 1.84.34.13.56.46.56.82 0 .55-.45 1-1 1h-1.2z"/></svg>
            {:else}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            {/if}
          </div>
        </div>
      {/each}
    </section>

    <section class="section-container">
      <div class="section-header">
        <h3>자산 현황</h3>
      </div>
      <div class="asset-counts-grid">
        {#each assetCounts as asset}
          <div class="card asset-count-card">
            <span class="asset-label">{asset.label}</span>
            <span class="asset-count">{asset.count}개</span>
          </div>
        {/each}
      </div>
    </section>

    <section class="section-container">
      <div class="section-header">
        <h3>수익 분석</h3>
      </div>
      <div class="grid-2 income-grid">
        <div class="card income-card">
          <div class="income-row">
            <span class="income-label">클릭 수익</span>
            <span class="income-val">{formatCurrency(profile.clickIncome)}</span>
          </div>
          <div class="income-row">
            <span class="income-label">비즈니스 수익</span>
            <span class="income-val">{formatCurrency(profile.businessIncome)}</span>
          </div>
          <div class="income-row">
            <span class="income-label">임대 수익</span>
            <span class="income-val">{formatCurrency(profile.rentalIncome)}</span>
          </div>
          <div class="income-row">
            <span class="income-label">배당 수익</span>
            <span class="income-val">{formatCurrency(profile.dividendIncome)}</span>
          </div>
          <div class="income-row">
            <span class="income-label">주식 거래 수익</span>
            <span class="income-val">{formatCurrency(profile.stockTradingIncome)}</span>
          </div>
          <div class="income-row">
            <span class="income-label">암호화폐 거래 수익</span>
            <span class="income-val">{formatCurrency(profile.cryptoTradingIncome)}</span>
          </div>
        </div>

        <div class="card value-card">
          <div class="income-row">
            <span class="income-label">비즈니스 가치</span>
            <span class="income-val">{formatCurrency(profile.businessValue)}</span>
          </div>
          <div class="income-row">
            <span class="income-label">주식 가치</span>
            <span class="income-val">{formatCurrency(profile.stockValue)}</span>
          </div>
          <div class="income-row">
            <span class="income-label">부동산 가치</span>
            <span class="income-val">{formatCurrency(profile.realEstateValue)}</span>
          </div>
          <div class="income-row">
            <span class="income-label">운송 가치</span>
            <span class="income-val">{formatCurrency(profile.transportValue)}</span>
          </div>
          <div class="income-row">
            <span class="income-label">컬렉션 가치</span>
            <span class="income-val">{formatCurrency(profile.collectionValue)}</span>
          </div>
          <div class="income-row">
            <span class="income-label">암호화폐 가치</span>
            <span class="income-val">{formatCurrency(profile.cryptoValue)}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="grid-2 bottom-section">
      <div class="card chart-card">
        <h3>자산 구성</h3>
        <div class="chart-content">
          <div class="donut-chart"></div>
          <div class="legend">
            {#each chartData as data}
              <div class="legend-item">
                <span class="dot" style="background-color: {data.color}"></span>
                <span class="legend-label">{data.label}</span>
                <span class="legend-val">{data.percent}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <div class="card activity-card">
        <h3>내 최근 활동</h3>
        <ul class="activity-list">
          {#each activities as act}
            <li>
              <div class="act-left">
                <div class="icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                </div>
                <span class="act-name">{act.action}</span>
              </div>
              <span class="act-time">{act.time}</span>
            </li>
          {/each}
        </ul>
      </div>
    </section>
  {/if}
</div>

<style>
  .page-container {
    background-color: var(--color-bg-0);
    min-height: 100vh;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-md);
  }

  .header-text h1 {
    font-size: var(--page-title-size);
    font-weight: var(--page-title-weight);
    margin: 0 0 0.5rem 0;
  }

  .header-text p {
    font-size: var(--page-desc-size);
    color: var(--color-text-gray);
    margin: 0;
  }

  .loading-state,
  .error-state {
    text-align: center;
    padding: 60px 0;
    color: var(--color-text-gray);
    font-size: 15px;
  }
  .error-state { color: var(--color-negative); }

  .card {
    background: var(--color-bg-1);
    border-radius: var(--card-border-radius);
    padding: var(--card-padding);
    border: 1px solid var(--color-border);
    box-shadow: var(--card-shadow);
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .section-container {
    margin-bottom: var(--spacing-lg);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: var(--spacing-sm);
    padding: 0 4px;
  }

  .section-header h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
  }

  .profile-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  .avatar-wrapper {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: #e0f2fe;
    overflow: hidden;
    border: 4px solid var(--color-bg-1);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    flex-shrink: 0;
  }

  .avatar-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
  }

  .name-row h1 {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
  }

  .badge {
    background-color: #fee2e2;
    color: #ef4444;
    font-size: 12px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
  }

  .level-info {
    margin: 0;
    color: var(--color-text-gray);
    font-size: 14px;
  }

  .big-stat .label {
    display: block;
    color: var(--stat-label-color);
    font-size: var(--stat-label-size);
    margin-bottom: 0.5rem;
  }

  .big-stat .value {
    font-size: var(--stat-value-size);
    font-weight: var(--stat-value-weight);
    margin: 0;
    letter-spacing: -0.5px;
  }

  .sub-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sub-stat .label {
    font-size: var(--stat-label-size);
    color: var(--stat-label-color);
    display: block;
    margin-bottom: 0.25rem;
  }

  .value-row {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .value-md {
    font-size: 1.5rem;
    font-weight: var(--stat-value-weight);
  }

  .trend {
    font-size: var(--stat-change-size);
    font-weight: var(--stat-change-weight);
  }
  .trend.up { color: var(--stat-change-positive); }

  .icon-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .icon-circle.arrow { background-color: #dcfce7; color: #22c55e; }
  .icon-circle.fire { background-color: #ffedd5; color: #f97316; }

  .icon-circle svg { width: 20px; height: 20px; }

  /* Asset counts */
  .asset-counts-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 12px;
  }

  .asset-count-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 8px;
    gap: 8px;
  }

  .asset-label {
    font-size: 12px;
    color: var(--color-text-gray);
    font-weight: 500;
  }

  .asset-count {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text);
  }

  /* Income grid */
  .income-grid {
    margin-bottom: var(--spacing-lg);
  }

  .income-card, .value-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .income-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    padding: 4px 0;
    border-bottom: 1px solid var(--color-border);
  }
  .income-row:last-child { border-bottom: none; }

  .income-label { color: var(--color-text-gray); }
  .income-val { font-weight: 700; color: var(--color-text); }

  .bottom-section { margin-bottom: 0; }
  .bottom-section h3 { margin-top: 0; margin-bottom: 24px; font-size: 18px; }

  .chart-content {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 32px;
  }

  .donut-chart {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: conic-gradient(
      #EF4444 0% 25%,
      #3B82F6 25% 50%,
      #2563EB 50% 75%,
      #60A5FA 75% 100%
    );
    position: relative;
    flex-shrink: 0;
  }

  .donut-chart::after {
    content: "";
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    background: var(--color-bg-1);
    border-radius: 50%;
  }

  .legend {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    font-size: 14px;
    gap: 8px;
    min-width: 120px;
  }

  .dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
  .legend-label { font-weight: 600; color: var(--color-text-gray); flex: 1; }
  .legend-val { font-weight: 700; }

  .activity-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .activity-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    cursor: pointer;
  }
  .activity-list li:hover { background-color: var(--color-bg-2); }

  .act-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .icon-box {
    width: 32px;
    height: 32px;
    background-color: #dcfce7;
    color: #22c55e;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .icon-box svg { width: 16px; height: 16px; }

  .act-name { font-weight: 700; font-size: 14px; }
  .act-time { font-size: 13px; color: var(--color-text-gray); }

  @media (max-width: 768px) {
    .grid-2, .grid-3 {
      grid-template-columns: 1fr;
    }

    .asset-counts-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    .chart-content {
      flex-direction: column;
    }

    .profile-card {
      flex-direction: column;
      text-align: center;
    }
  }
</style>
