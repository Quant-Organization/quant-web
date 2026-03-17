<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { page } from '$app/state';
  import {
    getResearchProjects, getResearchProjectsByCategory, getResearchCenters, getActiveResearch, startResearch, cancelResearch, setInvestment,
    hireResearcher, getCompletedResearch, getResearchEffects,
    type ResearchProjectResponse, type ResearchCenterResponse, type UserResearchResponse, type CompletedResearchResponse
  } from '$lib/api/research';
  import SkeletonTable from '$lib/components/SkeletonTable.svelte';

  let centers = $state<ResearchCenterResponse[]>([]);
  let projects = $state<ResearchProjectResponse[]>([]);
  let activeResearch = $state<UserResearchResponse[]>([]);
  let completedResearch = $state<CompletedResearchResponse[]>([]);
  let researchEffects = $state<CompletedResearchResponse[]>([]);
  let loading = $state(true);

  let center = $derived(centers[0] ?? null);
  let investAmount = $state(600);

  // 탭: 'active' | 'completed' | 'effects'
  let activeTab = $state<'active' | 'completed' | 'effects'>('active');

  // 카테고리별 그룹핑
  let projectsByCategory = $derived<Record<string, ResearchProjectResponse[]>>(
    projects.reduce((acc, p) => {
      const key = p.categoryName || p.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {} as Record<string, ResearchProjectResponse[]>)
  );

  let startingId = $state<number | null>(null);
  let cancelingId = $state<number | null>(null);

  // 카테고리 필터
  let selectedCategory = $state<string | null>(null);
  let allCategories = $state<string[]>([]);

  // 연구원 고용 모달
  let showHireModal = $state(false);
  let hireCount = $state(1);
  let hiring = $state(false);

  onMount(async () => {
    const companyId = Number(page.params.id);
    try {
      const [ctrs, projs, active, completed, effects] = await Promise.all([
        getResearchCenters().catch(() => [] as ResearchCenterResponse[]),
        getResearchProjects().catch(() => [] as ResearchProjectResponse[]),
        getActiveResearch().catch(() => [] as UserResearchResponse[]),
        getCompletedResearch().catch(() => [] as CompletedResearchResponse[]),
        getResearchEffects(companyId).catch(() => [] as CompletedResearchResponse[])
      ]);
      centers = ctrs;
      projects = projs;
      allCategories = [...new Set(projs.map(p => p.categoryName || p.category))];
      activeResearch = active;
      completedResearch = completed;
      researchEffects = effects;
      if (ctrs[0]) investAmount = Math.round(ctrs[0].monthlyInvestment / 1000);
    } catch (e) {
      console.error('R&D 데이터 로드 실패:', e);
    } finally {
      loading = false;
    }
  });

  async function handleStart(project: ResearchProjectResponse) {
    if (!center) return;
    startingId = project.id;
    try {
      await startResearch({ researchCenterId: center.id, projectId: project.id, assignedResearchers: project.requiredResearchers });
      activeResearch = await getActiveResearch();
      projects = await getResearchProjects();
      toast.success('연구가 시작되었습니다.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '연구 시작에 실패했습니다.');
    } finally {
      startingId = null;
    }
  }

  async function handleCancel(research: UserResearchResponse) {
    cancelingId = research.id;
    try {
      await cancelResearch(research.id);
      activeResearch = await getActiveResearch();
      projects = await getResearchProjects();
      toast.success('연구가 취소되었습니다.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '연구 취소에 실패했습니다.');
    } finally {
      cancelingId = null;
    }
  }

  async function handleInvestmentChange(e: Event) {
    const target = e.target as HTMLInputElement;
    investAmount = Number(target.value);
    if (!center) return;
    try {
      const updated = await setInvestment(center.id, investAmount * 1000);
      centers = centers.map(c => c.id === updated.id ? updated : c);
    } catch (e) {
      console.error('투자액 변경 실패:', e);
    }
  }

  async function handleHireResearcher() {
    if (!center) return;
    hiring = true;
    try {
      await hireResearcher(center.id, hireCount);
      centers = await getResearchCenters().catch(() => centers);
      showHireModal = false;
      toast.success('연구원이 고용되었습니다.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '연구원 고용에 실패했습니다.');
    } finally {
      hiring = false;
    }
  }

  function formatCurrency(n: number) {
    n = n ?? 0;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  }

  async function handleCategoryFilter(category: string | null) {
    if (category === null || selectedCategory === category) {
      selectedCategory = null;
      try { projects = await getResearchProjects(); } catch (e) { console.error('프로젝트 로드 실패:', e); }
    } else {
      selectedCategory = category;
      try { projects = await getResearchProjectsByCategory(category); } catch (e) { console.error('카테고리 필터 실패:', e); }
    }
  }
</script>

<div class="page-wrapper">

  <header class="page-header">
    <h1>R&D 센터</h1>
  </header>

  {#if loading}
    <SkeletonTable rows={4} cols={3} />
  {:else}

  <section class="top-stats-grid">
    <div class="card stat-card">
      <span class="label">월별 투자액</span>
      <h2 class="value">{center ? formatCurrency(center.monthlyInvestment) : '-'}/월</h2>
    </div>

    <div class="card stat-card">
      <span class="label">총 연구원 수</span>
      <h2 class="value">{center?.totalResearchers ?? 0}명</h2>
      <button class="hire-btn" onclick={() => { hireCount = 1; showHireModal = true; }} disabled={!center}>
        + 연구원 고용
      </button>
    </div>

    <div class="card slider-card">
      <div class="slider-header">
        <span class="label">월 투자액 조절</span>
      </div>
      <div class="slider-container">
        <div class="range-labels">
          <span>$100K</span>
          <span>$1M</span>
        </div>
        <input
          type="range"
          min={100}
          max={1000}
          value={investAmount}
          oninput={handleInvestmentChange}
          class="custom-range"
          disabled={!center}
        />
        <p class="slider-info">
          연구 속도 보너스: ${investAmount}K 투자 시 +{center?.researchSpeedBonus ?? 0}%
        </p>
      </div>
    </div>
  </section>

  <div class="main-layout">
    <section class="left-column">
      <div class="tab-bar">
        <button class="tab-btn" class:active={activeTab === 'active'} onclick={() => { activeTab = 'active'; }}>진행 중인 프로젝트</button>
        <button class="tab-btn" class:active={activeTab === 'completed'} onclick={() => { activeTab = 'completed'; }}>완료된 연구</button>
        <button class="tab-btn" class:active={activeTab === 'effects'} onclick={() => { activeTab = 'effects'; }}>연구 효과</button>
      </div>

      <!-- 진행 중인 프로젝트 탭 -->
      {#if activeTab === 'active'}
      {#if activeResearch.length === 0}
        <div class="card ongoing-card">
          <div class="ongoing-content">
            <p class="no-data">진행 중인 연구가 없습니다.</p>
          </div>
        </div>
      {:else}
        {#each activeResearch as research}
        <div class="card ongoing-card">
          {#if research.project.imageUrl}
          <div class="image-wrapper">
            <img src={research.project.imageUrl} alt="Project" />
          </div>
          {/if}

          <div class="ongoing-content">
            <h2 class="project-title">{research.project.name} Lv.{research.project.level}</h2>

            <div class="progress-section">
              <div class="progress-info">
                <span class="progress-label">진행률</span>
                <span class="progress-val">{research.progressPercent}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: {research.progressPercent}%"></div>
              </div>
            </div>

            <hr class="divider" />

            <div class="ongoing-stats">
              <div class="stats-row">
                <div class="stat-item">
                  <span class="s-label">효과</span>
                  <span class="s-val">{research.project.effectDescription}</span>
                </div>
                <div class="stat-item">
                  <span class="s-label">투자액</span>
                  <span class="s-val">{formatCurrency(research.investedAmount)}</span>
                </div>
              </div>
              <div class="stats-row">
                <div class="stat-item">
                  <span class="s-label">남은 시간</span>
                  <span class="s-val">{research.remainingHours >= 24 ? `${Math.ceil(research.remainingHours / 24)}일` : `${Math.ceil(research.remainingHours)}시간`}</span>
                </div>
                <div class="stat-item">
                  <span class="s-label">투입 연구원</span>
                  <span class="s-val">{research.assignedResearchers}명</span>
                </div>
              </div>
            </div>

            <div class="p-footer" style="margin-top:1rem;">
              <button class="cancel-btn" onclick={() => handleCancel(research)} disabled={cancelingId === research.id}>
                {cancelingId === research.id ? '취소 중...' : '연구 취소'}
              </button>
            </div>
          </div>
        </div>
        {/each}
      {/if}
      {/if}

      <!-- 완료된 연구 탭 -->
      {#if activeTab === 'completed'}
      {#if completedResearch.length === 0}
        <div class="card ongoing-card">
          <div class="ongoing-content">
            <p class="no-data">완료된 연구가 없습니다.</p>
          </div>
        </div>
      {:else}
        {#each completedResearch as cr}
        <div class="card completed-card">
          <div class="completed-header">
            <div>
              <h4 class="completed-title">{cr.project.name} Lv.{cr.project.level}</h4>
              <span class="completed-date">완료일: {new Date(cr.completedDate).toLocaleDateString('ko-KR')}</span>
            </div>
            <span class="badge done">완료</span>
          </div>
          <p class="completed-effect">{cr.effectDescription}</p>
        </div>
        {/each}
      {/if}
      {/if}

      <!-- 연구 효과 탭 -->
      {#if activeTab === 'effects'}
      {#if researchEffects.length === 0}
        <div class="card ongoing-card">
          <div class="ongoing-content">
            <p class="no-data">적용 중인 연구 효과가 없습니다.</p>
          </div>
        </div>
      {:else}
        <div class="card effects-card">
          <h4 class="effects-title">현재 적용 중인 연구 효과</h4>
          <div class="effects-list">
            {#each researchEffects as ef}
            <div class="effect-item">
              <div class="effect-info">
                <span class="effect-name">{ef.project.name}</span>
                <span class="effect-type">{ef.effectTypeName}</span>
              </div>
              <span class="effect-value">+{ef.effectValue}%</span>
            </div>
            {/each}
          </div>
        </div>
      {/if}
      {/if}

    </section>

    <section class="right-column">
      <h3 class="section-title">연구 가능 프로젝트</h3>

      <div class="category-filter-row">
        <button
          class="cat-btn"
          class:active={selectedCategory === null}
          onclick={() => handleCategoryFilter(null)}
        >전체</button>
        {#each allCategories as cat}
          <button
            class="cat-btn"
            class:active={selectedCategory === cat}
            onclick={() => handleCategoryFilter(cat)}
          >{cat}</button>
        {/each}
      </div>

      <div class="card project-list-card">
        <div class="project-list">
          {#each Object.entries(projectsByCategory) as [category, categoryProjects]}
          <div class="category-group">
            <h4 class="category-title">{category}</h4>
            {#each categoryProjects as project}
              <div class="project-item-card">
                <div class="p-header">
                  <h4>{project.name} Lv.{project.level}</h4>
                  {#if project.isCompleted}
                    <span class="badge done">완료</span>
                  {/if}
                </div>
                <div class="p-info-row">
                  <span class="p-effect">효과: {project.effectDescription}</span>
                  <span class="p-cost">비용: {formatCurrency(project.requiredBudget)} / {project.requiredDays >= 24 ? `${Math.round(project.requiredDays / 24)}일` : `${project.requiredDays}시간`}</span>
                </div>
                <div class="p-footer">
                  <button
                    class="start-btn"
                    onclick={() => handleStart(project)}
                    disabled={!project.canStart || startingId === project.id}
                  >
                    {startingId === project.id ? '시작 중...' : project.isCompleted ? '완료됨' : '연구 시작'}
                  </button>
                </div>
              </div>
            {/each}
          </div>
          {/each}
          {#if projects.length === 0}
            <p class="no-data">연구 프로젝트가 없습니다.</p>
          {/if}
        </div>
      </div>
    </section>

  </div>

  {/if}

  <!-- 연구원 고용 모달 -->
  {#if showHireModal}
  <div class="modal-overlay" onclick={() => { showHireModal = false; }}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3>연구원 고용</h3>
        <button class="modal-close" onclick={() => { showHireModal = false; }}>✕</button>
      </div>
      <div class="modal-body">
        <div class="center-info-row">
          <span>현재 연구원</span>
          <span class="info-val">{center?.totalResearchers ?? 0}명</span>
        </div>
        <div class="center-info-row">
          <span>가용 연구원</span>
          <span class="info-val">{center?.availableResearchers ?? 0}명</span>
        </div>
        <div class="form-group" style="margin-top: 8px;">
          <label for="hire-count">고용할 연구원 수</label>
          <input id="hire-count" type="number" min="1" bind:value={hireCount} />
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-modal-btn" onclick={() => { showHireModal = false; }}>취소</button>
        <button class="primary-btn" onclick={handleHireResearcher} disabled={hiring || hireCount < 1}>
          {hiring ? '고용 중...' : '고용 확정'}
        </button>
      </div>
    </div>
  </div>
  {/if}

</div>

<style>
  /* --- 기본 설정 --- */
  .page-wrapper {
    background-color: var(--color-bg-0);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: var(--color-text);
  }

  .card {
    background: var(--color-bg-1);
    border-radius: 12px;
    border: 1px solid var(--color-border);
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    overflow: hidden;
  }

  /* --- 1. 헤더 --- */
  .page-header h1 {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 32px 0;
  }

  /* --- 2. 상단 통계 그리드 --- */
  .top-stats-grid {
    display: grid;
    /* 카드 비율: 1 : 1 : 2 (슬라이더 카드가 넓음) */
    grid-template-columns: 1fr 1fr 2fr;
    gap: 24px;
    margin-bottom: 40px;
  }

  .stat-card {
    padding: var(--card-padding);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .label {
    font-size: var(--stat-label-size);
    color: var(--stat-label-color);
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .value {
    font-size: var(--stat-value-size);
    font-weight: var(--stat-value-weight);
    margin: 0;
    color: var(--color-text);
  }

  /* 슬라이더 카드 스타일 */
  .slider-card {
    padding: var(--card-padding);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .slider-container {
    position: relative;
    padding-top: 10px;
  }

  .range-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--color-text-gray);
    font-weight: 600;
    margin-bottom: 8px;
  }

  .custom-range {
    -webkit-appearance: none;
    width: 100%;
    height: 6px;
    background: var(--color-border);
    border-radius: 5px;
    outline: none;
    margin-bottom: 12px;
    cursor: pointer;
  }

  /* 슬라이더 Thumb (핸들) 커스텀 */
  .custom-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--color-theme-1);
    border: 2px solid var(--color-bg-1);
    box-shadow: 0 0 0 1px var(--color-theme-1);
    cursor: pointer;
  }
  .custom-range::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--color-theme-1);
    border: 2px solid var(--color-bg-1);
    box-shadow: 0 0 0 1px var(--color-theme-1);
    cursor: pointer;
  }

  .slider-info {
    font-size: 11px;
    color: var(--color-text-gray);
    text-align: center;
    margin: 0;
  }

  /* --- 3. 메인 레이아웃 (좌/우) --- */
  .main-layout {
    display: grid;
    grid-template-columns: 1.4fr 1fr; /* 좌측이 약간 더 넓음 */
    gap: 32px;
    align-items: start;
  }

  .section-title {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 16px 0;
    color: var(--color-text);
  }

  .category-filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .cat-btn {
    padding: 0.3rem 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: 20px;
    background: white;
    color: var(--color-text-gray);
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    transition: all 0.15s;
  }

  .cat-btn.active {
    background: var(--color-theme-1);
    color: white;
    border-color: var(--color-theme-1);
  }

  /* 좌측: 진행 중인 프로젝트 */
  .ongoing-card {
    /* 내부 패딩 없이 이미지 꽉 채우기 위해 */
    display: flex;
    flex-direction: column;
  }

  .image-wrapper {
    width: 100%;
    height: 240px;
    background-color: var(--color-bg-2);
    overflow: hidden;
  }
  .image-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ongoing-content {
    padding: 24px;
  }

  .project-title {
    font-size: 22px;
    font-weight: 700;
    margin: 0 0 24px 0;
    color: var(--color-text);
  }

  /* 프로그레스 바 */
  .progress-section { margin-bottom: 24px; }

  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
  }
  .progress-label { color: var(--color-theme-1); }
  .progress-val { color: var(--color-theme-1); }

  .progress-track {
    width: 100%;
    height: 10px;
    background-color: var(--color-bg-2);
    border-radius: 5px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: var(--color-theme-1);
    border-radius: 5px;
    transition: width 0.3s ease;
  }

  .divider {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 0 0 24px 0;
  }

  /* 하단 스탯 그리드 */
  .ongoing-stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .stats-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .s-label { font-size: 13px; color: var(--color-text); font-weight: 600; }
  .s-val { font-size: 15px; font-weight: 600; color: var(--color-text-gray); }

  /* 우측: 리스트 */
  .project-list-card {
    padding: 24px;
    max-height: 500px;
    overflow-y: auto;
  }

  .project-list {
    display: flex;
    flex-direction: column;
  }

  .category-group {
    margin-bottom: 24px;
  }
  .category-group:last-child {
    margin-bottom: 0;
  }

  .category-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 12px 0;
  }

  .project-item-card {
    padding: 20px;
    margin-bottom: 12px;
    background-color: rgba(241, 243, 247, 0.5);
    border-radius: 10px;
  }
  .project-item-card:last-child {
    margin-bottom: 0;
  }

  .p-header h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text);
  }

  .p-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .p-effect {
    font-size: 14px;
    color: var(--color-text-gray);
  }

  .p-cost {
    font-size: 13px;
    color: var(--color-text-gray);
  }

  .p-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .start-btn {
    background-color: var(--color-theme-1);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .start-btn:hover {
    opacity: 0.9;
  }

  /* 반응형 (Mobile) */
  @media (max-width: 900px) {
    .top-stats-grid {
      grid-template-columns: 1fr;
    }
    .main-layout {
      grid-template-columns: 1fr;
    }
    .ongoing-stats {
      grid-template-columns: 1fr 1fr; /* 모바일에서도 2열 유지 */
    }
  }

  .loading-text { color: var(--color-text-gray); padding: 2rem; text-align: center; }
  .no-data { color: var(--color-text-gray); font-size: 0.9rem; margin: 0; text-align: center; padding: 1rem; }

  .cancel-btn {
    background-color: #ef4444;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .cancel-btn:hover { opacity: 0.85; }
  .cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .start-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 600;
  }
  .badge.done {
    background: #dcfce7;
    color: #16a34a;
  }

  .p-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0;
  }

  /* --- 연구원 고용 버튼 --- */
  .hire-btn {
    margin-top: 10px;
    background-color: var(--color-theme-1);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    align-self: flex-start;
  }
  .hire-btn:hover { opacity: 0.9; }
  .hire-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* --- 탭 --- */
  .tab-bar {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
    border-bottom: 2px solid var(--color-border);
    padding-bottom: 0;
  }

  .tab-btn {
    background: none;
    border: none;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-gray);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: color 0.15s, border-color 0.15s;
  }
  .tab-btn.active {
    color: var(--color-theme-1);
    border-bottom-color: var(--color-theme-1);
  }
  .tab-btn:hover:not(.active) { color: var(--color-text); }

  /* --- 완료된 연구 카드 --- */
  .completed-card {
    padding: 16px 20px;
    margin-bottom: 12px;
  }
  .completed-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }
  .completed-title {
    font-size: 15px;
    font-weight: 700;
    margin: 0 0 4px 0;
    color: var(--color-text);
  }
  .completed-date {
    font-size: 12px;
    color: var(--color-text-gray);
  }
  .completed-effect {
    font-size: 13px;
    color: var(--color-text-gray);
    margin: 0;
  }

  /* --- 연구 효과 카드 --- */
  .effects-card {
    padding: 20px 24px;
  }
  .effects-title {
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 16px 0;
    color: var(--color-text);
  }
  .effects-list { display: flex; flex-direction: column; gap: 12px; }
  .effect-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--color-bg-2, #f8fafc);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }
  .effect-info { display: flex; flex-direction: column; gap: 2px; }
  .effect-name { font-size: 14px; font-weight: 600; color: var(--color-text); }
  .effect-type { font-size: 12px; color: var(--color-text-gray); }
  .effect-value { font-size: 15px; font-weight: 700; color: #10b981; }

  /* --- 모달 --- */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal {
    background: var(--color-bg-0);
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 400px;
    overflow: hidden;
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border);
  }
  .modal-header h3 { margin: 0; font-size: 18px; font-weight: 700; }
  .modal-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--color-text-gray);
    padding: 4px;
    line-height: 1;
  }
  .modal-body {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid var(--color-border);
  }
  .cancel-modal-btn {
    background: var(--color-bg-2, #f1f3f7);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .primary-btn {
    background-color: var(--color-theme-1);
    color: white;
    border: none;
    padding: 8px 18px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .primary-btn:hover { opacity: 0.9; }
  .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-group label { font-size: 13px; font-weight: 600; color: var(--color-text-gray); }
  .form-group input[type="number"] {
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 14px;
    background: var(--color-bg-0);
    color: var(--color-text);
    width: 100%;
  }

  .center-info-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: var(--color-text-gray);
    padding: 4px 0;
  }
  .info-val { font-weight: 700; color: var(--color-text); }
</style>
