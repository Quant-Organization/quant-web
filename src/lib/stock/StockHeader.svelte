<script lang="ts">
    const price = 100_500;
</script>

<section class="card">
    <div class="left">
        <div class="title-row">
            <span class="pill">NASDAQ</span>
            <h1>
                Samsung Inc <span>(005930)</span>
            </h1>
        </div>

        <div class="price-row">
            <strong class="price">₩{price.toLocaleString()}</strong>
            <span class="up">+1.24%</span>
            <span class="time">마지막 업데이트: 10:30 AM</span>
        </div>
    </div>

    <div class="stats">
        <div class="stat">
            <label>시가총액</label>
            <strong>710B</strong>
        </div>

        <div class="divider"></div>

        <div class="stat">
            <label>거래량</label>
            <strong>52.2M</strong>
        </div>

        <div class="divider"></div>

        <div class="stat">
            <label>PER</label>
            <strong>19.2</strong>
        </div>
    </div>
</section>



<style>
    .card {
        background: #fff;
        padding: 1.125rem 1.375rem;
        border-radius: 0.875rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 0.25rem 0.875rem rgba(18, 43, 77, 0.06);
        border: 1px solid #e5e7eb;
    }

    /* --- TITLE ROW (가로 배치) --- */
    .title-row {
        display: flex;
        align-items: center;
        gap: 0.625rem;
    }

    .pill {
        background: #f8fafc;
        color: #475569;
        padding: 0.25rem 0.625rem;
        border-radius: 999px;
        font-weight: 700;
        font-size: 0.75rem;
        border: 1px solid #e5e7eb;
    }

    h1 {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
    }

    h1 span {
        color: #94a3b8;
        font-size: 0.875rem;
        font-weight: 500;
    }

    /* --- PRICE ROW --- */
    .price-row {
        margin-top: 0.625rem;
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
    }

    .price {
        font-size: 1.875rem;
        font-weight: 800;
        letter-spacing: -0.3px;
    }

    .up {
        background: #dcfce7;
        color: #166534;
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
        font-size: 0.8125rem;
        font-weight: 700;
    }

    .time {
        margin-left: 0.375rem;
        font-size: 0.8125rem;
        color: #94a3b8;
        white-space: nowrap;
    }

    /* --- STATS WITH DIVIDER --- */
    .stats {
        display: flex;
        align-items: center;
    }

    .stat {
        padding: 0 1.125rem;
        text-align: center;
    }

    .stat label {
        font-size: 0.75rem;
        color: #94a3b8;
    }

    .stat strong {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.9375rem;
        font-weight: 700;
        color: #0f172a;
    }

    /* 세로 구분선 */
    .divider {
        width: 1px;
        height: 2.125rem;
        background: #e5e7eb;
    }


</style>
