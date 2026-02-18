<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    onMount(() => {
        goto('/asset/vehicles');
    });
</script>

<p>이동 중...</p>
