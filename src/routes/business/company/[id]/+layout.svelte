<script lang="ts">
    let { children } = $props();
</script>

<div class="company-content">
    {@render children()}
</div>

<style>
    .company-content {
        min-height: 100%;
    }
</style>
