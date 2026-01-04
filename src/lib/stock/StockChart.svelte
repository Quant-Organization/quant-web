<script lang="ts">
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    let canvas: HTMLCanvasElement;
    let chart: Chart;
    let timeframe = '30m';

    function makeData() {
        let price = 68000;
        return Array.from({ length: 60 }, (_, i) => {
            price += (Math.random() - 0.48) * 1200;
            return { x: i, y: price };
        });
    }

    function draw() {
        chart?.destroy();

        chart = new Chart(canvas, {
            type: 'line',
            data: {
                datasets: [{
                    data: makeData(),
                    borderColor: '#22c55e',
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
                    tooltip: { enabled: false }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255,255,255,0.05)'
                        },
                        ticks: {
                            color: '#e5e7eb'
                        }
                    },
                    y: {
                        position: 'right',
                        grid: {
                            color: 'rgba(255,255,255,0.06)'
                        },
                        ticks: {
                            color: '#e5e7eb'
                        }
                    }
                }
            }
        });
    }

    onMount(draw);
    $: timeframe, draw();
</script>


<section class="card">
    <div class="toolbar">
        <div class="left-section">
            <div class="buttons">
                {#each ['10m','30m','1h','4h','1d','1w'] as t}
                    <button class:active={timeframe===t} on:click={() => timeframe=t}>{t}</button>
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