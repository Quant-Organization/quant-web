<script lang="ts">
    import { getNews } from '$lib/api/market';
    import type { NewsItem } from '$lib/api/market';

    interface Props {
        selectedCompanyId: string;
    }

    let { selectedCompanyId }: Props = $props();

    let newsItems = $state<NewsItem[]>([]);
    let loading = $state(false);
    let activeTab = $state<'recent' | 'major'>('recent');

    $effect(() => {
        if (!selectedCompanyId) return;
        loading = true;
        newsItems = [];
        getNews(selectedCompanyId)
            .then(items => { newsItems = items; })
            .catch(e => console.error('뉴스 로드 실패:', e))
            .finally(() => { loading = false; });
    });

    let displayed = $derived(
        activeTab === 'major'
            ? newsItems.filter(n => n.impact === 'high' || n.impact === 'major')
            : newsItems
    );

    function formatTime(created_at: string) {
        try {
            const d = new Date(created_at);
            const diff = Math.floor((Date.now() - d.getTime()) / 60000);
            if (diff < 60) return `${diff}분 전`;
            if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
            return `${Math.floor(diff / 1440)}일 전`;
        } catch {
            return created_at;
        }
    }

    function impactColor(impact: string) {
        if (impact === 'positive') return '#166534';
        if (impact === 'negative') return '#991b1b';
        return '#64748b';
    }
</script>

<section class="row">
    <div class="news">
        <div class="list">
            <div class="tabs">
                <button
                    class:active={activeTab === 'recent'}
                    onclick={() => activeTab = 'recent'}
                >최근</button>
                <button
                    class:active={activeTab === 'major'}
                    onclick={() => activeTab = 'major'}
                >주요 뉴스</button>
            </div>

            {#if loading}
                <p class="status-msg">뉴스 로딩 중...</p>
            {:else if displayed.length === 0}
                <p class="status-msg">표시할 뉴스가 없습니다.</p>
            {:else}
                {#each displayed as item (item.id)}
                    <article>
                        <h3>{item.title}</h3>
                        <h2>{item.content}</h2>
                        <p>
                            <span class="impact" style="color: {impactColor(item.impact)}">
                                {item.impact === 'positive' ? '긍정' : item.impact === 'negative' ? '부정' : '중립'}
                            </span>
                            · {formatTime(item.created_at)}
                        </p>
                    </article>
                {/each}
            {/if}
        </div>
    </div>
</section>

<style>
    .row {
        display: flex;
        gap: 1.25rem;
    }

    .news {
        flex: 1;
    }

    .tabs {
        margin-bottom: 0.625rem;
    }

    .tabs button {
        border-radius: 1rem;
        padding: 0.375rem 0.75rem;
        font-weight: 700;
        border: none;
        margin-right: 0.375rem;
        cursor: pointer;
        background: transparent;
        color: #64748b;
    }

    .tabs .active {
        background: #eef6ff;
        color: #2563eb;
    }

    .list {
        background: #fff;
        padding: 0.875rem;
        border-radius: 0.75rem;
        box-shadow: 0 6px 4px rgba(0,0,0,0.05);
        border: 1px solid #e5e7eb;
    }

    article {
        padding: 0.625rem 0;
        border-bottom: 1px solid #f1f5f9;
    }

    article:last-child {
        border-bottom: none;
    }

    p {
        font-size: 0.8125rem;
        color: var(--color-text-gray);
        margin: 0;
    }

    h2 {
        font-size: 1rem;
        font-weight: 400;
        color: var(--color-text-gray);
        margin-bottom: 0.5rem;
    }

    h3 {
        font-size: 0.9375rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 0.25rem 0;
    }

    .impact {
        font-weight: 600;
    }

    .status-msg {
        font-size: 0.875rem;
        color: #94a3b8;
        padding: 0.5rem 0;
    }
</style>
