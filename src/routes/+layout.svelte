<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { settingsStore } from '$lib/settingsStore';

	let { children } = $props();

	onMount(() => {
		// Apply persisted settings to the DOM on every page navigation / hard refresh
		settingsStore.init();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
