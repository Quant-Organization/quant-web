<script lang="ts">
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';
    import { getHistory } from '$lib/api/market';
    import type { CandleData } from '$lib/api/market';

    interface Props {
        selectedCompanyId: string;
    }

    let { selectedCompanyId }: Props = $props();

    let canvas: HTMLCanvasElement;
    let chart: Chart | undefined;
    let timeframe = $state('30m');

    const intervalMap: Record<string, number> = {
        '10m': 10,
        '30m': 30,
        '1h': 60,
        '4h': 240,
        '1d': 1440,
        '1w': 10080,
    };

    const limitMap: Record<string, number> = {
        '10m': 60,
        '30m': 60,
        '1h': 60,
        '4h': 60,
        '1d': 60,
        '1w': 52,
    };

    async function loadAndDraw() {
        if (!selectedCompanyId || !canvas) return;

        const interval = intervalMap[timeframe] ?? 30;
        const limit = limitMap[timeframe] ?? 60;

        let candles: CandleData[] = [];
        try {
            candles = await getHistory(selectedCompanyId, limit, interval);
        } catch (e) {
            console.error('차트 데이터 로드 실패:', e);
        }

        chart?.destroy();

        const labels = candles.map(c => {
            const d = new Date(c.timestamp);
            return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        });
        const closes = candles.map(c => c.close);

        const isUp = closes.length > 1 && closes[closes.length - 1] >= closes[0];
        const lineColor = isUp ? '#22c55e' : '#ef4444';

        chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data: closes,
                    borderColor: lineColor,
                    borderWidth: 2,
                    tension: 0.25,
                    pointRadius: 0,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: ctx => `₩${Number(ctx.raw).toLocaleString()}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#e5e7eb', maxTicksLimit: 8 }
                    },
                    y: {
                        position: 'right',
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        ticks: {
                            color: '#e5e7eb',
                            callback: (val) => `₩${Number(val).toLocaleString()}`
                        }
                    }
                }
            }
        });
    }

    onMount(() => {
        loadAndDraw();
    });

    $effect(() => {
        // re-fetch when company or timeframe changes
        const _ = selectedCompanyId;
        const __ = timeframe;
        loadAndDraw();
    });
</script>

<section class="card">
    <div class="toolbar">
        <div class="left-section">
            <div class="buttons">
                {#each ['10m','30m','1h','4h','1d','1w'] as t}
                    <button class:active={timeframe===t} onclick={() => timeframe=t}>{t}</button>
                {/each}
            </div>
            <span class="indicators">indicators</span>
        </div>
    </div>

    <div class="chart">
        <canvas bind:this={canvas}></canvas>
    </div>
</section>

<style>
    .card {
        background: #ffffff;
        border-radius: 0.875rem;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        box-shadow: 0 6px 4px rgba(0,0,0,0.05);
    }

    /* TOOLBAR */
    .toolbar {
        display: flex;
        align-items: center;
        padding: 0.75rem 0.875rem;
        background: #ffffff;
    }

    .left-section {
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }

    .buttons {
        display: flex;
        gap: 0.875rem;
    }

    button {
        border: none;
        background: none;
        padding: 0.25rem 0;
        font-weight: 600;
        font-size: 0.8125rem;
        color: #64748b;
        cursor: pointer;
        position: relative;
    }

    button.active {
        color: #3b82f6;
    }

    button.active::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: -0.375rem;
        height: 2px;
        background: #3b82f6;
        border-radius: 2px;
    }

    /* indicators */
    .indicators {
        color: #64748b;
        font-size: 0.8125rem;
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }

    /* CHART */
    .chart {
        height: 22.5rem;
        background: #0a0a0a;
    }
</style>
