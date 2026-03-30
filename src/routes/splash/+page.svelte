<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';

	// Progress bar animation state
	let progress = $state(0);
	let visible = $state(false);

	// Easing function for smooth progress
	function easeInOut(t: number): number {
		return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
	}

	async function animateProgress() {
		const duration = 2800; // ms total duration
		const start = performance.now();

		return new Promise<void>((resolve) => {
			function tick(now: number) {
				const elapsed = now - start;
				const raw = Math.min(elapsed / duration, 1);
				// Ease progress but stall near 95% until we transition
				const eased = easeInOut(Math.min(raw, 0.97));
				progress = Math.round(eased * 100);

				if (raw < 1) {
					requestAnimationFrame(tick);
				} else {
					progress = 100;
					resolve();
				}
			}
			requestAnimationFrame(tick);
		});
	}

	onMount(async () => {
		// Small delay then fade in
		await new Promise((r) => setTimeout(r, 80));
		visible = true;

		// Run progress animation
		await animateProgress();

		// Brief pause at 100% before transitioning
		await new Promise((r) => setTimeout(r, 350));

		// Tell the Rust backend to close splash and show main window
		try {
			await invoke('close_splash_open_main');
		} catch (e) {
			// Fallback: if invoke fails during dev, just close the window
			const { getCurrentWindow } = await import('@tauri-apps/api/window');
			await getCurrentWindow().close();
		}
	});
</script>

<svelte:head>
	<title>逐一</title>
	<style>
		@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Inter:wght@300;400&display=swap');

		*, *::before, *::after {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		html, body {
			width: 100%;
			height: 100%;
			overflow: hidden;
			background: #000;
		}
	</style>
</svelte:head>

<!-- Root splash container -->
<div
	class="splash-root"
	style="opacity: {visible ? 1 : 0}; transition: opacity 0.5s ease;"
>
	<!-- Background image layer -->
	<div class="bg-layer"></div>

	<!-- Dark vignette overlay for depth -->
	<div class="vignette"></div>

	<!-- Bottom content area -->
	<div class="content-area">
		<!-- Progress bar container -->
		<div class="progress-wrapper" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
			<div class="progress-track">
				<div class="progress-fill" style="width: {progress}%;"></div>
				<!-- Glow shimmer on the leading edge -->
				{#if progress > 0 && progress < 100}
					<div class="progress-glow" style="left: calc({progress}% - 12px);"></div>
				{/if}
			</div>
		</div>

		<!-- Title -->
		<h1 class="splash-title">逐一</h1>

		<!-- Version -->
		<p class="splash-version">Version 1.1.1</p>
	</div>
</div>

<style>
	.splash-root {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		overflow: hidden;
		font-family: 'Inter', 'Noto Serif SC', 'PingFang SC', 'Microsoft YaHei', 'SimSun', sans-serif;
		user-select: none;
	}

	/* ── Background ──────────────────────────────────────── */
	.bg-layer {
		position: absolute;
		inset: 0;
		background-image: url('/assets/app_img/splash_screen.png');
		background-size: cover;
		background-position: center center;
		background-repeat: no-repeat;
		z-index: 0;
	}

	/* ── Vignette / gradient overlay for cinematic depth ─── */
	.vignette {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse at 50% 40%, transparent 25%, rgba(0, 0, 0, 0.25) 75%),
			linear-gradient(to bottom, transparent 40%, rgba(0, 0, 0, 0.65) 100%);
		z-index: 1;
		pointer-events: none;
	}

	/* ── Bottom content (progress + text) ───────────────── */
	.content-area {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding-bottom: clamp(36px, 8vh, 72px);
	}

	/* ── Progress track ──────────────────────────────────── */
	.progress-wrapper {
		width: clamp(220px, 42%, 380px);
	}

	.progress-track {
		position: relative;
		height: 8px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.06);
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, 0.4),
			inset 0 1px 2px rgba(0, 0, 0, 0.5);
		overflow: visible;
	}

	.progress-fill {
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(90deg, #b91c1c 0%, #dc2626 30%, #f97316 75%, #fb923c 100%);
		box-shadow:
			0 0 10px rgba(239, 68, 68, 0.6),
			0 0 24px rgba(249, 115, 22, 0.35);
		transition: width 60ms linear;
		will-change: width;
		overflow: hidden;
		position: relative;
	}

	/* Subtle sheen animation on the fill */
	.progress-fill::after {
		content: '';
		position: absolute;
		top: 0;
		left: -60%;
		width: 40%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
		animation: sheen 1.8s ease-in-out infinite;
	}

	@keyframes sheen {
		0%   { left: -60%; }
		100% { left: 130%; }
	}

	/* Leading-edge glow dot */
	.progress-glow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(251, 146, 60, 0.9) 0%, transparent 70%);
		pointer-events: none;
		transition: left 60ms linear;
		will-change: left;
	}

	/* ── Title ───────────────────────────────────────────── */
	.splash-title {
		font-family: 'Noto Serif SC', 'PingFang SC', 'Microsoft YaHei', 'STSong', 'SimSun', serif;
		font-size: clamp(22px, 4vw, 34px);
		font-weight: 700;
		color: #ffffff;
		letter-spacing: 0.12em;
		text-shadow:
			0 0 20px rgba(220, 38, 38, 0.6),
			0 2px 4px rgba(0, 0, 0, 0.8);
		line-height: 1;
		margin-top: 4px;
	}

	/* ── Version ─────────────────────────────────────────── */
	.splash-version {
		font-size: clamp(11px, 1.4vw, 14px);
		font-weight: 300;
		color: rgba(255, 255, 255, 0.45);
		letter-spacing: 0.08em;
		font-family: 'Inter', sans-serif;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
	}
</style>
