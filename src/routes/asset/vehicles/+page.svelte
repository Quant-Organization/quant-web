<script>
    // 1. 좌측: 보유 차량 리스트 데이터
    const myCars = [
        { name: '그랜저', price: '$2,500,000', img: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=150&q=80' },
        { name: '팰리세이드', price: '$1,300,000', img: 'https://images.unsplash.com/photo-1533473359331-0135ef1bcfb0?auto=format&fit=crop&w=150&q=80' },
        { name: '제네시스 G90', price: '$11,900,000', img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=150&q=80' }
    ];

    // 2. 중앙: 현재 선택된 차량 상세 데이터 (페라리 F8 예시)
    let selectedCar = {
        name: '페라리 F8',
        currentPrice: '$850,000,000',
        img: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=800&q=80', // 붉은 스포츠카 이미지
        stats: {
            speed: '300km/h',
            fame: '95',
            maintenance: '$500,000'
        },
        colors: ['#3b82f6', '#fbbf24', '#10b981'] // 파랑, 노랑, 초록
    };

    let selectedColorIndex = 0; // 선택된 색상 인덱스 (기본값)

    // 3. 우측: 딜러샵 판매 목록 데이터
    const dealershipCars = [
        {
            name: '람보르기니 아벤타도르',
            price: '$13,500,000',
            levelReq: 15,
            img: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&w=400&q=80'
        },
        {
            name: '페라리 F8',
            price: '$850,000,000',
            levelReq: 15,
            img: 'https://images.unsplash.com/photo-1583121274602-3e2820c698d9?auto=format&fit=crop&w=400&q=80'
        }
    ];
</script>

<div class="car-collection-container">

    <header class="page-header">
        <div class="header-text">
            <h1>차량 컬렉션</h1>
            <p>최고급 차량을 관리하고 새로운 차량을 획득하세요.</p>
        </div>
        <div class="stats-cards">
            <div class="stat-card">
                <span class="stat-label">차고 현황</span>
                <span class="stat-value">5 / 20</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">총 자산 가치</span>
                <span class="stat-value">$12,500,000</span>
            </div>
        </div>
    </header>

    <main class="main-grid">

        <section class="left-section">
            <h3 class="section-title">보유 차량</h3>
            <div class="panel left-panel">
                <div class="car-list">
                    {#each myCars as car}
                        <div class="list-item">
                            <img src={car.img} alt={car.name} class="thumb">
                            <div class="info">
                                <span class="name">{car.name}</span>
                                <span class="price">{car.price}</span>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </section>

        <section class="center-section">
            <div class="panel center-top-panel">
                <div class="car-preview">
                    <div class="preview-image" style="background-image: url('{selectedCar.img}');"></div>
                </div>

                <div class="car-header-info">
                    <h2>{selectedCar.name}</h2>
                    <span class="current-price">현재가: {selectedCar.currentPrice}</span>
                </div>
            </div>

            <div class="panel center-bottom-panel">
                <div class="stats-row">
                    <div class="stat-item">
                        <strong>{selectedCar.stats.speed}</strong>
                        <span>최고 속도</span>
                    </div>
                    <div class="stat-item">
                        <strong>{selectedCar.stats.fame}</strong>
                        <span>명성</span>
                    </div>
                    <div class="stat-item">
                        <strong>{selectedCar.stats.maintenance}</strong>
                        <span>유지비/일</span>
                    </div>
                </div>

                <div class="custom-options">
                    <div class="tabs">
                        <button class="active">색상</button>
                        <button>내장</button>
                    </div>
                    <div class="color-picker">
                        {#each selectedCar.colors as color, i}
                            <button
                                    class="color-circle {selectedColorIndex === i ? 'selected' : ''}"
                                    style="background-color: {color};"
                                    on:click={() => selectedColorIndex = i}
                            ></button>
                        {/each}
                    </div>
                </div>

                <button class="btn-purchase">구매하기</button>
            </div>
        </section>

        <section class="right-section">
            <h3 class="section-title">럭셔리 딜러샵</h3>
            <div class="filters">
                <select><option>럭셔리 딜러샵</option></select>
                <select><option>모든 브랜드</option></select>
            </div>

            <div class="panel right-panel">
                <div class="shop-list">
                    {#each dealershipCars as car}
                        <div class="shop-item">
                            <div class="shop-img" style="background-image: url('{car.img}')"></div>
                            <div class="shop-info">
                                <div class="shop-row">
                                    <span class="shop-name">{car.name}</span>
                                    <span class="shop-price accent">{car.price}</span>
                                </div>
                                <div class="shop-row sub">
                                    <span>필요 레벨: {car.levelReq}</span>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </section>

    </main>
</div>

<style>
    /* 컨테이너 및 폰트 설정 */
    .car-collection-container {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #333;
        width: 100%;
    }

    /* 상단 헤더 영역 */
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 2rem;
    }

    .header-text h1 {
        font-size: 2.2rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
    }
    .header-text p {
        font-size: 1.2rem;
        color: var(--color-text-gray);
        margin: 0;
    }

    .stats-cards {
        display: flex;
        gap: 1rem;
    }

    .stat-card {
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        min-width: 140px;
    }

    .stat-label {
        display: block;
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
    }

    .stat-value {
        display: block;
        font-size: 1.4rem;
        font-weight: 700;
    }

    /* 메인 그리드 레이아웃 (좌:중:우 = 250:390:250 비율) */
    .main-grid {
        display: grid;
        grid-template-columns: 250fr 390fr 250fr;
        gap: 1.5rem;
        align-items: start;
    }

    /* 섹션 타이틀 (카드 바깥) */
    .section-title {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
        font-weight: 700;
    }

    /* 공통 패널 스타일 */
    .panel {
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        padding: 1.5rem;
    }

    /* 1. 좌측 패널 (보유 차량 리스트) */
    .left-section {
        display: flex;
        flex-direction: column;
    }

    .left-panel {
        height: 100%;
    }

    .list-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
        cursor: pointer;
        transition: opacity 0.2s;
    }
    .list-item:hover { opacity: 0.7; }

    .list-item .thumb {
        width: 80px;
        height: 80px;
        border-radius: 10px;
        object-fit: cover;
        background: #f3f4f6;
    }

    .list-item .info {
        display: flex;
        flex-direction: column;
    }

    .list-item .name { font-weight: 700; font-size: 1.1rem; }
    .list-item .price { color: #666; font-size: 1rem; margin-top: 4px; }


    /* 2. 중앙 패널 (상세 보기) */
    .center-section {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .center-top-panel {
        padding: 1.5rem;
    }

    .preview-image {
        width: 100%;
        aspect-ratio: 1 / 1;
        background-color: #f3f4f6;
        background-size: cover;
        background-position: center;
        border-radius: 12px;
        position: relative;
        margin-bottom: 1.5rem;
    }

    .car-header-info {
        text-align: left;
    }

    .car-header-info h2 { margin: 0 0 0.5rem 0; font-size: 2rem; }
    .current-price { color: var(--color-text-gray); font-weight: 600; font-size: 1.2rem; }

    .center-bottom-panel {
        padding: 1.5rem;
    }

    .stats-row {
        display: flex;
        justify-content: space-around;
        text-align: center;
        margin-bottom: 2rem;
        padding: 1rem 0;
        background: #f9fafb;
        border-radius: 8px;
    }

    .stat-item strong { display: block; font-size: 1.2rem; color: #0e4c92; }
    .stat-item span { font-size: 0.8rem; color: #888; margin-top: 4px; display: block;}

    .custom-options {
        margin-bottom: 2rem;
    }

    .tabs {
        border-bottom: 1px solid #ddd;
        margin-bottom: 1rem;
        display: flex;
        gap: 1.5rem;
    }

    .tabs button {
        background: none;
        border: none;
        padding: 0.5rem 0;
        font-size: 0.95rem;
        color: #888;
        cursor: pointer;
        position: relative;
    }

    .tabs button.active {
        color: #0e4c92;
        font-weight: 700;
    }

    .tabs button.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 100%;
        height: 2px;
        background: #0e4c92;
    }

    .color-picker {
        display: flex;
        gap: 1rem;
    }

    .color-circle {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .color-circle:hover { transform: scale(1.1); }
    .color-circle.selected { border-color: #0e4c92; box-shadow: 0 0 0 2px white inset; }

    .btn-purchase {
        width: 100%;
        background: #0e4c92;
        color: white;
        border: none;
        padding: 1rem;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
    }
    .btn-purchase:hover { background: #0b3d75; }


    /* 3. 우측 패널 (딜러샵) */
    .right-section {
        display: flex;
        flex-direction: column;
    }

    .filters {
        display: flex;
        gap: 1.4rem;
        margin-bottom: 1rem;
    }

    .filters select {
        flex: 1;
        padding: 1rem 0.5rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.85rem;
        color: #555;
    }

    .right-panel {
        height: 100%;
    }

    .shop-item {
        margin-bottom: 1.5rem;
    }

    .shop-img {
        width: 100%;
        aspect-ratio: 250 / 140;
        background-size: cover;
        background-position: center;
        border-radius: 8px;
        margin-bottom: 0.75rem;
    }

    .shop-info {
        padding: 0;
    }

    .shop-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.25rem;
    }

    .shop-name { font-weight: 700; font-size: 1.2rem; }
    .shop-price { font-weight: 700; font-size: 1.2rem; }
    .shop-price.accent { color: #0e4c92; }

    .shop-row.sub {
        font-size: 0.9rem;
        color: var(--color-text-gray);
    }

    /* 반응형 처리 */
    @media (max-width: 1200px) {
        .main-grid {
            grid-template-columns: 1fr 1fr; /* 중간 사이즈에선 2열 */
        }
        .right-panel {
            grid-column: span 2; /* 딜러샵을 아래로 내림 */
        }
    }

    @media (max-width: 768px) {
        .main-grid {
            grid-template-columns: 1fr; /* 모바일 1열 */
        }
        .right-panel { grid-column: auto; }
        .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
    }
</style>