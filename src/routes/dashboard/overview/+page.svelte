
<script>
    import masterCard from '$lib/images/masterCard.svg';
    import receipt from '$lib/images/receipt.svg';
    import pointer from '$lib/images/pointer.svg';
    import pointer_clicked from '$lib/images/pointer_clicked.svg';

    let balance = $state(300000);
    let clickIncome = 5430;
    let isReceiptClicked = $state(false);
    let showIncomePopup = $state(false);
    let incomeAmount = $state(0);
    let isMouseDown = $state(false);

    function formatNumber(num) {
        return num.toLocaleString('en-US');
    }

    function formatCurrency(num) {
        return `$ ${formatNumber(num)}`;
    }

    function handleReceiptClick() {
        balance += clickIncome;
        incomeAmount = clickIncome;
        showIncomePopup = true;
        
        if (!isReceiptClicked) {
            isReceiptClicked = true;
        }
        
        setTimeout(() => {
            showIncomePopup = false;
        }, 1500);
    }

    function handleMouseDown() {
        isMouseDown = true;
    }

    function handleMouseUp() {
        isMouseDown = false;
    }
</script>

<div class="dashboard-body">
    <div class="layout-wrapper">
        <div class="left-section">
            <div class="small-cards-row">
                <div class="card small-card">
                    <h2 class="card-title">실시간 수익 현황</h2>
                    <div class="income-item">
                        <span class="label">초당 수익</span>
                        <span class="value positive">+$12,430/s</span>
                    </div>
                    <div class="income-item del-bottom-margin">
                        <span class="label">클릭당 수익</span>
                        <span class="value positive">+$5,430/s</span>
                    </div>
                </div>

                <div class="card small-card">
                    <h2 class="card-title">핵심 지표</h2>
                    <div class="metric-item">
                        <span class="label">비지니스 :</span>
                        <span class="value">12개</span>
                    </div>
                    <div class="metric-item">
                        <span class="label">투자 수익률 :</span>
                        <span class="value positive">+5.2%</span>
                    </div>
                    <div class="metric-item del-bottom-margin">
                        <span class="label">부동산 :</span>
                        <span class="value">7개</span>
                    </div>
                </div>
            </div>

            <div class="account-cards-wrapper">
                <div class="account-card account-card-back">
                    <div class="card-type-badge">Silver</div>
                </div>
                <div class="account-card account-card-front">
                    <div class="card-header-row">
                        <div class="account-info">
                            <img src={masterCard} alt="mastercard" class="mastercard-icon" />
                            <span class="account-number">**** 7439</span>
                        </div>
                        <span class="account-date">05/26</span>
                    </div>
                    <div class="card-balance-section">
                        <span class="balance-label">잔고:</span>
                        <span class="balance-value">{formatCurrency(balance)}</span>
                    </div>
                </div>
                <div 
                    class="receipt-wrapper" 
                    onclick={handleReceiptClick}
                    onmousedown={handleMouseDown}
                    onmouseup={handleMouseUp}
                    onmouseleave={handleMouseUp}
                >
                    <img 
                        src={receipt} 
                        alt="receipt" 
                        class="receipt-icon"
                        draggable="false"
                    />
                    <img 
                        src={isMouseDown ? pointer_clicked : pointer} 
                        alt="pointer" 
                        class="pointer-icon"
                        class:pulse={!isReceiptClicked}
                        draggable="false"
                    />
                    {#if showIncomePopup}
                        <div class="income-popup">
                            +{formatCurrency(incomeAmount)}
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <div class="right-section">
            <div class="card asset-card">
                <div class="card-header">
                    <h2 class="card-title">자산 현황</h2>
                    <button class="view-all">모두 보기</button>
                </div>
                <div class="asset-row">
                    <div class="asset-column">
                        <span class="label">총 자산</span>
                        <span class="value">$1.85B</span>
                    </div>
                    <div class="asset-column">
                        <span class="label-sub">투자 수익</span>
                        <span class="value positive">+%25.1M <small>지난 24시간</small></span>
                    </div>
                </div>
                <div class="asset-row mt">
                    <div class="asset-column">
                        <span class="label">순위</span>
                        <span class="value">#1,204</span>
                    </div>
                    <div class="asset-column">
                        <span class="label-sub">자산 가치</span>
                        <span class="value positive">+2.1% <small>지난 7일</small></span>
                    </div>
                </div>
            </div>

            <div class="card news-card">
                <div class="card-header">
                    <h2 class="card-title">최근 뉴스 및 이벤트</h2>
                    <button class="view-all">모두 보기</button>
                </div>
                <div class="news-list">
                    <div class="news-item">
                        <div class="news-icon blue">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <rect x="4" y="4" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="news-content">
                            <div class="news-title">새로운 글로벌 이벤트: 기술 박람회</div>
                            <div class="news-time">2일 14시간 남음</div>
                        </div>
                    </div>
                    <div class="news-item">
                        <div class="news-icon red">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 3L12 8L17 9L13 13L14 18L10 15L6 18L7 13L3 9L8 8L10 3Z" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="news-content">
                            <div class="news-title">새로운 글로벌 이벤트: 기술 박람회</div>
                            <div class="news-time">2일 14시간 남음</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .layout-wrapper {
        display: grid;
        grid-template-columns: calc(66.666% + 1rem) calc(33.333% - 1rem);
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .left-section {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .small-cards-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
    }

    .right-section {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .right-section > .card {
        width: calc(100% - 2rem);
    }

    .card {
        border-radius: 0.6rem;
        padding: 1.4rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 5%);
        border: 1px solid var(--color-border);
    }

    .small-card {
        min-height: 7rem;
    }

    .asset-card {
        min-height: 13rem;
    }

    .card-title {
        font-size: 1.4rem;
        font-weight: var(--font-semiBold);
        margin-bottom: 1rem;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .view-all {
        background: none;
        border: none;
        color: var(--color-theme-1);
        font-size: 1rem;
        cursor: pointer;
        padding: 0;
    }

    .income-item, .metric-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .del-bottom-margin {
        margin-bottom: -0.2rem;
    }

    .asset-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .asset-column {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
    }

    .mt {
        margin-top: 20px;
    }

    .label {
        font-size: 1rem;
        color: var(--color-text-gray);
    }

    .label-sub {
        font-size: 1rem;
        color: var(--color-text-gray);
    }

    .value {
        font-size: 1.2rem;
        color: #1a1a1a;
    }

    .value.positive {
        font-size: 1.2rem;
        font-weight: var(--font-bold);
        color: #10b981;
    }

    .value small {
        font-size: 12px;
        color: #999;
        font-weight: 400;
    }

    .account-cards-wrapper {
        position: relative;
        min-height: 14rem;
    }

    .account-card {
        position: absolute;
        width: 100%;
        min-height: 10rem;
        border-radius: 30px;
    }

    .account-card-back {
        background: rgba(100, 117, 139, 0.5);
        top: 0;
        left: 0;
        z-index: 1;
        padding-left: 0.5rem;
    }

    .account-card-front {
        background: #222222;
        top: 2rem;
        left: 0;
        z-index: 3;
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 1rem 2rem 2rem;
        box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
    }

    .receipt-wrapper {
        position: absolute;
        top: calc(3rem + 10rem);
        left: 2rem;
        width: calc(100% - 4rem);
        height: auto;
        z-index: 1;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .account-cards-wrapper .receipt-icon {
        width: 100%;
        height: auto;
        opacity: 0.95;
        user-select: none;
        -webkit-user-drag: none;
    }

    .pointer-icon {
        position: absolute;
        width: 10rem;
        height: 10rem;
        transition: all 0.3s ease;
        user-select: none;
        -webkit-user-drag: none;
    }

    .pointer-icon.pulse {
        animation: pulsePointer 2s ease-in-out infinite;
    }

    @keyframes pulsePointer {
        0%, 100% {
            transform: scale(1);
            filter: brightness(1);
        }
        50% {
            transform: scale(1.1);
            filter: brightness(1.2);
        }
    }



    .income-popup {
        position: absolute;
        top: -3rem;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 20px;
        font-size: 1.5rem;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        animation: popupFloat 2s ease-out forwards;
        z-index: 10;
    }

    @keyframes popupFloat {
        0% {
            opacity: 0;
            transform: translateX(-50%) translateY(20px) scale(0.5);
        }
        20% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1.1);
        }
        50% {
            transform: translateX(-50%) translateY(-10px) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-40px) scale(0.8);
        }
    }

    .card-type-badge {
        background: transparent;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 1rem;
        font-weight: 600;
        color: #64758B;
        display: inline-block;
        width: fit-content;
    }

    .card-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .account-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .mastercard-icon {
        width: 2rem;
        height: 2rem;
    }

    .account-number {
        font-size: 1rem;
        letter-spacing: 2px;
        color: rgba(177, 186, 197, 0.5);
    }

    .account-date {
        font-size: 1rem;
        color: rgba(177, 186, 197, 0.5);
    }

    .card-balance-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .balance-label {
        font-size: 1.2rem;
        color: rgba(177, 186, 197, 0.5);
    }

    .balance-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: white;
        letter-spacing: -1px;
    }



    .news-card {
        max-height: 500px;
    }

    .news-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .news-item {
        display: flex;
        gap: 12px;
        align-items: flex-start;
    }

    .news-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .news-icon.blue {
        background: #dbeafe;
        color: #3b82f6;
    }

    .news-icon.red {
        background: #fee2e2;
        color: #ef4444;
    }

    .news-content {
        flex: 1;
    }

    .news-title {
        font-size: 1rem;
        font-weight: 500;
        color: #1a1a1a;
        margin-bottom: 4px;
    }

    .news-time {
        font-size: 12px;
        color: #999;
    }

    @media (max-width: 1024px) {
        .layout-wrapper {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 768px) {
        .dashboard-body {
            padding: 16px;
        }
    }
</style>