<script lang="ts">
  // --- Types ---
  interface CountryGDP {
    rank: number;
    code: string;
    name: string;
    nameKr: string;
    flag: string;
    value: string;
    region: string;
    growth: string;
    population: string;
    inflation: string;
  }

  interface Material {
    name: string;
    change: number;
    price: string;
    imageUrl: string;
  }

  interface NewsItem {
    source: string;
    time: string;
    title: string;
  }

  // --- Data ---

  // 1. GDP 국가 목록
  const gdpList: CountryGDP[] = [
    { rank: 1, code: 'USA', name: 'USA', nameKr: '미국', flag: '🇺🇸', value: '29.18T', region: '북아메리카', growth: '3.3%', population: '3억 4115만명', inflation: '5.3%' },
    { rank: 2, code: 'CHN', name: 'China', nameKr: '중국', flag: '🇨🇳', value: '18.74T', region: '아시아', growth: '5.2%', population: '14억 2570만명', inflation: '0.2%' },
    { rank: 3, code: 'DEU', name: 'Germany', nameKr: '독일', flag: '🇩🇪', value: '4.66T', region: '유럽', growth: '0.1%', population: '8420만명', inflation: '2.9%' },
    { rank: 4, code: 'JPN', name: 'Japan', nameKr: '일본', flag: '🇯🇵', value: '4.03T', region: '아시아', growth: '1.9%', population: '1억 2450만명', inflation: '2.8%' },
    { rank: 5, code: 'IND', name: 'India', nameKr: '인도', flag: '🇮🇳', value: '3.91T', region: '아시아', growth: '7.2%', population: '14억 2860만명', inflation: '5.1%' },
    { rank: 6, code: 'UK', name: 'UK', nameKr: '영국', flag: '🇬🇧', value: '3.64T', region: '유럽', growth: '0.5%', population: '6720만명', inflation: '4.0%' },
  ];

  // 2. 선택된 국가 코드 (반응형)
  let selectedCode = $state('USA');

  // 3. 선택된 국가 상세 정보 (derived)
  let selectedCountry = $derived(gdpList.find(c => c.code === selectedCode) || gdpList[0]);

  function selectCountry(code: string) {
    selectedCode = code;
  }

  // 3. 원자재 시세
  const materials: Material[] = [
    { name: "원유", change: -1.25, price: "$76.6", imageUrl: "https://cdn-icons-png.flaticon.com/512/2933/2933942.png" },
    { name: "천연가스", change: 5.25, price: "$46.6", imageUrl: "https://cdn-icons-png.flaticon.com/512/4248/4248332.png" },
    { name: "철", change: -3.25, price: "$63.2", imageUrl: "https://cdn-icons-png.flaticon.com/512/5816/5816309.png" },
    { name: "구리", change: 2.25, price: "$53.3", imageUrl: "https://cdn-icons-png.flaticon.com/512/3792/3792160.png" },
    { name: "희토류", change: 0.25, price: "$133.2", imageUrl: "https://cdn-icons-png.flaticon.com/512/7168/7168434.png" }
  ];

  // 4. 뉴스 데이터
  const newsList: NewsItem[] = [
    { source: "BBC", time: "2분전", title: "미 연준, 기준 금리 동결 시사... 시장은 안도 랠리" },
    { source: "Reuters", time: "15분전", title: "중국 경제 성장률 5.2% 달성, 목표치 상회" },
    { source: "Bloomberg", time: "32분전", title: "유럽 중앙은행, 금리 인하 가능성 시사" },
    { source: "CNBC", time: "1시간전", title: "애플, 신규 AI 칩 개발 발표... 주가 3% 상승" },
    { source: "WSJ", time: "1시간전", title: "국제 유가, 중동 긴장 고조에 2% 급등" },
    { source: "FT", time: "2시간전", title: "일본 엔화, 34년 만에 최저치 기록" },
    { source: "Reuters", time: "2시간전", title: "인도 GDP, 세계 4위 경제 대국으로 부상" },
    { source: "BBC", time: "3시간전", title: "영국 인플레이션, 예상보다 빠르게 둔화" },
  ];

</script>

<svelte:head>
  <title>세계 정세</title>
</svelte:head>

<div class="page-container">

  <header class="page-header">
    <div class="header-text">
      <h1>국제 정세 및 경제 분석</h1>
      <p>비즈니스 전략에 영향을 미치는 거시 경제 환경을 깊이 있게 파악하세요.</p>
    </div>
  </header>

  <div class="dashboard-grid">

    <div class="left-column">

      <div class="card gdp-card">
        <div class="country-list">
          <div class="list-header">
            <span class="divider-line"></span>
            <span class="header-text">GDP 순위</span>
            <span class="divider-line"></span>
          </div>
          <ul>
            {#each gdpList as country}
              <li class:selected={country.code === selectedCode} onclick={() => selectCountry(country.code)}>
                <div class="flag-name">
                  <span class="flag">{country.flag}</span>
                  <span class="name">{country.name}</span>
                </div>
                <span class="value">{country.value}</span>
              </li>
            {/each}
          </ul>
        </div>

        <div class="country-detail">
          <div class="detail-header">
            <h2>{selectedCountry.nameKr} <span class="region">{selectedCountry.region}</span></h2>
          </div>

          <div class="stats-grid">
            <div class="stat-box">
              <span class="label">GDP</span>
              <span class="val">{selectedCountry.value}</span>
            </div>
            <div class="stat-box">
              <span class="label">GDP 성장률</span>
              <span class="val text-green">{selectedCountry.growth}</span>
            </div>
            <div class="stat-box">
              <span class="label">인구</span>
              <span class="val">{selectedCountry.population}</span>
            </div>
            <div class="stat-box">
              <span class="label">인플레이션</span>
              <span class="val">{selectedCountry.inflation}</span>
            </div>
          </div>

          <div class="chart-area">
            <svg viewBox="0 0 300 100" class="line-chart">
              <line x1="0" y1="25" x2="300" y2="25" stroke="var(--color-border)" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="var(--color-border)" />
              <line x1="0" y1="75" x2="300" y2="75" stroke="var(--color-border)" />
              <path d="M0 90 Q 50 85, 100 80 T 200 40 T 300 20" fill="none" stroke="var(--color-theme-1)" stroke-width="2" />
              <text x="0" y="98" font-size="8" fill="var(--color-text-gray)">1994</text>
              <text x="100" y="98" font-size="8" fill="var(--color-text-gray)">2004</text>
              <text x="200" y="98" font-size="8" fill="var(--color-text-gray)">2014</text>
              <text x="280" y="98" font-size="8" fill="var(--color-text-gray)">2024</text>
            </svg>
          </div>
        </div>
      </div>

      <div class="card material-card">
        <h3>주요 원자재 시세</h3>
        <div class="material-list">
          {#each materials as mat}
            <div class="material-item">
              <div class="mat-header">
                <span class="mat-name">{mat.name}</span>
                <span class="mat-change {mat.change > 0 ? 'text-blue' : 'text-red'}">
                  {mat.change > 0 ? '+' : ''}{mat.change}%
                </span>
              </div>
              <div class="mat-icon-wrapper">
                <img src={mat.imageUrl} alt={mat.name} class="mat-img" />
              </div>
              <div class="mat-price">{mat.price}</div>
            </div>
          {/each}
        </div>
      </div>

    </div>

    <div class="right-column">
      <div class="card news-card">
        <h3>실시간 글로벌 뉴스</h3>
        <div class="news-list">
          {#each newsList as news}
            <div class="news-item">
              <div class="news-meta">
                <span class="source">{news.source}</span>
                <span class="dot">•</span>
                <span class="time">{news.time}</span>
              </div>
              <div class="news-title">{news.title}</div>
            </div>
          {/each}
        </div>
        <div class="news-footer">
          <button>더 보기</button>
        </div>
      </div>
    </div>

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

  .page-header h1 {
    font-size: var(--page-title-size);
    font-weight: var(--page-title-weight);
    margin: 0 0 0.5rem 0;
  }

  .page-header p {
    font-size: var(--page-desc-size);
    color: var(--color-text-gray);
    margin: 0;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    grid-template-rows: 1fr;
    gap: var(--spacing-md);
  }

  .left-column {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .right-column {
    display: grid;
  }

  .news-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .news-card h3 {
    flex-shrink: 0;
  }

  .news-card .news-list {
    flex: 1;
    overflow-y: auto;
  }

  .news-card .news-footer {
    flex-shrink: 0;
  }

  .card {
    background: var(--color-bg-1);
    border-radius: var(--card-border-radius);
    box-shadow: var(--card-shadow);
    border: 1px solid var(--color-border);
    padding: var(--card-padding);
  }

  h3 { font-size: 1.125rem; font-weight: 700; margin: 0 0 1.25rem 0; }

  .gdp-card {
    display: flex;
    gap: 32px;
    padding: 0;
    overflow: hidden;
  }

  .country-list {
    width: 240px;
    padding: 24px 0 24px 24px;
  }

  .list-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 12px;
    margin-bottom: 12px;
    margin-right: 12px;
    height: 30px;
  }

  .list-header .divider-line {
    flex: 1;
    height: 1px;
    background-color: var(--color-text);
  }

  .list-header .header-text {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text);
    white-space: nowrap;
  }

  .country-list ul { list-style: none; padding: 0; margin: 0; }

  .country-list li {
    display: flex;
    justify-content: space-between;
    padding: 12px 24px 12px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
    transition: background-color 0.2s;
  }

  .country-list li:hover {
    background-color: var(--color-bg-2);
  }

  .country-list li.selected {
    background-color: var(--color-bg-2);
    font-weight: 700;
  }

  .flag-name { display: flex; gap: 8px; align-items: center; }
  .flag { font-size: 16px; }

  .country-detail {
    flex: 1;
    padding: 24px 32px 24px 32px;
  }

  .detail-header { margin-bottom: 20px; height: 30px; display: flex; align-items: center; }
  .detail-header h2 { font-size: 22px; margin: 0; display: flex; align-items: baseline; gap: 8px; font-weight: 700; }
  .detail-header .region { font-size: 13px; color: var(--color-text-gray); font-weight: 400; }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-box {
    background-color: var(--color-bg-2);
    padding: var(--card-padding);
    border-radius: 8px;
  }

  .stat-box .label { display: block; font-size: var(--stat-label-size); color: var(--stat-label-color); margin-bottom: 0.5rem; }
  .stat-box .val { font-size: var(--stat-value-size); font-weight: var(--stat-value-weight); color: var(--color-text); }

  .chart-area {
    background-color: var(--color-bg-1);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 16px;
    height: 120px;
  }
  .line-chart { width: 100%; height: 100%; }

  .material-list {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .material-item {
    flex: 1;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .mat-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 13px;
    margin-bottom: 12px;
    white-space: nowrap;
  }

  .mat-name { font-weight: 600; }
  .mat-change { font-size: 11px; }

  .mat-icon-wrapper {
    width: 60px;
    height: 60px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mat-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
  }

  .mat-price { font-weight: 700; font-size: 15px; }

  .news-list {
    display: flex;
    flex-direction: column;
  }

  .news-item {
    padding: 16px 0;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }
  .news-item:first-child { padding-top: 0; }

  .news-meta {
    font-size: 12px;
    color: var(--color-text-gray);
    margin-bottom: 6px;
  }

  .news-title {
    font-size: 15px;
    line-height: 1.4;
    color: var(--color-text);
    font-weight: 500;
  }

  .news-footer {
    padding-top: 20px;
    text-align: center;
    flex-shrink: 0;
    margin-top: auto;
  }

  .news-footer button {
    background: none;
    border: none;
    color: var(--color-theme-1);
    font-weight: 600;
    cursor: pointer;
    font-size: 14px;
  }

  .text-green { color: var(--color-positive); }
  .text-red { color: var(--color-negative); }
  .text-blue { color: var(--color-theme-1); }

  @media (max-width: 1024px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .gdp-card { flex-direction: column; }
    .country-list { width: 100%; border-bottom: 1px solid var(--color-border); padding-right: 24px; }
    .country-detail { padding-left: 24px; }
    .material-list { flex-wrap: wrap; }
    .material-item { min-width: 45%; margin-bottom: 16px; }
  }
</style>
