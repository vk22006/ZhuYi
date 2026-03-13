<script lang="ts">
	import Header from '../Header.svelte';
	import { Sidebar, SidebarGroup, SidebarItem, SidebarButton, uiHelpers } from 'flowbite-svelte';
	import { page } from '$app/stores';

	let title = $state('你的进步');

	let activeUrl = $derived($page.url.pathname);
	// import PlusPlaceholder from "$utils/PlusPlaceholder.svelte";
	const spanClass = 'flex-1 ms-3 whitespace-nowrap';
	const demoSidebarUi = uiHelpers();
	demoSidebarUi.isOpen = true;
	let isDemoOpen = $state(true);
	const closeDemoSidebar = demoSidebarUi.close;
	$effect(() => {
		isDemoOpen = demoSidebarUi.isOpen;
	});
</script>

<div class="relative flex min-h-screen content-start">
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

	<main class="flex-1 p-6 transition-all duration-300 {isDemoOpen ? 'ml-64' : ''}">
		<div class="mb-4 flex items-center gap-4">
			<SidebarButton
				onclick={demoSidebarUi.toggle}
				class="!inline-flex rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
			/>
		</div>
		<Header {title} />
	</main>
</div>
