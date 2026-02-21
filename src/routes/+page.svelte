<script lang="ts">
    import Header from './Header.svelte';
    import { Banner} from "flowbite-svelte";
    import { Sidebar, SidebarGroup, SidebarItem, SidebarButton, uiHelpers } from "flowbite-svelte";
    import { page } from "$app/stores";

    let title = $state('天天TODO清单');

    let activeUrl = $derived($page.url.pathname);
    // import PlusPlaceholder from "$utils/PlusPlaceholder.svelte";
    const spanClass = "flex-1 ms-3 whitespace-nowrap";
    const demoSidebarUi = uiHelpers();
    let isDemoOpen = $state(false);
    const closeDemoSidebar = demoSidebarUi.close;
    $effect(() => {
        isDemoOpen = demoSidebarUi.isOpen;
    });
</script>


<div class="flex">
    <SidebarButton onclick={demoSidebarUi.toggle} class="mb-2" />
  <Sidebar
    {activeUrl}
    backdrop={false}
    isOpen={isDemoOpen}
    closeSidebar={closeDemoSidebar}
    params={{ x: -50, duration: 50 }}
    class="z-50 h-full"
    position="absolute"
    classes={{ nonactive: "p-2", active: "p-2" }}
  >
    <SidebarGroup>

      <SidebarItem label="TODO清单" href="/">
      </SidebarItem>

      <SidebarItem label="你的项目" href="/ProjectTracker">
      </SidebarItem>

      <SidebarItem label="进步" href="/ProgressDashboard">
      </SidebarItem>

      <SidebarItem label="设置" href="/Settings">
      </SidebarItem>

    </SidebarGroup>
  </Sidebar>

  <main class="flex-1 p-6">
    <Banner class="absolute">
        <p class="me-8 flex items-center text-sm font-normal text-gray-500 md:me-0 dark:text-gray-400">
            <span>您现在看的是逐一的最新版本</span>
        </p>
    </Banner>
    <Header {title}/>
  </main>
</div>
