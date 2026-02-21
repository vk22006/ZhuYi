<script lang="ts">
    import Header from '../Header.svelte';
    import { Sidebar, SidebarGroup, SidebarItem, SidebarButton, uiHelpers } from "flowbite-svelte";
    import { page } from "$app/stores";

    let title = $state('你的项目');

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
    <Header {title}/>
  </main>
</div>
