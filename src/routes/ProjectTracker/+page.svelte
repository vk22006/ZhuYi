<script lang="ts">
    import Header from '../Header.svelte';
    import { Alert } from "flowbite-svelte";
    // // import Sidebar from './sidebar.svelte';
    // import { fly, fade } from "svelte/transition";
    // import { onMount } from "svelte";

    let page = $state('你的项目');
</script>

<Header {page} />

<div class="p-8">
  <Alert>
    <span class="font-medium">Info alert!</span>
    Change a few things up and try submitting again.
  </Alert>
</div>

<a href="./ProjectTracker">你的项目</a><br>
<a href="./ProgressDashboard">进步</a><br>
<a href="./Settings">设置</a><br>