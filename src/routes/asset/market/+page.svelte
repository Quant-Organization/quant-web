<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    onMount(() => {
        goto('/asset/vehicles');
    });
</script>

<div style="display: flex; align-items: center; justify-content: center; min-height: 60vh; color: #666;">
    <p>이동수단 마켓이 이동되었습니다. 잠시만 기다려주세요...</p>
</div>
