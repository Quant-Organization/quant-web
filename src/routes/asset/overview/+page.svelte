<script>
    // 이미지의 텍스트와 수치 데이터를 변수로 관리합니다.
    const metrics = [
        { title: '실시간 수익 현황', value: '$257,800,000', change: '+1.2%', isMoney: true },
        { title: '획득 명성 점수', value: '12,500P', change: '+50', isMoney: false },
        { title: '컬렉션 완성도', value: '76%', isProgress: true }
    ];

    const assets = [
        {
            type: '고급 차량',
            count: '5대',
            totalValue: '$12,500,000',
            image: 'https://images.unsplash.com/photo-1605559424843-9e4c2287f38d?q=80&w=800&auto=format&fit=crop'
        },
        {
            type: '전용기',
            count: '2대',
            totalValue: '$120,000,000',
            image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=800&auto=format&fit=crop'
        },
        {
            type: '개인 부동산',
            count: '3채',
            totalValue: '$85,000,000',
            image: 'https://images.unsplash.com/photo-1600596542815-e3289cab6f97?q=80&w=800&auto=format&fit=crop'
        },
        {
            type: '요트',
            count: '1대',
            totalValue: '$40,000,000',
            image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=800&auto=format&fit=crop'
        }
    ];
</script>

<div class="dashboard-content">
    <h1 class="page-title">내 자산 대시보드</h1>

    <section class="metrics-grid">
        {#each metrics as metric}
            <div class="card metric-card">
                <div class="card-header">
                    <span class="metric-title">{metric.title}</span>
                </div>
                <div class="card-body">
                    <span class="metric-value">{metric.value}</span>

                    {#if metric.isProgress}
                        <div class="progress-container">
                            <div class="progress-bar" style="width: {metric.value}"></div>
                        </div>
                    {:else}
                        <span class="metric-change positive">{metric.change}</span>
                    {/if}
                </div>
            </div>
        {/each}
    </section>

    <section class="assets-section">
        <h2 class="section-title">보유 자산 요약</h2>
        <div class="assets-grid">
            {#each assets as asset}
                <div class="asset-card" style="background-image: url('{asset.image}')">
                    <div class="asset-overlay">
                        <h3>{asset.type}</h3>
                        <p>{asset.count} / 총 가치 : {asset.totalValue}</p>
                    </div>
                </div>
            {/each}
        </div>
    </section>

    <section class="bottom-grid">
        <div class="card wide-card recommendation">
            <div class="img-wrapper">
                <img src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=400&auto=format&fit=crop" alt="Watch">
            </div>
            <div class="content-wrapper">
                <h3>새로운 럭셔리 아이템 추천</h3>
                <p>한정판 '크로노스 옵시디언' 시계가 입고 되었습니다.</p>
                <button class="btn btn-primary">상세 정보 보기</button>
            </div>
        </div>

        <div class="card wide-card auction">
            <div class="img-wrapper">
                <img src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=400&auto=format&fit=crop" alt="Watch">
            </div>
            <div class="content-wrapper">
                <h3>진행 중인 경매</h3>
                <p>프라이빗 섬 '라구나 아일랜드' 경매가 곧 마감됩니다.</p>
                <button class="btn btn-warning">상세 정보 보기</button>
            </div>
        </div>
    </section>
</div>

<style>
    /* 기본 레이아웃 및 폰트 설정 */
    .dashboard-content {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #333;
        width: 100%;
    }

    .page-title {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 1.5rem;
    }

    .section-title {
        font-size: 1.7rem;
        font-weight: 700;
        margin: 2rem 0 1rem 0;
    }

    /* 카드 공통 스타일 */
    .card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }

    /* 1. 상단 지표 그리드 */
    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
    }

    .metric-title {
        color: #666;
        font-size: 0.95rem;
        display: block;
        margin-bottom: 0.5rem;
    }

    .metric-value {
        font-size: 2rem;
        font-weight: 800;
        display: block;
        margin-bottom: 0.5rem;
    }

    .metric-change {
        font-size: 1rem;
        font-weight: 600;
    }

    .metric-change.positive {
        color: #2ecc71; /* 녹색 */
    }

    /* 프로그레스 바 스타일 */
    .progress-container {
        background-color: #f3f4f6;
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
        margin-top: 10px;
    }

    .progress-bar {
        background-color: #0047AB; /* 짙은 파란색 */
        height: 100%;
        border-radius: 4px;
    }

    /* 2. 자산 그리드 (이미지 카드) */
    .assets-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
    }

    .asset-card {
        aspect-ratio: 240 / 290;
        border-radius: 12px;
        background-size: cover;
        background-position: center;
        position: relative;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .asset-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.2);
        pointer-events: none;
    }

    .asset-card:hover {
        transform: translateY(-5px);
    }

    /* 이미지 위 텍스트 오버레이 (그라데이션 처리) */
    .asset-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
        padding: 2rem 1.5rem 1.5rem 1.5rem;
        color: white;
    }

    .asset-overlay h3 {
        margin: 0 0 5px 0;
        font-size: 1.5rem;
        font-weight: 700;
    }

    .asset-overlay p {
        margin: 0;
        font-size: 1rem;
    }

    /* 3. 하단 그리드 (추천/경매) */
    .bottom-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin-top: 2rem;
    }

    .wide-card {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 1.5rem;
    }

    .img-wrapper img {
        width: 150px;
        aspect-ratio: 150 / 113;
        object-fit: cover;
        border-radius: 8px;
    }

    .content-wrapper h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        font-weight: 700;
    }

    .content-wrapper p {
        margin: 0 0 1rem 0;
        color: #666;
        font-size: 0.95rem;
        line-height: 1.4;
    }

    /* 버튼 스타일 */
    .btn {
        border: none;
        padding: 0.6rem 1.2rem;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: opacity 0.2s;
        text-align: center;
    }

    .btn:hover {
        opacity: 0.9;
    }

    .btn-primary {
        background-color: #0e4c92;
        color: white;
    }

    .btn-warning {
        background-color: #f1c40f;
        color: #2c3e50;
    }

    /* 반응형 처리 (모바일/태블릿) */
    @media (max-width: 1024px) {
        .metrics-grid, .assets-grid, .bottom-grid {
            grid-template-columns: 1fr; /* 모바일에서는 1열로 변경 */
        }

        .assets-grid {
            grid-template-columns: repeat(2, 1fr); /* 태블릿에선 자산 2열 */
        }
    }
</style>