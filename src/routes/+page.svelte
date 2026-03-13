<script lang="ts">
	import Header from './Header.svelte';
	import { Banner } from 'flowbite-svelte';
	import { Sidebar, SidebarGroup, SidebarItem, SidebarButton, uiHelpers } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { todosStore } from '$lib/todoStore';

	let title = $state('天天TODO清单');

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

	let newTitle = $state('');
	let newDescription = $state('');
	let editingId: string | number | null = $state(null);
	let editTitle = $state('');
	let editDescription = $state('');

	let totalTasks = $derived($todosStore.length);
	let remainingTasks = $derived($todosStore.filter((t) => !t.done).length);

	function handleAdd(e: Event) {
		e.preventDefault();
		if (!newTitle.trim()) return;

		todosStore.add({
			title: newTitle.trim(),
			description: newDescription.trim() || undefined
		});

		newTitle = '';
		newDescription = '';
	}

	function startEdit(todo: any) {
		editingId = todo.id;
		editTitle = todo.title;
		editDescription = todo.description || '';
	}

	function saveEdit() {
		if (editingId !== null && editTitle.trim()) {
			todosStore.update(editingId, {
				title: editTitle.trim(),
				description: editDescription.trim() || undefined
			});
			editingId = null;
		}
	}

	function cancelEdit() {
		editingId = null;
	}
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

	<main class="flex-1 p-6 transition-all duration-300 {isDemoOpen ? 'ml-64' : ''}">
		<div class="mb-4 flex items-center gap-4">
			<SidebarButton
				onclick={demoSidebarUi.toggle}
				class="!inline-flex rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
			/>
		</div>
		<Banner class="absolute">
			<p
				class="me-8 flex items-center text-sm font-normal text-gray-500 md:me-0 dark:text-gray-400"
			>
				<span>您现在看的是逐一的最新版本</span>
			</p>
		</Banner>
		<Header {title} />
		<div
			class="mx-auto mt-6 max-w-2xl rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
		>
			<!-- Header / Counters -->
			<div class="mb-6 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
				<!-- <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Todo List</h2> -->
				<div class="flex gap-4">
					<span>总数: <strong>{totalTasks}</strong></span>
					<span
						>剩余: <strong class="text-blue-600 dark:text-blue-400">{remainingTasks}</strong></span
					>
				</div>
			</div>

			<!-- Add Task Form -->
			<form
				onsubmit={handleAdd}
				class="mb-6 flex flex-col gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-900"
			>
				<input
					type="text"
					bind:value={newTitle}
					placeholder="任务标题（必填）"
					required
					class="w-full rounded-lg border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
				/>
				<input
					type="text"
					bind:value={newDescription}
					placeholder="任务说明（可选）"
					class="w-full rounded-lg border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
				/>
				<button
					type="submit"
					class="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
				>
					添加任务
				</button>
			</form>

			<!-- Todo List -->
			<ul class="space-y-3">
				{#each $todosStore as todo (todo.id)}
					<li
						class="flex items-start gap-4 rounded-lg border p-4 transition-colors {todo.done
							? 'border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50'
							: 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}"
					>
						<!-- Checkbox -->
						<div class="pt-1">
							<input
								type="checkbox"
								checked={todo.done}
								onchange={() => todosStore.toggle(todo.id)}
								class="h-5 w-5 cursor-pointer rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
							/>
						</div>

						<!-- Content -->
						<div class="min-w-0 flex-1">
							{#if editingId === todo.id}
								<div class="flex flex-col gap-2">
									<input
										type="text"
										bind:value={editTitle}
										required
										class="w-full rounded-md border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									/>
									<input
										type="text"
										bind:value={editDescription}
										placeholder="Description"
										class="w-full rounded-md border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									/>
									<div class="mt-1 flex gap-2">
										<button
											onclick={saveEdit}
											class="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
											>保存</button
										>
										<button
											type="button"
											onclick={cancelEdit}
											class="rounded-md bg-gray-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-600"
											>取消</button
										>
									</div>
								</div>
							{:else}
								<div>
									<p
										class="font-medium text-gray-900 dark:text-white {todo.done
											? 'text-gray-400 line-through dark:text-gray-500'
											: ''}"
									>
										{todo.title}
									</p>
									{#if todo.description}
										<p
											class="mt-1 text-sm text-gray-500 dark:text-gray-400 {todo.done
												? 'line-through opacity-70'
												: ''}"
										>
											{todo.description}
										</p>
									{/if}
								</div>
							{/if}
						</div>

						<!-- Actions -->
						{#if editingId !== todo.id}
							<div class="flex items-center gap-3">
								<button
									onclick={() => startEdit(todo)}
									class="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
								>
									编辑
								</button>
								<button
									onclick={() => todosStore.remove(todo.id)}
									class="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
								>
									删除
								</button>
							</div>
						{/if}
					</li>
				{/each}

				{#if $todosStore.length === 0}
					<li
						class="rounded-lg border-2 border-dashed border-gray-200 py-6 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400"
					>
						无任务。请在上面创建一下！
					</li>
				{/if}
			</ul>
		</div>
	</main>
</div>
