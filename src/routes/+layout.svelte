<script lang="ts">
	import '../app.css';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<main class="min-h-screen bg-background">
	{@render children?.()}
</main>

<Footer />
