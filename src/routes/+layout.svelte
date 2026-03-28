<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { settingsStore } from '$lib/settingsStore';
	import { migrateFromLocalStorage } from '$lib/db';

	let { children } = $props();

	onMount(async () => {
		// One-time migration of any existing localStorage data into IndexedDB
		await migrateFromLocalStorage();
		// Load settings from IndexedDB and apply to the DOM
		await settingsStore.init();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
