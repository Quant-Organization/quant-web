<script>
    import {goto} from '$app/navigation';
    import auction_background from '$lib/images/auction_background.png';

    // 상단 요약 데이터
    const stats = [
        {label: '컬렉션 현황', value: '5개'},
        {label: '총 자산 가치', value: '$550M'}
    ];

    // 경매 예정 작품 데이터
    const upcomingAuctions = [
        {
            title: 'Portrait of Abraham Belters',
            date: '2025-11-15 18:00',
            price: '$2,000,000',
            image: 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?q=80&w=400&auto=format&fit=crop' // 회화 예시
        },
        {
            title: 'Ferrari 250 GTO',
            date: '2025-11-18 18:00',
            price: '$25,000,000',
            image: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?q=80&w=400&auto=format&fit=crop' // 레드 스포츠카
        },
        {
            title: 'Moissanite',
            date: '2025-11-20 18:00',
            price: '$10,000,000',
            image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=400&auto=format&fit=crop' // 다이아몬드/보석
        },
        {
            title: 'Patek Philippe Grand Complica...',
            date: '2025-11-25 12:00',
            price: '$15,000,000',
            image: 'https://images.unsplash.com/photo-1547996111-f7cb39e3d039?q=80&w=400&auto=format&fit=crop' // 고급 시계
        }
    ];

    function goToAuction() {
        goto(`/auction`);
    }
</script>

<div class="collection-container">
    <header class="header">
        <div class="title-area">
            <h1>럭셔리 컬렉션</h1>
            <p class="subtitle">최고급 미술품을 관리하고 새로운 미술품을 획득하세요.</p>
        </div>
        <div class="stats-area">
            {#each stats as stat}
                <div class="stat-card">
                    <span class="stat-label">{stat.label}</span>
                    <span class="stat-value">{stat.value}</span>
                </div>
            {/each}
        </div>
    </header>

    <section class="hero-banner" style="background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url({auction_background});">
        <div class="hero-content"
             role="button"
             tabindex="0"
             onclick={() => goToAuction()}>
            <h2>예술품 경매 <span class="arrow">›</span></h2>
            <p>세계에서 가장 희귀한 예술품을 획득할 수 있는 기회입니다.<br/>지금 경매에 참여하여 컬렉션의 가치를 높이세요.</p>
        </div>
    </section>

    <section class="auction-section">
        <h2 class="section-title">예정된 경매 작품들</h2>
        <div class="auction-grid">
            {#each upcomingAuctions as item}
                <div
                        class="auction-card"
                        role="button"
                        tabindex="0"
                >
                    <div class="image-box">
                        <img src={item.image} alt={item.title}/>
                    </div>
                    <div class="info-box">
                        <h3 class="item-title">{item.title}</h3>
                        <p class="item-date">경매 시작 : {item.date}</p>
                        <p class="item-price">예상 시작가 : <span class="price-val">{item.price}</span></p>
                    </div>
                </div>
            {/each}
        </div>
    </section>
</div>

<style>
    .collection-container {
        max-width: 100%;
        font-family: 'Pretendard', -apple-system, sans-serif;
    }

    /* 헤더 및 스탯 */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
    }

    .title-area h1 {
        font-size: 2rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
    }

    .subtitle {
        color: #888;
        font-size: 1rem;
    }

    .stats-area {
        display: flex;
        gap: 1rem;
    }

    .stat-card {
        background: white;
        border: 1px solid #eee;
        padding: 1rem 2rem;
        border-radius: 12px;
        min-width: 140px;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .stat-label {
        font-size: 0.9rem;
        color: #666;
    }

    .stat-value {
        font-size: 1.8rem;
        font-weight: 800;
    }

    /* 히어로 배너 */
    .hero-banner {
        width: 100%;
        height: 250px;
        background-size: cover;
        background-position: center;
        border-radius: 16px;
        display: flex;
        align-items: center;
        padding: 0 4rem;
        margin-bottom: 3rem;
        color: white;
    }

    .hero-content h2 {
        font-size: 2.5rem;
        margin: 0 0 1rem 0;
        cursor: pointer;
    }

    .hero-content p {
        font-size: 1.1rem;
        line-height: 1.6;
        opacity: 0.9;
    }

    /* 경매 리스트 */
    .section-title {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 1.5rem;
    }

    .auction-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
    }

    .auction-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        transition: transform 0.2s;
        border: 1px solid #eee;
        padding: 1rem;
        cursor: pointer;
    }

    .auction-card:hover {
        transform: translateY(-5px);
    }

    .image-box {
        width: 100%;
        aspect-ratio: 1 / 1;
        overflow: hidden;
        border-radius: 8px;
        margin-bottom: 1rem;
    }

    .image-box img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .info-box {
        padding: 0;
    }

    .item-title {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 0.8rem 0;
        color: #333;
    }

    .item-date, .item-price {
        font-size: 0.85rem;
        color: #999;
        margin: 0.3rem 0;
    }

    .price-val {
        color: #b8860b; /* 금색 계열로 포인트 */
        font-weight: 700;
    }
</style>