<script lang="ts">
    import { Toaster as Sonner, type ToasterProps } from 'svelte-sonner';

    let { ...restProps }: ToasterProps = $props();
</script>

<Sonner
    class="toaster group"
    toastOptions={{
        style: 'font-family: var(--font-body, Inter, sans-serif); font-size: 0.9rem; padding: 1rem 1.25rem; border-radius: 0.75rem; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06); border: 1px solid var(--color-border, #e3e9f1); background: #fff; color: #1a1a1a;',
        descriptionStyle: 'color: rgba(100, 117, 139, 1); font-size: 0.82rem;',
    }}
    {...restProps}
/>
