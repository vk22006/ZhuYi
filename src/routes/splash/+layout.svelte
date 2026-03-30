<script lang="ts">
	let { children } = $props();
</script>

{@render children()}

<style>
	:global(*, *::before, *::after) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}
	:global(html, body) {
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: #000;
	}
</style>
