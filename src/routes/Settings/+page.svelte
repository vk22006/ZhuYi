<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '../Header.svelte';
	import { Sidebar, SidebarGroup, SidebarItem, SidebarButton, uiHelpers } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { settingsStore, type Theme, type FontSize } from '$lib/settingsStore';

	// ── Sidebar ─────────────────────────────────────────────────────────────────
	let activeUrl = $derived($page.url.pathname);
	const demoSidebarUi = uiHelpers();
	demoSidebarUi.isOpen = true;
	let isDemoOpen = $state(true);
	const closeDemoSidebar = demoSidebarUi.close;
	$effect(() => {
		isDemoOpen = demoSidebarUi.isOpen;
	});

	// ── Settings store ───────────────────────────────────────────────────────────
	let settings = $derived($settingsStore);

	onMount(() => {
		settingsStore.init();
	});

	// ── Helpers ──────────────────────────────────────────────────────────────────
	const themes: { value: Theme; label: string; icon: string; desc: string }[] = [
		{
			value: 'light',
			label: '浅色',
			icon: '☀️',
			desc: '明亮的界面，适合日间使用'
		},
		{
			value: 'dark',
			label: '深色',
			icon: '🌙',
			desc: '护眼深色模式，适合夜间使用'
		}
	];

	const fontSizes: { value: FontSize; label: string; sample: string; desc: string }[] = [
		{
			value: 'small',
			label: '小',
			sample: 'Aa',
			desc: '紧凑布局，显示更多内容'
		},
		{
			value: 'medium',
			label: '中',
			sample: 'Aa',
			desc: '默认字号，平衡舒适与密度'
		},
		{
			value: 'large',
			label: '大',
			sample: 'Aa',
			desc: '放大文字，阅读更轻松'
		}
	];

	const previewSentences: Record<FontSize, string> = {
		small: '这是小号字体预览 — 文字紧凑，信息密度高。',
		medium: '这是中号字体预览 — 平衡舒适的默认体验。',
		large: '这是大号字体预览 — 放大文字，一目了然。'
	};

	const sampleSizes: Record<FontSize, string> = {
		small: 'text-sm',
		medium: 'text-base',
		large: 'text-xl'
	};
</script>

<div class="relative flex min-h-screen">
	<Sidebar
		{activeUrl}
		backdrop={false}
		isOpen={isDemoOpen}
		closeSidebar={closeDemoSidebar}
		params={{ x: -50, duration: 50 }}
		class="z-50 h-full {isDemoOpen ? '' : 'md:!-translate-x-full'}"
		position="absolute"
		classes={{ nonactive: 'p-2', active: 'p-2' }}
	>
		<SidebarGroup>
			<SidebarItem label="TODO清单" href="/"></SidebarItem>
			<SidebarItem label="你的项目" href="/ProjectTracker"></SidebarItem>
			<SidebarItem label="进步" href="/ProgressDashboard"></SidebarItem>
			<SidebarItem label="设置" href="/Settings"></SidebarItem>
		</SidebarGroup>
	</Sidebar>

	<main
		class="flex-1 p-6 transition-all duration-300 {isDemoOpen
			? 'ml-64'
			: ''} bg-gray-50 dark:bg-gray-900"
	>
		<!-- Top bar -->
		<div class="mb-4 flex items-center gap-4">
			<SidebarButton
				onclick={demoSidebarUi.toggle}
				class="!inline-flex rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
			/>
		</div>

		<Header title="设置" />

		<div class="mx-auto max-w-2xl space-y-6 pb-16">
			<!-- ── Theme Card ──────────────────────────────────────────────────── -->
			<section
				class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800"
			>
				<div
					class="mb-1 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white"
				>
					<span>🎨</span>
					<span>主题</span>
				</div>
				<p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
					选择界面的明暗风格，切换后立即生效。
				</p>

				<div class="grid grid-cols-2 gap-3">
					{#each themes as t}
						<button
							type="button"
							onclick={() => settingsStore.setTheme(t.value)}
							aria-pressed={settings.theme === t.value}
							class="group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
								{settings.theme === t.value
								? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
								: 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600 dark:hover:bg-gray-700'}"
						>
							<span class="text-3xl">{t.icon}</span>
							<span
								class="font-medium {settings.theme === t.value
									? 'text-primary-700 dark:text-primary-300'
									: 'text-gray-700 dark:text-gray-300'}">{t.label}</span
							>
							<span class="text-xs text-gray-500 dark:text-gray-400">{t.desc}</span>

							{#if settings.theme === t.value}
								<span
									class="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white"
								>
									<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
								</span>
							{/if}
						</button>
					{/each}
				</div>
			</section>

			<!-- ── Font Size Card ──────────────────────────────────────────────── -->
			<section
				class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800"
			>
				<div
					class="mb-1 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white"
				>
					<span>🔠</span>
					<span>字体大小</span>
				</div>
				<p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
					调整全局文字大小，适配不同阅读习惯。
				</p>

				<div class="grid grid-cols-3 gap-3">
					{#each fontSizes as fs}
						<button
							type="button"
							onclick={() => settingsStore.setFontSize(fs.value)}
							aria-pressed={settings.fontSize === fs.value}
							class="group relative flex flex-col items-center gap-1 rounded-xl border-2 p-4 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
								{settings.fontSize === fs.value
								? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
								: 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600 dark:hover:bg-gray-700'}"
						>
							<span
								class="{sampleSizes[fs.value]} font-bold {settings.fontSize === fs.value
									? 'text-primary-600 dark:text-primary-400'
									: 'text-gray-700 dark:text-gray-300'}">{fs.sample}</span
							>
							<span
								class="text-sm font-medium {settings.fontSize === fs.value
									? 'text-primary-700 dark:text-primary-300'
									: 'text-gray-700 dark:text-gray-300'}">{fs.label}</span
							>
							<span class="text-xs text-gray-500 dark:text-gray-400">{fs.desc}</span>

							{#if settings.fontSize === fs.value}
								<span
									class="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white"
								>
									<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
								</span>
							{/if}
						</button>
					{/each}
				</div>

				<!-- Live preview -->
				<div
					class="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all duration-300 dark:border-gray-700 dark:bg-gray-900"
				>
					<p
						class="mb-1 text-xs font-medium tracking-wide text-gray-400 uppercase dark:text-gray-500"
					>
						预览
					</p>
					<p
						class="{sampleSizes[
							settings.fontSize
						]} text-gray-700 transition-all duration-300 dark:text-gray-300"
					>
						{previewSentences[settings.fontSize]}
					</p>
				</div>
			</section>

			<!-- ── Reset Card ──────────────────────────────────────────────────── -->
			<section
				class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800"
			>
				<div
					class="mb-1 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white"
				>
					<span>↩️</span>
					<span>重置设置</span>
				</div>
				<p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
					将所有偏好恢复为默认值（浅色主题 + 中号字体）。
				</p>
				<button
					type="button"
					onclick={() => settingsStore.reset()}
					class="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-red-300 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
				>
					恢复默认设置
				</button>
			</section>
		</div>
	</main>
</div>
