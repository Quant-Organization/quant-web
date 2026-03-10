<script lang="ts">
    import { onMount } from 'svelte';

    let { url, class: className = '' }: { url: string; class?: string } = $props();

    let canvas: HTMLCanvasElement;
    let loaded = $state(false);
    let error = $state(false);

    onMount(async () => {
        try {
            const { Application } = await import('@splinetool/runtime');
            const app = new Application(canvas);
            await app.load(url);
            loaded = true;

            return () => {
                app.dispose();
            };
        } catch {
            error = true;
        }
    });
</script>

<div class="spline-container {className}">
    {#if !loaded && !error}
        <div class="spline-loader">
            <div class="spinner"></div>
        </div>
    {/if}
    {#if error}
        <div class="spline-fallback">
            <div class="fallback-orb orb-1"></div>
            <div class="fallback-orb orb-2"></div>
            <div class="fallback-orb orb-3"></div>
        </div>
    {/if}
    <canvas bind:this={canvas} class:visible={loaded}></canvas>
</div>

<style>
    .spline-container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: inherit;
    }

    canvas {
        width: 100%;
        height: 100%;
        display: block;
        opacity: 0;
        transition: opacity 0.6s ease;
    }

    canvas.visible {
        opacity: 1;
    }

    .spline-loader {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #0a1628 0%, #0f2847 50%, #0a1628 100%);
    }

    .spinner {
        width: 2rem;
        height: 2rem;
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-top-color: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .spline-fallback {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, #0a1628 0%, #0f2847 50%, #0a1628 100%);
        overflow: hidden;
    }

    .fallback-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(60px);
        animation: float 8s ease-in-out infinite;
    }

    .orb-1 {
        width: 12rem;
        height: 12rem;
        background: rgba(0, 82, 155, 0.4);
        top: 10%;
        left: 20%;
        animation-delay: 0s;
    }

    .orb-2 {
        width: 8rem;
        height: 8rem;
        background: rgba(16, 185, 129, 0.3);
        top: 40%;
        right: 25%;
        animation-delay: -3s;
    }

    .orb-3 {
        width: 10rem;
        height: 10rem;
        background: rgba(99, 102, 241, 0.3);
        bottom: 10%;
        left: 40%;
        animation-delay: -5s;
    }

    @keyframes float {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(20px, -20px) scale(1.1); }
        66% { transform: translate(-15px, 15px) scale(0.95); }
    }
</style>
