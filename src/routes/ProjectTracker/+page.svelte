<script lang="ts">
	import Header from '../Header.svelte';
	import { Sidebar, SidebarGroup, SidebarItem, SidebarButton, uiHelpers } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import {
		projectStore,
		isOverdue,
		isDueSoon,
		formatDeadline,
		getStats,
		type Project
	} from '$lib/projectStore';

	// ── Sidebar boilerplate (matches existing pages) ──────────────────────────
	let activeUrl = $derived($page.url.pathname);
	const demoSidebarUi = uiHelpers();
	demoSidebarUi.isOpen = true;
	let isDemoOpen = $state(true);
	const closeDemoSidebar = demoSidebarUi.close;
	$effect(() => {
		isDemoOpen = demoSidebarUi.isOpen;
	});

	// ── New project form ──────────────────────────────────────────────────────
	let newTitle = $state('');
	let newDesc = $state('');
	let newDeadline = $state(''); // datetime-local value (local time string)

	function localToISO(local: string): string | undefined {
		if (!local) return undefined;
		return new Date(local).toISOString();
	}

	function handleAddProject(e: Event) {
		e.preventDefault();
		if (!newTitle.trim()) return;
		projectStore.addProject({
			title: newTitle.trim(),
			description: newDesc.trim() || undefined,
			deadline: localToISO(newDeadline)
		});
		newTitle = '';
		newDesc = '';
		newDeadline = '';
	}

	// ── Filter & sort state ───────────────────────────────────────────────────
	type Filter = 'all' | 'active' | 'completed' | 'overdue';
	let filter = $state<Filter>('all');
	let sortAsc = $state(true); // true = nearest deadline first

	// ── Derived sorted/filtered list ──────────────────────────────────────────
	let displayProjects = $derived.by(() => {
		let list = [...$projectStore];

		// Filter
		if (filter === 'active') list = list.filter((p) => p.status === 'active');
		else if (filter === 'completed') list = list.filter((p) => p.status === 'completed');
		else if (filter === 'overdue') list = list.filter(isOverdue);

		// Sort: deadline nulls last, then createdAt
		list.sort((a, b) => {
			const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
			const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
			if (da !== db) return sortAsc ? da - db : db - da;
			return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
		});
		return list;
	});

	let stats = $derived(getStats($projectStore));

	// ── Expanded card state ───────────────────────────────────────────────────
	let expandedId = $state<string | null>(null);
	function toggleExpand(id: string) {
		expandedId = expandedId === id ? null : id;
	}

	// ── Inline edit state ─────────────────────────────────────────────────────
	let editingId = $state<string | null>(null);
	let editTitle = $state('');
	let editDesc = $state('');

	function startEdit(p: Project) {
		editingId = p.id;
		editTitle = p.title;
		editDesc = p.description ?? '';
	}

	function saveEdit(p: Project) {
		if (editTitle.trim()) {
			projectStore.updateProject(p.id, {
				title: editTitle.trim(),
				description: editDesc.trim() || undefined
			});
		}
		editingId = null;
	}

	// ── Inline deadline editor ────────────────────────────────────────────────
	// Store a per-project deadline input value keyed by id
	let deadlineInputs = $state<Record<string, string>>({});

	function isoToDatetimeLocal(iso: string | undefined): string {
		if (!iso) return '';
		// datetime-local needs "YYYY-MM-DDTHH:MM" in local time
		const d = new Date(iso);
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	function initDeadlineInput(p: Project) {
		if (!(p.id in deadlineInputs)) {
			deadlineInputs[p.id] = isoToDatetimeLocal(p.deadline);
		}
	}

	function applyDeadline(p: Project) {
		const val = deadlineInputs[p.id];
		projectStore.setDeadline(p.id, val ? new Date(val).toISOString() : null);
	}

	// ── Per-project new note inputs ───────────────────────────────────────────
	let noteInputs = $state<Record<string, string>>({});

	function submitNote(p: Project) {
		const text = noteInputs[p.id]?.trim();
		if (!text) return;
		projectStore.addNote(p.id, text);
		noteInputs[p.id] = '';
	}

	// ── Delete with confirm ───────────────────────────────────────────────────
	function deleteProject(id: string) {
		if (confirm('确定要删除该项目吗？此操作不可撤销。')) {
			projectStore.removeProject(id);
			if (expandedId === id) expandedId = null;
		}
	}

	// ── Card border/style helpers ─────────────────────────────────────────────
	function cardBorder(p: Project): string {
		if (p.status === 'completed') return 'border-gray-200 dark:border-gray-700';
		if (isOverdue(p)) return 'border-red-500 dark:border-red-500';
		if (isDueSoon(p)) return 'border-amber-400 dark:border-amber-400';
		return 'border-gray-200 dark:border-gray-700';
	}

	function deadlineLabel(p: Project): { text: string; cls: string } {
		if (!p.deadline) return { text: '', cls: '' };
		if (p.status === 'completed')
			return {
				text: formatDeadline(p.deadline),
				cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
			};
		if (isOverdue(p))
			return {
				text: 'OVERDUE · ' + formatDeadline(p.deadline),
				cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
			};
		if (isDueSoon(p))
			return {
				text: 'DUE SOON · ' + formatDeadline(p.deadline),
				cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
			};
		return {
			text: formatDeadline(p.deadline),
			cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
		};
	}
</script>

<div class="relative flex min-h-screen">
	<!-- Sidebar (same as other pages) -->
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
			<SidebarItem label="TODO清单" href="/" />
			<SidebarItem label="你的项目" href="/ProjectTracker" />
			<SidebarItem label="进步" href="/ProgressDashboard" />
			<SidebarItem label="设置" href="/Settings" />
		</SidebarGroup>
	</Sidebar>

	<main class="flex-1 p-6 transition-all duration-300 {isDemoOpen ? 'ml-64' : ''}">
		<!-- Sidebar toggle -->
		<div class="mb-4 flex items-center gap-4">
			<SidebarButton
				onclick={demoSidebarUi.toggle}
				class="!inline-flex rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
			/>
		</div>

		<Header title="你的项目" />

		<div class="mx-auto mt-6 max-w-3xl space-y-6">
			<!-- ── Stats bar ──────────────────────────────────────────────────── -->
			<div class="flex flex-wrap gap-3">
				<span
					class="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
				>
					总数 <strong>{stats.total}</strong>
				</span>
				<span
					class="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
				>
					进行中 <strong>{stats.active}</strong>
				</span>
				<span
					class="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400"
				>
					已过期 <strong>{stats.overdue}</strong>
				</span>
				<span
					class="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
				>
					即将到期 <strong>{stats.dueSoon}</strong>
				</span>
				<span
					class="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400"
				>
					已完成 <strong>{stats.completed}</strong>
				</span>
			</div>

			<!-- ── New project form ───────────────────────────────────────────── -->
			<form
				onsubmit={handleAddProject}
				class="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
			>
				<h2
					class="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
				>
					新建项目
				</h2>
				<div class="flex flex-col gap-3">
					<div>
						<label
							for="new-title"
							class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
						>
							项目标题 <span class="text-red-500">*</span>
						</label>
						<input
							id="new-title"
							type="text"
							bind:value={newTitle}
							placeholder="比如：毕业设计"
							required
							class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-800"
						/>
					</div>
					<div>
						<label
							for="new-desc"
							class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
						>
							项目描述（可选）
						</label>
						<input
							id="new-desc"
							type="text"
							bind:value={newDesc}
							placeholder="简要描述项目目标"
							class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-800"
						/>
					</div>
					<div>
						<label
							for="new-deadline"
							class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
						>
							截止时间（可选）
						</label>
						<input
							id="new-deadline"
							type="datetime-local"
							bind:value={newDeadline}
							class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-800"
						/>
					</div>
					<button
						type="submit"
						class="mt-1 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none dark:focus:ring-blue-800"
					>
						＋ 添加项目
					</button>
				</div>
			</form>

			<!-- ── Filter + Sort toolbar ──────────────────────────────────────── -->
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div
					class="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800"
				>
					{#each ['all', 'active', 'completed', 'overdue'] as const as f}
						<button
							onclick={() => (filter = f)}
							class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors {filter === f
								? 'bg-blue-600 text-white shadow-sm'
								: 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}"
						>
							{f === 'all'
								? '全部'
								: f === 'active'
									? '进行中'
									: f === 'completed'
										? '已完成'
										: '已过期'}
						</button>
					{/each}
				</div>

				<button
					onclick={() => (sortAsc = !sortAsc)}
					class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
					title="切换截止时间排序"
				>
					{sortAsc ? '↑' : '↓'} 截止时间
				</button>
			</div>

			<!-- ── Project card list ──────────────────────────────────────────── -->
			{#if displayProjects.length === 0}
				<div
					class="rounded-xl border-2 border-dashed border-gray-200 py-14 text-center text-gray-400 dark:border-gray-700"
				>
					<p class="text-2xl">📋</p>
					<p class="mt-2 text-sm">没有项目。在上面创建一个吧！</p>
				</div>
			{:else}
				<ul class="space-y-4">
					{#each displayProjects as project (project.id)}
						{@const label = deadlineLabel(project)}
						{@const isExpanded = expandedId === project.id}
						{@const isEditing = editingId === project.id}
						<li
							class="rounded-xl border-2 bg-white shadow-sm transition-all dark:bg-gray-800 {cardBorder(
								project
							)} {project.status === 'completed' ? 'opacity-70' : ''}"
						>
							<!-- ── Card header ──────────────────────────────────────────── -->
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
							<div
								class="cursor-pointer p-5 select-none"
								role="button"
								tabindex="0"
								onclick={() => {
									if (!isEditing) {
										toggleExpand(project.id);
										initDeadlineInput(project);
									}
								}}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										if (!isEditing) {
											toggleExpand(project.id);
											initDeadlineInput(project);
										}
									}
								}}
							>
								<div class="flex items-start justify-between gap-4">
									<!-- Title / edit form -->
									<div class="min-w-0 flex-1">
										{#if isEditing}
											<div
												class="flex flex-col gap-2"
												onclick={(e) => e.stopPropagation()}
												role="presentation"
											>
												<input
													type="text"
													bind:value={editTitle}
													required
													class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
													placeholder="项目标题"
													onkeydown={(e) => e.key === 'Enter' && saveEdit(project)}
												/>
												<input
													type="text"
													bind:value={editDesc}
													class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
													placeholder="描述（可选）"
													onkeydown={(e) => e.key === 'Enter' && saveEdit(project)}
												/>
												<div class="flex gap-2">
													<button
														onclick={(e) => {
															e.stopPropagation();
															saveEdit(project);
														}}
														class="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
														>保存</button
													>
													<button
														onclick={(e) => {
															e.stopPropagation();
															editingId = null;
														}}
														class="rounded-md bg-gray-400 px-3 py-1 text-xs font-medium text-white hover:bg-gray-500"
														>取消</button
													>
												</div>
											</div>
										{:else}
											<p
												class="truncate font-semibold text-gray-900 dark:text-white {project.status ===
												'completed'
													? 'line-through decoration-gray-400'
													: ''}"
											>
												{project.title}
											</p>
											{#if project.description}
												<p class="mt-0.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
													{project.description}
												</p>
											{/if}
										{/if}
									</div>

									<!-- Right meta (badges + actions) -->
									{#if !isEditing}
										<div class="flex shrink-0 flex-col items-end gap-2">
											<!-- Status badge -->
											{#if project.status === 'completed'}
												<span
													class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400"
												>
													COMPLETED
												</span>
											{/if}

											<!-- Deadline badge -->
											{#if label.text}
												<span class="rounded-full px-2 py-0.5 text-xs font-semibold {label.cls}">
													{label.text}
												</span>
											{/if}

											<!-- Notes count -->
											{#if project.notes.length > 0}
												<span
													class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400"
												>
													📝 {project.notes.length}
												</span>
											{/if}
										</div>
									{/if}
								</div>

								<!-- Action buttons row (stop propagation so card doesn't toggle) -->
								{#if !isEditing}
									<div
										class="mt-3 flex flex-wrap gap-2"
										onclick={(e) => e.stopPropagation()}
										role="presentation"
									>
										<button
											onclick={(e) => {
												e.stopPropagation();
												startEdit(project);
												expandedId = project.id;
											}}
											class="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
											>编辑</button
										>

										<button
											onclick={(e) => {
												e.stopPropagation();
												toggleExpand(project.id);
												initDeadlineInput(project);
											}}
											class="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
											>📝 笔记</button
										>

										<button
											onclick={(e) => {
												e.stopPropagation();
												projectStore.toggleStatus(project.id);
											}}
											class="rounded-md border px-2.5 py-1 text-xs font-medium transition-colors
												{project.status === 'completed'
												? 'border-green-300 text-green-600 hover:border-green-400 hover:bg-green-50 dark:border-green-700 dark:text-green-400'
												: 'border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-green-500 dark:hover:text-green-400'}"
										>
											{project.status === 'completed' ? '↺ 重新开始' : '✓ 完成'}
										</button>

										<button
											onclick={(e) => {
												e.stopPropagation();
												deleteProject(project.id);
											}}
											class="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-red-500 hover:border-red-400 hover:bg-red-50 dark:border-gray-600 dark:text-red-400 dark:hover:border-red-500"
											>删除</button
										>
									</div>
								{/if}
							</div>

							<!-- ── Expanded detail panel ──────────────────────────────────── -->
							{#if isExpanded && !isEditing}
								<div class="border-t border-gray-100 px-5 pt-4 pb-5 dark:border-gray-700">
									<!-- Full description -->
									{#if project.description}
										<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
											{project.description}
										</p>
									{/if}

									<!-- Inline deadline editor -->
									<div class="mb-5 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
										<p
											class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
										>
											截止时间
										</p>
										<div class="flex flex-wrap items-center gap-2">
											<input
												type="datetime-local"
												bind:value={deadlineInputs[project.id]}
												class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
											/>
											<button
												onclick={() => applyDeadline(project)}
												class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
												>更新</button
											>
											{#if project.deadline}
												<button
													onclick={() => {
														projectStore.setDeadline(project.id, null);
														deadlineInputs[project.id] = '';
													}}
													class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-red-300 hover:text-red-500 dark:border-gray-600 dark:text-gray-400"
													>清除截止时间</button
												>
											{/if}
										</div>
									</div>

									<!-- Notes section -->
									<div>
										<p
											class="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
										>
											笔记
										</p>

										<!-- New note input -->
										<div class="mb-3 flex gap-2">
											<input
												type="text"
												bind:value={noteInputs[project.id]}
												placeholder="添加笔记… (Enter 提交)"
												class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
												onkeydown={(e) => {
													if (e.key === 'Enter') {
														e.preventDefault();
														submitNote(project);
													}
												}}
											/>
											<button
												onclick={() => submitNote(project)}
												class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
												>添加</button
											>
										</div>

										<!-- Note list -->
										{#if project.notes.length === 0}
											<p class="text-sm text-gray-400 italic dark:text-gray-600">暂无笔记</p>
										{:else}
											<ul class="space-y-2">
												{#each [...project.notes].reverse() as note (note.id)}
													<li
														class="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900"
													>
														<span class="flex-1 text-gray-700 dark:text-gray-300">{note.text}</span>
														<span class="shrink-0 text-xs text-gray-400">
															{new Date(note.createdAt).toLocaleDateString('zh-CN')}
														</span>
														<button
															onclick={() => projectStore.removeNote(project.id, note.id)}
															class="shrink-0 text-xs text-red-400 hover:text-red-600"
															title="删除笔记">✕</button
														>
													</li>
												{/each}
											</ul>
										{/if}
									</div>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</main>
</div>
