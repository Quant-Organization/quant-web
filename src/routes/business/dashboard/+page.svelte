<script lang="ts">
  import { goto } from '$app/navigation';

  // --- Data & Types ---

  interface SummaryStat {
    label: string;
    value: string;
    unit?: string;
  }

  interface Business {
    id: number;
    name: string;
    product: string;
    country: string;
    flag: string;
    dailyRevenue: string;
    margin: string;
    imageUrl: string;
  }

  // 상단 요약 데이터
  const summaryStats: SummaryStat[] = [
    { label: "총 기업 수", value: "5", unit: "개" },
    { label: "총 일일 수익", value: "14.5M" },
    { label: "평균 이익률", value: "14.5%" },
    { label: "총 직원 수", value: "8,540" }
  ];

  // 하단 기업 리스트 목업 데이터
  const businesses: Business[] = [
    {
      id: 1,
      name: "금성전자",
      product: "메모리 반도체",
      country: "South Korea",
      flag: "🇰🇷",
      dailyRevenue: "160K",
      margin: "32.6%",
      imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: 2,
      name: "반도체 기업",
      product: "메모리 반도체",
      country: "South Korea",
      flag: "🇰🇷",
      dailyRevenue: "160K",
      margin: "32.6%",
      imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600"
    }
  ];

  let searchText = "";

  function goToCompany(id: number) {
    goto(`/business/company/${id}`);
  }
</script>

<svelte:head>
  <title>비즈니스 대시보드</title>
</svelte:head>

<div class="page-container">

  <header class="page-header">
    <div class="header-text">
      <h1>비즈니스 대시보드</h1>
      <p>기업을 관리하고 새로운 사업 기회를 발굴하세요.</p>
    </div>
    <button class="btn-outline">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      신규 기업 설립
    </button>
  </header>

  <div class="stats-grid">
    {#each summaryStats as stat}
      <div class="card stat-card">
        <div class="stat-label">{stat.label}</div>
        <div class="stat-value">
          {stat.value}<span class="stat-unit">{stat.unit || ''}</span>
        </div>
      </div>
    {/each}
  </div>

  <div class="filter-bar">
    <div class="search-input-wrapper">
      <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input type="text" placeholder="공장 이름 검색" bind:value={searchText} />
    </div>

    <div class="dropdown-group">
      <div class="dropdown">이름순으로 정렬 <span class="arrow">▼</span></div>
      <div class="dropdown">수익순으로 정렬 <span class="arrow">▼</span></div>
      <div class="dropdown">지역순으로 정렬 <span class="arrow">▼</span></div>
    </div>
  </div>

  <div class="business-grid">
    {#each businesses as biz}
      <div class="card business-card" onclick={() => goToCompany(biz.id)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && goToCompany(biz.id)}>
        <div class="card-image" style="background-image: url('{biz.imageUrl}');"></div>

        <div class="card-content">
          <div class="biz-header">
            <h3>{biz.name}</h3>
          </div>

          <div class="biz-info-row">
            <div class="info-item">
              <span class="icon-chip">⚙️</span> <span>메인 제품 : {biz.product}</span>
            </div>
            <div class="country-info">
              <span>{biz.flag} {biz.country}</span>
            </div>
          </div>

          <div class="biz-stats-row">
            <div class="stat-item">
              <span class="label">수익/일</span>
              <span class="value">{biz.dailyRevenue}</span>
            </div>
            <div class="stat-item">
              <span class="label">마진율</span>
              <span class="value">{biz.margin}</span>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button onclick={(e) => e.stopPropagation()}>기업 관리</button>
          <div class="divider"></div>
          <button onclick={(e) => e.stopPropagation()}>제품</button>
          <div class="divider"></div>
          <button onclick={(e) => e.stopPropagation()}>연구</button>
        </div>
      </div>
    {/each}
  </div>

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
    border: 1px solid var(--color-border);
    border-radius: var(--card-border-radius);
    box-shadow: var(--card-shadow);
  }

  .btn-outline {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--color-bg-1);
    border: 1px solid var(--color-theme-1);
    color: var(--color-theme-1);
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .btn-outline:hover {
    background: var(--color-bg-2);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }

  .stat-card {
    padding: var(--card-padding);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .stat-label {
    color: var(--stat-label-color);
    font-size: var(--stat-label-size);
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: var(--stat-value-size);
    font-weight: var(--stat-value-weight);
    color: var(--color-text);
  }
  .stat-unit {
    font-size: 1.125rem;
    margin-left: 2px;
  }

  .filter-bar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24px;
    gap: 16px;
  }

  .search-input-wrapper {
    flex: 1;
    position: relative;
    max-width: 400px;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
  }

  .search-input-wrapper input {
    width: 100%;
    padding: 12px 12px 12px 40px;
    border: none;
    background-color: var(--color-bg-2);
    border-radius: 6px;
    font-size: 14px;
    outline: none;
    color: var(--color-text);
  }

  .dropdown-group {
    display: flex;
    gap: 12px;
  }

  .dropdown {
    background-color: var(--color-bg-2);
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .arrow {
    font-size: 10px;
    color: var(--color-text-gray);
  }

  .business-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }

  .business-card {
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .business-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .card-image {
    width: 100%;
    height: 160px;
    background-size: cover;
    background-position: center;
    background-color: var(--color-bg-2);
  }

  .card-content {
    padding: 20px 24px 16px 24px;
  }

  .biz-header h3 {
    margin: 0 0 12px 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text);
  }

  .biz-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    font-size: 14px;
    color: var(--color-text-gray);
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .icon-chip {
    color: var(--color-theme-1);
  }

  .country-info {
    font-weight: 600;
    color: var(--color-text);
  }

  .biz-stats-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .stat-item .label {
    font-size: 13px;
    color: var(--color-text-gray);
    margin-right: 8px;
  }

  .stat-item .value {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text);
  }

  .card-actions {
    display: flex;
    margin: 0 24px 24px 24px;
    border-radius: 12px;
    background-color: var(--color-bg-2);
    overflow: hidden;
  }

  .card-actions button {
    flex: 1;
    border: none;
    background: transparent;
    padding: 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
    cursor: pointer;
    transition: background 0.2s;
  }

  .card-actions button:hover {
    background-color: var(--color-bg-1);
    font-weight: 600;
  }

  .card-actions button:first-child {
    border-radius: 12px 0 0 12px;
  }

  .card-actions button:last-child {
    border-radius: 0 12px 12px 0;
  }

  .divider {
    width: 1px;
    background-color: #000000;
    margin: 12px 0;
  }

  @media (max-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
    .business-grid {
      grid-template-columns: 1fr;
    }
    .filter-bar {
      flex-direction: column;
    }
    .search-input-wrapper {
      max-width: 100%;
    }
    .dropdown-group {
      justify-content: space-between;
    }
  }
</style>
