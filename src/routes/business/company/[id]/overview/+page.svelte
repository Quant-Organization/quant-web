<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { onMount } from 'svelte';
  import { getCompanyDetail, updateCompany, deleteCompany, getCompanyStats, type CompanyResponse } from '$lib/api/company';
  import { getCompanyFactories, type FactoryResponse } from '$lib/api/factory';
  import { getMarketEvents, type MarketEvent } from '$lib/api/macro';
  import SkeletonTable from '$lib/components/SkeletonTable.svelte';

  // --- State ---
  let company = $state<CompanyResponse | null>(null);
  let factories = $state<FactoryResponse[]>([]);
  let companyStats = $state<Record<string, unknown> | null>(null);
  let newsList = $state<MarketEvent[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Edit modal state
  let showEditModal = $state(false);
  let editName = $state('');
  let editCeo = $state('');
  let editProduct = $state('');
  let editSaving = $state(false);
  let editError = $state('');

  // Delete confirmation
  let showDeleteConfirm = $state(false);
  let deleting = $state(false);

  const companyId = $derived(Number($page.params.id));

  function formatShort(n: number): string {
    n = n ?? 0;
    if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
    return '$' + String(n);
  }

  function formatEmployees(n: number): string {
    return (n ?? 0).toLocaleString() + '명';
  }

  function formatMargin(company: CompanyResponse): string {
    if (!company.totalRevenue) return '0%';
    return (((company.netIncome ?? 0) / company.totalRevenue) * 100).toFixed(1) + '%';
  }

  // Derive stats from API data
  let stats = $derived(company ? [
    {
      label: '총 자산 (총 수익)',
      value: formatShort(company.totalRevenue),
      change: '',
      isPositive: true
    },
    {
      label: '월 수익',
      value: formatShort(company.monthlyRevenue),
      change: '',
      isPositive: true
    },
    {
      label: '순이익',
      value: formatShort(company.netIncome),
      change: formatMargin(company),
      isPositive: company.netIncome >= 0
    },
    {
      label: '고용 직원 수',
      value: formatEmployees(company.totalEmployees),
      change: '',
      isPositive: true
    }
  ] : []);

  onMount(async () => {
    try {
      const [companyRes, factoriesRes, statsRes, eventsRes] = await Promise.all([
        getCompanyDetail(companyId),
        getCompanyFactories(companyId),
        getCompanyStats().catch(() => null),
        getMarketEvents(true, 5).catch(() => [])
      ]);
      company = companyRes;
      factories = factoriesRes;
      companyStats = statsRes;
      newsList = eventsRes;
    } catch (e) {
      error = '데이터를 불러오지 못했습니다.';
      toast.error('데이터를 불러오지 못했습니다.');
    } finally {
      loading = false;
    }
  });

  function openEditModal() {
    if (!company) return;
    editName = company.name;
    editCeo = company.ceoName;
    editProduct = company.mainProduct;
    editError = '';
    showEditModal = true;
  }

  async function handleSaveEdit() {
    if (!company) return;
    editSaving = true;
    editError = '';
    try {
      const data: { name?: string; ceoName?: string; mainProduct?: string } = {};
      if (editName !== company.name) data.name = editName;
      if (editCeo !== company.ceoName) data.ceoName = editCeo;
      if (editProduct !== company.mainProduct) data.mainProduct = editProduct;
      if (Object.keys(data).length === 0) {
        showEditModal = false;
        editSaving = false;
        return;
      }
      await updateCompany(companyId, data);
      company = await getCompanyDetail(companyId);
      showEditModal = false;
      toast.success('기업 정보가 수정되었습니다.');
    } catch (e: unknown) {
      editError = e instanceof Error ? e.message : '수정에 실패했습니다.';
    } finally {
      editSaving = false;
    }
  }

  async function handleDelete() {
    deleting = true;
    try {
      await deleteCompany(companyId);
      toast.success('기업이 청산되었습니다.');
      setTimeout(() => { goto('/business/dashboard'); }, 1000);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '청산에 실패했습니다.');
      showDeleteConfirm = false;
    } finally {
      deleting = false;
    }
  }
</script>

<svelte:head>
  <title>{company?.name ?? '기업'} - 기업 현황</title>
</svelte:head>

<div class="page-container">

  {#if loading}
    <SkeletonTable rows={5} cols={3} showStats={true} />
  {:else if error}
    <div class="error-state">{error}</div>
  {:else if company}
    <header class="page-header">
      <div>
        <h1>{company.name} 대시보드</h1>
        <p>기업의 핵심 성과와 거시 경제 지표를 종합적으로 분석하세요.</p>
      </div>
      <div class="header-actions">
        <button class="btn-edit" onclick={openEditModal}>정보 수정</button>
        <button class="btn-delete" onclick={() => showDeleteConfirm = true}>기업 청산</button>
      </div>
    </header>

    <div class="stats-grid">
      {#each stats as stat}
        <div class="card stat-card">
          <div class="stat-label">{stat.label}</div>
          <div class="stat-row">
            <span class="stat-value">{stat.value}</span>
            {#if stat.change}
              <span class="stat-change {stat.isPositive ? 'text-green' : 'text-red'}">
                {stat.change}
              </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <div class="content-grid">

      <div class="card chart-card">
        <div class="chart-header">
          <h3>수익 현황</h3>
        </div>

        <div class="chart-container">
          {#if company.totalRevenue > 0 || company.netIncome > 0}
            {@const maxVal = Math.max(company.totalRevenue, company.netIncome, 1)}
            <svg viewBox="0 0 600 200" class="bar-chart">
              <line x1="0" y1="170" x2="560" y2="170" stroke="var(--color-border)" />
              <!-- Revenue bar -->
              <rect x="120" y={170 - (company.totalRevenue / maxVal * 140)} width="80"
                    height={company.totalRevenue / maxVal * 140} fill="var(--color-theme-1)" rx="4" />
              <text x="160" y="190" font-size="12" fill="var(--color-text-gray)" text-anchor="middle">총 수익</text>
              <text x="160" y={160 - (company.totalRevenue / maxVal * 140)} font-size="11" fill="var(--color-theme-1)" text-anchor="middle" font-weight="600">{formatShort(company.totalRevenue)}</text>
              <!-- Net Income bar -->
              <rect x="360" y={170 - (Math.abs(company.netIncome) / maxVal * 140)} width="80"
                    height={Math.abs(company.netIncome) / maxVal * 140}
                    fill={company.netIncome >= 0 ? '#fbbf24' : '#ef4444'} rx="4" />
              <text x="400" y="190" font-size="12" fill="var(--color-text-gray)" text-anchor="middle">순이익</text>
              <text x="400" y={160 - (Math.abs(company.netIncome) / maxVal * 140)} font-size="11" fill={company.netIncome >= 0 ? '#fbbf24' : '#ef4444'} text-anchor="middle" font-weight="600">{formatShort(company.netIncome)}</text>
            </svg>
          {:else}
            <div class="empty-chart">아직 수익 데이터가 없습니다.</div>
          {/if}

          <div class="chart-legend">
            <div class="legend-item"><span class="dot blue"></span>총 수익</div>
            <div class="legend-item"><span class="dot yellow"></span>순이익</div>
          </div>
        </div>
      </div>

      <div class="card info-card">
        <div class="info-header">
          <h3>{company.name}</h3>
          <p class="desc">{company.companyType} · {company.mainProduct}</p>
        </div>

        <div class="info-list">
          <div class="info-row">
            <span class="label">👤 CEO</span>
            <span class="val">{company.ceoName}</span>
          </div>
          <div class="divider"></div>
          <div class="info-row">
            <span class="label">📅 설립일</span>
            <span class="val">{company.foundedDate ?? '-'}</span>
          </div>
          <div class="divider"></div>
          <div class="info-row">
            <span class="label">📍 본사</span>
            <span class="val">{company.headquartersRegionName}</span>
          </div>
          <div class="divider"></div>
          <div class="info-row">
            <span class="label">🏭 공장 수</span>
            <span class="val">{factories.length}개</span>
          </div>
          <div class="divider"></div>
          <div class="info-row">
            <span class="label">📊 시장 점유율</span>
            <span class="val">{((company.marketShare ?? 0) * 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>

    </div>

    <div class="news-section">
      <h3>시장 뉴스</h3>
      <div class="news-list">
        {#if newsList.length > 0}
          {#each newsList as news}
            <div class="news-item">
              <div class="news-meta">
                <span class="source">{news.event_type}</span>
                <span class="dot">•</span>
                <span class="time">{news.name}</span>
              </div>
              <div class="news-content">{news.description}</div>
            </div>
          {/each}
        {:else}
          <div class="empty-news">현재 진행 중인 시장 이벤트가 없습니다.</div>
        {/if}
      </div>
    </div>
  {/if}

</div>

{#if showEditModal}
  <div class="modal-backdrop" onclick={() => showEditModal = false} role="presentation">
    <div class="modal" onclick={(e) => e.stopPropagation()} role="dialog">
      <h2>기업 정보 수정</h2>
      <div class="modal-form">
        <label class="modal-label">
          기업명
          <input class="modal-input" type="text" bind:value={editName} />
        </label>
        <label class="modal-label">
          CEO 이름
          <input class="modal-input" type="text" bind:value={editCeo} />
        </label>
        <label class="modal-label">
          주요 상품
          <input class="modal-input" type="text" bind:value={editProduct} />
        </label>
        {#if editError}
          <div class="modal-error">{editError}</div>
        {/if}
        <div class="modal-actions">
          <button class="btn-cancel" onclick={() => showEditModal = false}>취소</button>
          <button class="btn-save" onclick={handleSaveEdit} disabled={editSaving}>
            {editSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if showDeleteConfirm}
  <div class="modal-backdrop" onclick={() => showDeleteConfirm = false} role="presentation">
    <div class="modal" onclick={(e) => e.stopPropagation()} role="dialog">
      <h2>기업 청산 확인</h2>
      <p class="delete-warning">정말로 <strong>{company?.name}</strong> 기업을 청산하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
      <div class="modal-actions">
        <button class="btn-cancel" onclick={() => showDeleteConfirm = false}>취소</button>
        <button class="btn-confirm-delete" onclick={handleDelete} disabled={deleting}>
          {deleting ? '청산 중...' : '청산하기'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  * { box-sizing: border-box; }

  .page-container {
    background-color: var(--color-bg-0);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: var(--color-text);
  }

  .loading-state,
  .error-state {
    text-align: center;
    padding: 60px 0;
    color: var(--color-text-gray);
    font-size: 15px;
  }
  .error-state { color: var(--color-negative); }

  .page-header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
  .page-header h1 { font-size: 26px; font-weight: 700; margin: 0 0 8px 0; }
  .page-header p { color: var(--color-text-gray); margin: 0; font-size: 15px; }

  .header-actions { display: flex; gap: 0.75rem; }
  .btn-edit {
    background: var(--color-theme-1, #00529B); color: white; border: none;
    padding: 0.6rem 1.25rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer;
  }
  .btn-edit:hover { filter: brightness(0.9); }
  .btn-delete {
    background: white; color: var(--color-negative, #ef4444); border: 1px solid var(--color-negative, #ef4444);
    padding: 0.6rem 1.25rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer;
  }
  .btn-delete:hover { background: #fef2f2; }

  .card {
    background: var(--color-bg-1);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 24px;
  }

  .stat-label { font-size: var(--stat-label-size); color: var(--stat-label-color); font-weight: 500; margin-bottom: 0.5rem; }
  .stat-row { display: flex; align-items: baseline; gap: 0.5rem; }
  .stat-value { font-size: var(--stat-value-size); font-weight: var(--stat-value-weight); color: var(--color-text); }
  .stat-change { font-size: var(--stat-change-size); font-weight: var(--stat-change-weight); }

  .text-green { color: var(--stat-change-positive); }
  .text-red { color: var(--color-negative); }

  .content-grid {
    display: grid;
    grid-template-columns: 2.8fr 1.2fr;
    gap: 24px;
    margin-bottom: 32px;
  }

  .chart-card { display: flex; flex-direction: column; min-height: 400px; }
  .chart-header h3 { font-size: 18px; font-weight: 700; color: var(--color-text); margin: 0 0 16px 0; }

  .tabs { margin-bottom: 24px; display: flex; gap: 16px; border-bottom: 1px solid var(--color-border); }
  .tabs button {
    background: none;
    border: none;
    padding: 8px 4px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-gray);
    cursor: pointer;
    position: relative;
  }
  .tabs button.active { color: var(--color-theme-1); }
  .tabs button.active::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; width: 100%; height: 2px;
    background-color: var(--color-theme-1);
  }

  .chart-container { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; }
  .bar-chart { width: 100%; height: auto; overflow: visible; }

  .chart-legend { display: flex; gap: 16px; margin-top: 4px; font-size: 12px; color: var(--color-text-gray); }
  .legend-item { display: flex; align-items: center; gap: 6px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: block; }
  .dot.blue { background-color: var(--color-theme-1); }
  .dot.yellow { background-color: #fbbf24; }

  .info-card { height: fit-content; }
  .info-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border); }
  .info-header h3 { font-size: 20px; margin: 0 0 8px 0; font-weight: 700; }
  .info-header .desc { font-size: 13px; color: var(--color-text-gray); line-height: 1.5; margin: 0; }

  .info-list { display: flex; flex-direction: column; gap: 12px; }
  .info-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
  .info-row .label { color: var(--color-text-gray); display: flex; align-items: center; gap: 6px; }
  .info-row .val { font-weight: 600; color: var(--color-text); text-align: right; }
  .divider { height: 1px; background-color: var(--color-border); width: 100%; }

  .news-section h3 { font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: var(--color-text); }
  .news-list { border-top: 1px solid var(--color-border); }

  .news-item { padding: 20px 0; border-bottom: 1px solid var(--color-border); }
  .news-meta { font-size: 12px; color: var(--color-text-gray); margin-bottom: 8px; font-weight: 500; }
  .news-content { font-size: 15px; color: var(--color-text); line-height: 1.5; }
  .empty-news { padding: 2rem 0; text-align: center; color: var(--color-text-gray); font-size: 0.9rem; }
  .empty-chart { padding: 3rem 0; text-align: center; color: var(--color-text-gray); font-size: 0.9rem; }

  @media (max-width: 1024px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .content-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .stats-grid { grid-template-columns: 1fr; }
  }

  /* Modal */
  .modal-backdrop {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000;
  }
  .modal {
    background: white; border-radius: 16px; padding: 2rem; max-width: 480px; width: 90%;
    box-shadow: 0 16px 48px rgba(0,0,0,0.15);
  }
  .modal h2 { font-size: 1.3rem; font-weight: 700; margin: 0 0 1.5rem 0; }
  .modal-form { display: flex; flex-direction: column; gap: 1rem; }
  .modal-label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.9rem; font-weight: 600; color: #555; }
  .modal-input {
    padding: 0.65rem 0.85rem; border: 1px solid #e5e7eb; border-radius: 8px;
    font-size: 1rem; outline: none; transition: border-color 0.15s;
  }
  .modal-input:focus { border-color: var(--color-theme-1, #00529B); }
  .modal-error { color: var(--color-negative, #ef4444); font-size: 0.85rem; font-weight: 600; }
  .modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 0.5rem; }
  .btn-cancel {
    background: #f3f4f6; color: #333; border: none; padding: 0.65rem 1.5rem;
    border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer;
  }
  .btn-cancel:hover { background: #e5e7eb; }
  .btn-save {
    background: var(--color-theme-1, #00529B); color: white; border: none; padding: 0.65rem 1.5rem;
    border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer;
  }
  .btn-save:hover { filter: brightness(0.9); }
  .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
  .delete-warning { font-size: 0.95rem; line-height: 1.6; color: #555; margin: 0 0 1rem 0; }
  .btn-confirm-delete {
    background: var(--color-negative, #ef4444); color: white; border: none; padding: 0.65rem 1.5rem;
    border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer;
  }
  .btn-confirm-delete:hover { filter: brightness(0.9); }
  .btn-confirm-delete:disabled { opacity: 0.6; cursor: not-allowed; }


</style>
