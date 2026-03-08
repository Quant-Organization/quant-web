<script lang="ts">
    let { width = '100%', height = '1rem', radius = '0.5rem', style = '' } = $props();
</script>

<div
    class="skeleton"
    style="width: {width}; height: {height}; border-radius: {radius}; {style}"
></div>

<style>
    .skeleton {
        background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite ease-in-out;
    }

    @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
</style>
