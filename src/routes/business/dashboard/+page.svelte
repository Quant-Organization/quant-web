<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { getMyCompanies, type CompanyResponse } from '$lib/api/company';
  import { getRegions, type Region } from '$lib/api/region';
  import SkeletonTable from '$lib/components/SkeletonTable.svelte';
  import chipIcon from '$lib/images/chip.svg';

  // --- State ---
  let companies = $state<CompanyResponse[]>([]);
  let regions = $state<Region[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let searchText = $state('');

  // --- Derived summary stats ---
  let avgMarginRate = $derived(() => {
    if (!companies.length) return '0%';
    const validCompanies = companies.filter(c => c.totalRevenue > 0);
    if (!validCompanies.length) return '0%';
    const avgRate = validCompanies.reduce((s, c) => s + ((c.netIncome ?? 0) / c.totalRevenue) * 100, 0) / validCompanies.length;
    return avgRate.toFixed(1) + '%';
  });

  let summaryStats = $derived([
    { label: '총 기업 수', value: String(companies.length), unit: '개' },
    {
      label: '총 월 수익',
      value: formatShort(companies.reduce((s, c) => s + c.monthlyRevenue, 0)),
      unit: ''
    },
    {
      label: '평균 이익률',
      value: avgMarginRate(),
      unit: ''
    },
    {
      label: '총 직원 수',
      value: companies.reduce((s, c) => s + c.totalEmployees, 0).toLocaleString(),
      unit: '명'
    }
  ]);

  let filteredCompanies = $derived(
    companies.filter((c) => c.name.toLowerCase().includes(searchText.toLowerCase()))
  );

  function formatShort(n: number): string {
    n = n ?? 0;
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n);
  }

  function formatMargin(company: CompanyResponse): string {
    if (!company.totalRevenue) return '0%';
    return (((company.netIncome ?? 0) / company.totalRevenue) * 100).toFixed(1) + '%';
  }

  onMount(async () => {
    try {
      const [companiesRes, regionsRes] = await Promise.all([
        getMyCompanies(),
        getRegions()
      ]);
      companies = companiesRes.companies;
      regions = regionsRes;
    } catch (e) {
      error = '데이터를 불러오지 못했습니다.';
    } finally {
      loading = false;
    }
  });

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
    <button class="btn-outline" onclick={() => goto('/business/create')}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      신규 기업 설립
    </button>
  </header>

  {#if loading}
    <SkeletonTable rows={5} cols={4} showStats={true} />
  {:else if error}
    <div class="error-state">{error}</div>
  {:else}
    <div class="stats-grid">
      {#each summaryStats as stat}
        <div class="card stat-card">
          <div class="stat-label">{stat.label}</div>
          <div class="stat-value">
            {stat.value}<span class="stat-unit">{stat.unit}</span>
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
        <input type="text" placeholder="기업 이름 검색" bind:value={searchText} />
      </div>

      <div class="dropdown-group">
        <div class="dropdown">이름순으로 정렬 <span class="arrow">▼</span></div>
        <div class="dropdown">수익순으로 정렬 <span class="arrow">▼</span></div>
        <div class="dropdown">지역순으로 정렬 <span class="arrow">▼</span></div>
      </div>
    </div>

    {#if filteredCompanies.length === 0}
      <div class="empty-state">기업이 없습니다. 신규 기업을 설립해보세요.</div>
    {:else}
      <div class="business-grid">
        {#each filteredCompanies as biz}
          <div class="card business-card" onclick={() => goToCompany(biz.id)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && goToCompany(biz.id)}>
            <div class="card-image"></div>

            <div class="card-content">
              <div class="biz-header">
                <h3>{biz.name}</h3>
              </div>

              <div class="biz-info-row">
                <div class="info-item">
                  <img src={chipIcon} alt="메인 제품" class="icon-chip-img" /> <span>메인 제품 : {biz.mainProduct}</span>
                </div>
                <div class="country-info">
                  <span>📍 {biz.headquartersRegionName}</span>
                </div>
              </div>

              <div class="biz-stats-row">
                <div class="stat-item">
                  <span class="label">월 수익</span>
                  <span class="value">{formatShort(biz.monthlyRevenue)}</span>
                </div>
                <div class="stat-item">
                  <span class="label">직원 수</span>
                  <span class="value">{(biz.totalEmployees ?? 0).toLocaleString()}명</span>
                </div>
                <div class="stat-item">
                  <span class="label">마진율</span>
                  <span class="value">{formatMargin(biz)}</span>
                </div>
              </div>
            </div>

            <div class="card-actions">
              <button onclick={(e) => { e.stopPropagation(); goToCompany(biz.id); }}>기업 관리</button>
              <div class="divider"></div>
              <button onclick={(e) => e.stopPropagation()}>제품</button>
              <div class="divider"></div>
              <button onclick={(e) => e.stopPropagation()}>연구</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
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

  .loading-state,
  .error-state,
  .empty-state {
    text-align: center;
    padding: 60px 0;
    color: var(--color-text-gray);
    font-size: 15px;
  }
  .error-state { color: var(--color-negative); }

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

  .icon-chip-img {
    width: 1.1rem;
    height: 1.1rem;
    vertical-align: middle;
  }

  .country-info {
    font-weight: 600;
    color: var(--color-text);
  }

  .biz-stats-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 8px;
  }

  .stat-item .label {
    font-size: 13px;
    color: var(--color-text-gray);
    margin-right: 4px;
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
