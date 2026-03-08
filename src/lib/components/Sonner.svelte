<script lang="ts">
    import { Toaster as Sonner, type ToasterProps } from 'svelte-sonner';

    let { ...restProps }: ToasterProps = $props();
</script>

<Sonner
    class="toaster group"
    style="--normal-bg: #ffffff; --normal-text: #1a1a1a; --normal-border: var(--color-border, rgba(227, 233, 241, 1));"
    {...restProps}
/>
