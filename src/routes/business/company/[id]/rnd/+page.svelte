<script lang="ts">
  // ------------------------------------------
  // 1. 데이터 타입 정의 (TypeScript)
  // ------------------------------------------
  interface ResearchStats {
    monthlyInvest: string; // 월별 투자액
    researcherCount: number; // 총 연구원 수
    investRange: { min: number; max: number; current: number }; // 슬라이더 데이터
  }

  interface OngoingProject {
    name: string;
    level: number;
    progress: number;
    imageUrl: string;
    effect: string;
    budget: string;
    duration: string;
    researchers: number;
  }

  interface ResearchItem {
    id: number;
    category: string; // '생산 효율' | '비용 절감' 등
    name: string;
    level: number;
    effect: string;
    cost: string;
    duration: string;
  }

  // ------------------------------------------
  // 2. 목업 데이터 (Mock Data)
  // ------------------------------------------

  // 상단 통계 및 슬라이더 설정
  let stats: ResearchStats = {
    monthlyInvest: "$600K",
    researcherCount: 120,
    investRange: { min: 100, max: 1000, current: 600 } // 단위 K
  };

  // 진행 중인 프로젝트 (좌측 큰 카드)
  const ongoingProject: OngoingProject = {
    name: "자동화 조립 라인",
    level: 3,
    progress: 80,
    imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800",
    effect: "-12% 필요 인력",
    budget: "$4M",
    duration: "18일",
    researchers: 40
  };

  // 연구 가능 프로젝트 (우측 리스트)
  const availableProjects: ResearchItem[] = [
    {
      id: 1, category: "생산 효율",
      name: "자동화 조립 라인", level: 1,
      effect: "-12% 필요 인력", cost: "$4M", duration: "18일"
    },
    {
      id: 2, category: "생산 효율", // UI상 같은 카테고리로 보임
      name: "자동화 조립 라인", level: 2,
      effect: "-12% 필요 인력", cost: "$4M", duration: "18일"
    },
    {
      id: 3, category: "비용 절감",
      name: "자동화 조립 라인", level: 1,
      effect: "-12% 필요 인력", cost: "$4M", duration: "18일"
    }
  ];

  // 슬라이더 값 변경 핸들러 (UI 갱신용)
  function handleSliderChange(e: Event) {
    const target = e.target as HTMLInputElement;
    stats.investRange.current = Number(target.value);
    stats.monthlyInvest = `${stats.investRange.current}K`;
  }
</script>

<div class="page-wrapper">

  <header class="page-header">
    <h1>R&D 센터</h1>
  </header>

  <section class="top-stats-grid">
    <div class="card stat-card">
      <span class="label">월별 투자액</span>
      <h2 class="value">{stats.monthlyInvest}/월</h2>
    </div>

    <div class="card stat-card">
      <span class="label">총 연구원 수</span>
      <h2 class="value">{stats.researcherCount}명</h2>
    </div>

    <div class="card slider-card">
      <div class="slider-header">
        <span class="label">월 투자액 조절</span>
      </div>

      <div class="slider-container">
        <div class="range-labels">
          <span>${stats.investRange.min}K</span>
          <span>${stats.investRange.max / 1000}M</span>
        </div>
        <input
          type="range"
          min={stats.investRange.min}
          max={stats.investRange.max}
          value={stats.investRange.current}
          on:input={handleSliderChange}
          class="custom-range"
        />
        <p class="slider-info">연구 속도 보너스 : ${stats.investRange.current}K 투자할 시 +5%</p>
      </div>
    </div>
  </section>

  <div class="main-layout">

    <section class="left-column">
      <h3 class="section-title">진행 중인 프로젝트</h3>

      <div class="card ongoing-card">
        <div class="image-wrapper">
          <img src={ongoingProject.imageUrl} alt="Project" />
        </div>

        <div class="ongoing-content">
          <h2 class="project-title">{ongoingProject.name} Lv.{ongoingProject.level}</h2>

          <div class="progress-section">
            <div class="progress-info">
              <span class="progress-label">진행률</span>
              <span class="progress-val">{ongoingProject.progress}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: {ongoingProject.progress}%"></div>
            </div>
          </div>

          <hr class="divider" />

          <div class="ongoing-stats">
            <div class="stats-row">
              <div class="stat-item">
                <span class="s-label">효과</span>
                <span class="s-val">{ongoingProject.effect}</span>
              </div>
              <div class="stat-item">
                <span class="s-label">필요 예산</span>
                <span class="s-val">{ongoingProject.budget}</span>
              </div>
            </div>
            <div class="stats-row">
              <div class="stat-item">
                <span class="s-label">소요 기간</span>
                <span class="s-val">{ongoingProject.duration}</span>
              </div>
              <div class="stat-item">
                <span class="s-label">필요 연구원</span>
                <span class="s-val">{ongoingProject.researchers}명</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="right-column">
      <h3 class="section-title">연구 가능 프로젝트</h3>

      <div class="card project-list-card">
        <div class="project-list">
          <div class="category-group">
            <h4 class="category-title">생산 효율</h4>
            {#each availableProjects.filter(p => p.category === '생산 효율') as project}
              <div class="project-item-card">
                <div class="p-header">
                  <h4>{project.name} Lv.{project.level}</h4>
                </div>
                <div class="p-info-row">
                  <span class="p-effect">효과: {project.effect}</span>
                  <span class="p-cost">비용: {project.cost} / 기간 {project.duration}</span>
                </div>
                <div class="p-footer">
                  <button class="start-btn">연구 시작</button>
                </div>
              </div>
            {/each}
          </div>

          <div class="category-group">
            <h4 class="category-title">비용 절감</h4>
            {#each availableProjects.filter(p => p.category === '비용 절감') as project}
              <div class="project-item-card">
                <div class="p-header">
                  <h4>{project.name} Lv.{project.level}</h4>
                </div>
                <div class="p-info-row">
                  <span class="p-effect">효과: {project.effect}</span>
                  <span class="p-cost">비용: {project.cost} / 기간 {project.duration}</span>
                </div>
                <div class="p-footer">
                  <button class="start-btn">연구 시작</button>
                </div>
              </div>
            {/each}
          </div>

        </div>
      </div>
    </section>

  </div>
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
</style>
