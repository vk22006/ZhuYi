<script lang="ts">
    import Header from '../Header.svelte';
    // // import Sidebar from './sidebar.svelte';
    // import { fly, fade } from "svelte/transition";
    // import { onMount } from "svelte";

    let page = $state('你的进步');
</script>

<Header {page} />

<a href="./ProjectTracker">你的项目</a><br>
<a href="./ProgressDashboard">进步</a><br>
<a href="./Settings">设置</a><br>