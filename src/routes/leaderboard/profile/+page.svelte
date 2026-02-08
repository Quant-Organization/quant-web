<script lang="ts">
  // ------------------------------------------
  // 1. 데이터 타입 정의 (TypeScript)
  // ------------------------------------------
  interface Stat {
    title: string;
    value: string;
    trendValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    iconType?: 'arrow' | 'fire';
  }

  interface LuxuryItem {
    id: number;
    name: string;
    price: string;
    imageUrl: string;
  }

  interface Company {
    id: number;
    name: string;
    productName: string;
    location: string;
    dailyProfit: string;
    margin: string;
    imageUrl: string;
  }

  interface Activity {
    id: number;
    action: string;
    time: string;
  }

  // ------------------------------------------
  // 2. 목업 데이터 (Mock Data)
  // ------------------------------------------
  const mainStats = {
    cash: "$10,000,000,000",
    assets: "$900,000,000,000"
  };

  const subStats: Stat[] = [
    { title: "실시간 수익 현황", value: "$1.85B", trendValue: "+2.1%", trend: 'up', iconType: 'arrow' },
    { title: "총 투자 수익률 (ROI)", value: "+25.1%", trend: 'up', iconType: 'arrow' },
    { title: "연속 랠리 일수", value: "7일", iconType: 'fire' }
  ];

  const luxuryItems: LuxuryItem[] = [
    { id: 1, name: "Gulfstream G700", price: "$1.0B", imageUrl: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=600" },
    { id: 2, name: "Azzam", price: "$1.0B", imageUrl: "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&q=80&w=600" },
    { id: 3, name: "Porsche 911", price: "$1.0B", imageUrl: "https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&q=80&w=600" }
  ];

  const companies: Company[] = [
    { id: 1, name: "반도체 기업", productName: "메모리 반도체", location: "South Korea", dailyProfit: "160K", margin: "32.6%", imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600" },
    { id: 2, name: "반도체 기업", productName: "메모리 반도체", location: "South Korea", dailyProfit: "160K", margin: "32.6%", imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600" }
  ];

  const activities: Activity[] = [
    { id: 1, action: "삼성전자 주식 매도", time: "22 hours ago" },
    { id: 2, action: "삼성전자 주식 매도", time: "22 hours ago" },
    { id: 3, action: "삼성전자 주식 매도", time: "22 hours ago" }
  ];

  const chartData = [
    { label: '가치주', color: '#EF4444', percent: '10%' },
    { label: '가치주', color: '#60A5FA', percent: '10%' },
    { label: '가치주', color: '#2563EB', percent: '10%' },
    { label: '가치주', color: '#3B82F6', percent: '10%' },
  ];
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

  <section class="card profile-card">
    <div class="avatar-wrapper">
      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" />
    </div>
    <div class="profile-info">
      <div class="name-row">
        <h1>Allwayshapppy</h1>
        <span class="badge">무법자</span>
      </div>
      <p class="level-info">레벨 42 · Grand Master</p>
    </div>
  </section>

  <section class="grid-2">
    <div class="card big-stat">
      <span class="label">보유 현금</span>
      <h2 class="value">{mainStats.cash}</h2>
    </div>
    <div class="card big-stat">
      <span class="label">총 자산</span>
      <h2 class="value">{mainStats.assets}</h2>
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
      <h3>럭셔리 컬렉션</h3>
      <button class="more-btn">자세히 보기 ›</button>
    </div>
    <div class="grid-3">
      {#each luxuryItems as item}
        <div class="luxury-card">
          <img src={item.imageUrl} alt={item.name} />
          <div class="overlay">
            <p class="item-name">{item.name}</p>
            <p class="item-price">{item.price}</p>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section class="section-container">
    <div class="section-header">
      <h3>내 기업</h3>
      <button class="more-btn">모두보기 ›</button>
    </div>
    <div class="grid-2">
      {#each companies as company}
        <div class="card company-card">
          <div class="img-area">
            <img src={company.imageUrl} alt={company.name} />
          </div>
          <div class="content-area">
            <div class="company-header">
              <div>
                <h4>{company.name}</h4>
                <p class="sub-text">⚙️ 메인 제품 : {company.productName}</p>
              </div>
              <span class="location-tag">🇰🇷 {company.location}</span>
            </div>

            <div class="stats-row">
              <div class="stat-col">
                <span class="tiny-label">수익/일</span>
                <span class="stat-val">{company.dailyProfit}</span>
              </div>
              <div class="stat-col right">
                <span class="tiny-label">마진율</span>
                <span class="stat-val">{company.margin}</span>
              </div>
            </div>

            <button class="action-btn">기업 관리</button>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section class="grid-2 bottom-section">
    <div class="card chart-card">
      <h3>실시간 수익 현황</h3>
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

  .more-btn {
    background: none;
    border: none;
    color: var(--color-text-gray);
    font-size: 0.875rem;
    cursor: pointer;
    font-weight: 500;
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
  }

  .icon-circle.arrow { background-color: #dcfce7; color: #22c55e; }
  .icon-circle.fire { background-color: #ffedd5; color: #f97316; }

  .icon-circle svg { width: 20px; height: 20px; }

  .luxury-card {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    aspect-ratio: 16/9;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  }

  .luxury-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }

  .luxury-card:hover img {
    transform: scale(1.05);
  }

  .luxury-card .overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 16px;
    background: linear-gradient(transparent, rgba(0,0,0,0.8));
    color: white;
    box-sizing: border-box;
  }

  .item-name {
    font-weight: 700;
    font-size: 18px;
    margin: 0 0 4px 0;
  }

  .item-price {
    font-size: 14px;
    opacity: 0.9;
    margin: 0;
  }

  .company-card {
    padding: 0;
    overflow: hidden;
  }

  .img-area {
    height: 160px;
    position: relative;
  }

  .img-area img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .content-area {
    padding: 20px;
  }

  .company-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .company-header h4 {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 700;
  }

  .sub-text {
    font-size: 13px;
    color: var(--color-text-gray);
    margin: 0;
  }

  .location-tag {
    background: var(--color-bg-2);
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 6px;
    font-weight: 600;
    color: var(--color-text-gray);
  }

  .stats-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .stat-col {
    display: flex;
    flex-direction: column;
  }
  .stat-col.right { align-items: flex-end; }

  .tiny-label { font-size: 12px; color: var(--color-text-gray); margin-bottom: 2px;}
  .stat-val { font-weight: 700; font-size: 15px; }

  .action-btn {
    width: 100%;
    padding: 12px;
    background-color: var(--color-bg-2);
    border: none;
    border-radius: 8px;
    font-weight: 600;
    color: var(--color-text-gray);
    cursor: pointer;
    transition: background 0.2s;
  }
  .action-btn:hover { background-color: var(--color-border); }

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

  .dot { width: 10px; height: 10px; border-radius: 2px; }
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

    .chart-content {
      flex-direction: column;
    }

    .profile-card {
      flex-direction: column;
      text-align: center;
    }
  }
</style>
