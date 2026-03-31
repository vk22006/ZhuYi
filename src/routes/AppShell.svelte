<!-- 
  AppShell – shared desktop app layout.

  Usage:
    <AppShell {activeUrl}>
    </AppShell>

  The shell gives us:
  • A fixed h-screen container so the window never scrolls as a page (desktop feel)
  • A static sidebar column (not absolutely positioned)
  • A main area that scrolls internally via overflow-y-auto -->

<script lang="ts">
	import { Sidebar, SidebarGroup, SidebarItem, SidebarButton, uiHelpers } from 'flowbite-svelte';

	let { activeUrl, children } = $props<{
		activeUrl: string;
		children: any;
	}>();

	const sidebarUi = uiHelpers();
	sidebarUi.isOpen = true;
	let isOpen = $state(true);
	$effect(() => {
		isOpen = sidebarUi.isOpen;
	});
</script>

<!-- Full-viewport shell — never scrolls at the document level -->
<div class="flex h-dvh overflow-clip bg-gray-50 dark:bg-gray-900">
	<!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
	<aside
		class="flex h-full flex-shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-200 dark:border-gray-700 dark:bg-gray-800
		       {isOpen ? 'w-52' : 'w-0 overflow-hidden'}"
	>
		<Sidebar
			{activeUrl}
			backdrop={false}
			isOpen={true}
			position="static"
			class="h-full w-52"
			classes={{ nonactive: 'p-2', active: 'p-2' }}
		>
			<div class="flex items-center justify-center px-4 pb-6">
				<img
					src="/assets/app_img/logo_full.png"
					alt="ZhuYi Logo"
					class="h-14 w-auto object-contain transition-opacity hover:opacity-90"
				/>
			</div>
			<SidebarGroup>
				<SidebarItem label="TODO清单" href="/" />
				<SidebarItem label="你的项目" href="/ProjectTracker" />
				<SidebarItem label="进步" href="/ProgressDashboard" />
				<SidebarItem label="设置" href="/Settings" />
			</SidebarGroup>
		</Sidebar>
	</aside>

	<!-- ── Main content ───────────────────────────────────────────────────── -->
	<div class="relative z-50 flex min-w-0 flex-1 flex-col overflow-clip">
		<!-- Top bar: sidebar toggle -->
		<header
			class="flex h-11 flex-shrink-0 items-center border-b border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800"
		>
			<SidebarButton
				onclick={sidebarUi.toggle}
				class="!inline-flex rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
			/>
		</header>

		<!-- Scrollable content region -->
		<main class="flex-1 overflow-y-auto px-5 py-4">
			{@render children()}
		</main>
	</div>
</div>
