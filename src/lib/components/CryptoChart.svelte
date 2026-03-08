<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { createChart, CandlestickSeries, HistogramSeries, type IChartApi, type ISeriesApi, type CandlestickData, type HistogramData, ColorType } from 'lightweight-charts';
    import { getCryptoHistory } from '$lib/api/crypto';
    import type { CryptoCandle } from '$lib/api/crypto';

    interface Props {
        selectedCryptoId: string;
        onPriceUpdate?: (price: number) => void;
    }

    let { selectedCryptoId, onPriceUpdate }: Props = $props();

    let container: HTMLDivElement;
    let chart: IChartApi | undefined;
    let candleSeriesApi: ISeriesApi<'Candlestick'> | undefined;
    let volumeSeriesApi: ISeriesApi<'Histogram'> | undefined;
    let timeframe = $state('1일');
    let refreshId: ReturnType<typeof setInterval> | undefined;

    const intervalMap: Record<string, number> = {
        '1일': 10, '5일': 60, '1개월': 360, '6개월': 1440, '1년': 1440, '5년': 1440,
    };
    const limitMap: Record<string, number> = {
        '1일': 144, '5일': 120, '1개월': 120, '6개월': 180, '1년': 365, '5년': 1825,
    };

    function toChartData(candles: CryptoCandle[]) {
        const candleData: CandlestickData[] = candles.map(c => ({
            time: c.time as any,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
        }));
        const volData: HistogramData[] = candles.map(c => ({
            time: c.time as any,
            value: c.volume,
            color: c.close >= c.open ? 'rgba(38,166,154,0.3)' : 'rgba(239,83,80,0.3)',
        }));
        return { candleData, volData };
    }

    function initChart() {
        if (!container) return;
        chart?.remove();

        chart = createChart(container, {
            layout: {
                background: { type: ColorType.Solid, color: '#0a0a0a' },
                textColor: '#9ca3af',
            },
            grid: {
                vertLines: { color: 'rgba(255,255,255,0.04)' },
                horzLines: { color: 'rgba(255,255,255,0.04)' },
            },
            crosshair: { mode: 0 },
            rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
            timeScale: {
                borderColor: 'rgba(255,255,255,0.1)',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        candleSeriesApi = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderDownColor: '#ef5350',
            borderUpColor: '#26a69a',
            wickDownColor: '#ef5350',
            wickUpColor: '#26a69a',
        });

        volumeSeriesApi = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        });

        chart.priceScale('volume').applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        });
    }

    async function loadData() {
        if (!selectedCryptoId || !candleSeriesApi || !volumeSeriesApi) return;

        const interval = intervalMap[timeframe] ?? 10;
        const limit = limitMap[timeframe] ?? 144;

        try {
            const candles = await getCryptoHistory(selectedCryptoId, limit, interval);
            const { candleData, volData } = toChartData(candles);
            candleSeriesApi.setData(candleData);
            volumeSeriesApi.setData(volData);
            chart?.timeScale().fitContent();

            if (candles.length > 0) {
                onPriceUpdate?.(candles[candles.length - 1].close);
            }
        } catch (e) {
            console.error('차트 데이터 로드 실패:', e);
        }
    }

    async function updateLatest() {
        if (!selectedCryptoId || !candleSeriesApi || !volumeSeriesApi) return;

        const chartInterval = intervalMap[timeframe] ?? 10;
        try {
            const candles = await getCryptoHistory(selectedCryptoId, 2, chartInterval);
            if (candles.length === 0) return;

            const latest = candles[candles.length - 1];
            candleSeriesApi.update({
                time: latest.time as any,
                open: latest.open,
                high: latest.high,
                low: latest.low,
                close: latest.close,
            });
            volumeSeriesApi.update({
                time: latest.time as any,
                value: latest.volume,
                color: latest.close >= latest.open ? 'rgba(38,166,154,0.3)' : 'rgba(239,83,80,0.3)',
            });

            const priceCandles = await getCryptoHistory(selectedCryptoId, 1, 1);
            if (priceCandles.length > 0) {
                onPriceUpdate?.(priceCandles[0].close);
            }
        } catch { /* ignore */ }
    }

    function startRefresh() {
        stopRefresh();
        refreshId = setInterval(updateLatest, 5000);
    }

    function stopRefresh() {
        if (refreshId) { clearInterval(refreshId); refreshId = undefined; }
    }

    function handleResize() {
        if (chart && container) {
            chart.applyOptions({ width: container.clientWidth });
        }
    }

    onMount(() => {
        initChart();
        loadData().then(startRefresh);
        window.addEventListener('resize', handleResize);
    });

    onDestroy(() => {
        stopRefresh();
        chart?.remove();
        window.removeEventListener('resize', handleResize);
    });

    $effect(() => {
        const _id = selectedCryptoId;
        const _tf = timeframe;
        if (chart) {
            loadData().then(startRefresh);
        }
    });
</script>

<section class="card">
    <div class="toolbar">
        <div class="buttons">
            {#each ['1일','5일','1개월','6개월','1년','5년'] as t}
                <button class:active={timeframe===t} onclick={() => timeframe=t}>{t}</button>
            {/each}
        </div>
    </div>
    <div class="chart-wrap" bind:this={container}></div>
</section>

<style>
    .card {
        background: #ffffff;
        border-radius: 0.875rem;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        box-shadow: 0 6px 4px rgba(0,0,0,0.05);
    }

    .toolbar {
        display: flex;
        align-items: center;
        padding: 0.75rem 0.875rem;
        background: #ffffff;
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

    .chart-wrap {
        height: 22.5rem;
        background: #0a0a0a;
    }
</style>
