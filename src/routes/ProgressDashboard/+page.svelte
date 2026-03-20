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

	// ── Config ────────────────────────────────────────────────────────────────
	const MAX_CARDS = 8;
	const MAX_UPCOMING = 5;

	// ── Sidebar boilerplate ────────────────────────────────────────────────────
	let activeUrl = $derived($page.url.pathname);
	const demoSidebarUi = uiHelpers();
	demoSidebarUi.isOpen = true;
	let isDemoOpen = $state(true);
	const closeDemoSidebar = demoSidebarUi.close;
	$effect(() => {
		isDemoOpen = demoSidebarUi.isOpen;
	});

	// ── Filter / sort state ───────────────────────────────────────────────────
	type Filter = 'all' | 'active' | 'completed' | 'overdue';
	let filter = $state<Filter>('all');
	let sortAsc = $state(true);

	// ── Inline note state (keyed by project id) ───────────────────────────────
	let noteInputVisible = $state<Record<string, boolean>>({});
	let noteInputValues = $state<Record<string, string>>({});

	function toggleNoteInput(id: string) {
		noteInputVisible[id] = !noteInputVisible[id];
		if (!noteInputVisible[id]) noteInputValues[id] = '';
	}

	function submitNote(project: Project) {
		const text = noteInputValues[project.id]?.trim();
		if (!text) return;
		projectStore.addNote(project.id, text);
		noteInputValues[project.id] = '';
		noteInputVisible[project.id] = false;
	}

	// ── Derived data ───────────────────────────────────────────────────────────
	let allProjects = $derived($projectStore);
	let stats = $derived(getStats(allProjects));

	// Completion percent
	let completionPct = $derived(
		allProjects.length === 0 ? 0 : Math.round((stats.completed / allProjects.length) * 100)
	);

	// Last updated timestamp
	let lastUpdated = $derived.by(() => {
		if (allProjects.length === 0) return null;
		const maxTs = Math.max(...allProjects.map((p) => new Date(p.updatedAt).getTime()));
		return new Date(maxTs).toLocaleString('zh-CN', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	});

	// Filtered & sorted list
	function applyFilter(list: Project[], f: Filter): Project[] {
		if (f === 'active') return list.filter((p) => p.status === 'active');
		if (f === 'completed') return list.filter((p) => p.status === 'completed');
		if (f === 'overdue') return list.filter(isOverdue);
		return list;
	}

	function sortByDeadline(list: Project[], asc: boolean): Project[] {
		return [...list].sort((a, b) => {
			const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
			const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
			if (da !== db) return asc ? da - db : db - da;
			return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
		});
	}

	let filteredProjects = $derived(sortByDeadline(applyFilter(allProjects, filter), sortAsc));

	// Upcoming (always from active/overdue, deadline present, nearest first, max 5)
	let upcoming = $derived(
		sortByDeadline(
			allProjects.filter((p) => p.deadline && p.status !== 'completed'),
			true
		).slice(0, MAX_UPCOMING)
	);

	// Card grid (max N)
	let cardProjects = $derived(filteredProjects.slice(0, MAX_CARDS));

	// ── Deadline badge helpers ─────────────────────────────────────────────────
	type BadgeInfo = { text: string; bg: string; text_: string };
	function getDeadlineBadge(p: Project): BadgeInfo | null {
		if (!p.deadline) return null;
		if (p.status === 'completed')
			return {
				text: formatDeadline(p.deadline),
				bg: 'bg-gray-100 dark:bg-gray-700',
				text_: 'text-gray-500 dark:text-gray-400'
			};
		if (isOverdue(p))
			return {
				text: 'OVERDUE · ' + formatDeadline(p.deadline),
				bg: 'bg-red-100 dark:bg-red-900/30',
				text_: 'text-red-700 dark:text-red-400'
			};
		if (isDueSoon(p))
			return {
				text: 'DUE SOON · ' + formatDeadline(p.deadline),
				bg: 'bg-amber-100 dark:bg-amber-900/30',
				text_: 'text-amber-700 dark:text-amber-400'
			};
		return {
			text: formatDeadline(p.deadline),
			bg: 'bg-blue-50 dark:bg-blue-900/20',
			text_: 'text-blue-700 dark:text-blue-400'
		};
	}

	function cardBorderClass(p: Project): string {
		if (p.status === 'completed') return 'border-gray-200 dark:border-gray-700';
		if (isOverdue(p)) return 'border-red-400 dark:border-red-500';
		if (isDueSoon(p)) return 'border-amber-400 dark:border-amber-400';
		return 'border-gray-200 dark:border-gray-700';
	}

	// ── CSV export ─────────────────────────────────────────────────────────────
	function exportCSV() {
		const headers = [
			'ID',
			'Title',
			'Description',
			'Status',
			'Deadline',
			'Notes',
			'Created',
			'Updated'
		];
		const rows = filteredProjects.map((p) => [
			p.id,
			`"${p.title.replace(/"/g, '""')}"`,
			`"${(p.description ?? '').replace(/"/g, '""')}"`,
			p.status,
			p.deadline ?? '',
			p.notes.length,
			p.createdAt,
			p.updatedAt
		]);
		const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `projects-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	// ── Stat cards config ──────────────────────────────────────────────────────
	const statCards = $derived([
		{
			label: '全部项目',
			value: stats.total,
			icon: '📁',
			color: 'text-gray-700 dark:text-gray-300',
			bg: 'bg-gray-50 dark:bg-gray-800',
			border: 'border-gray-200 dark:border-gray-700'
		},
		{
			label: '进行中',
			value: stats.active,
			icon: '🚀',
			color: 'text-blue-700 dark:text-blue-400',
			bg: 'bg-blue-50 dark:bg-blue-900/20',
			border: 'border-blue-200 dark:border-blue-800'
		},
		{
			label: '已完成',
			value: stats.completed,
			icon: '✅',
			color: 'text-green-700 dark:text-green-400',
			bg: 'bg-green-50 dark:bg-green-900/20',
			border: 'border-green-200 dark:border-green-800'
		},
		{
			label: '已过期',
			value: stats.overdue,
			icon: '🔴',
			color: 'text-red-700 dark:text-red-400',
			bg: 'bg-red-50 dark:bg-red-900/20',
			border: 'border-red-200 dark:border-red-800'
		}
	]);
</script>

<div class="relative flex min-h-screen">
	<!-- ── Sidebar ──────────────────────────────────────────────────────────── -->
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

	<main
		class="flex-1 p-6 transition-all duration-300 {isDemoOpen
			? 'ml-64'
			: ''} bg-gray-50 dark:bg-gray-900"
	>
		<!-- Sidebar toggle -->
		<div class="mb-4 flex items-center gap-4">
			<SidebarButton
				onclick={demoSidebarUi.toggle}
				class="!inline-flex rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
			/>
		</div>

		<Header title="你的进步" />

		<div class="mx-auto mt-4 max-w-5xl space-y-8">
			<!-- ── Last updated line ────────────────────────────────────────────── -->
			<p class="text-center text-xs text-gray-400 dark:text-gray-600">
				{#if lastUpdated}
					最后更新：{lastUpdated}
				{:else}
					暂无项目数据
				{/if}
			</p>

			<!-- ── Stat cards ───────────────────────────────────────────────────── -->
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{#each statCards as card}
					<div class="rounded-xl border {card.border} {card.bg} p-5 shadow-sm">
						<div class="flex items-center gap-3">
							<span class="text-2xl" aria-hidden="true">{card.icon}</span>
							<div>
								<p class="text-2xl font-bold {card.color}">{card.value}</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- ── Progress bar ─────────────────────────────────────────────────── -->
			<div
				class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
			>
				<div class="mb-3 flex items-center justify-between">
					<span class="text-sm font-semibold text-gray-700 dark:text-gray-300">项目完成进度</span>
					<span class="text-lg font-bold text-blue-600 dark:text-blue-400">{completionPct}%</span>
				</div>
				<!-- Progress bar -->
				<div class="relative h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
					<div
						class="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-700"
						style="width: {completionPct}%"
						role="progressbar"
						aria-valuenow={completionPct}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-label="项目完成进度 {completionPct}%"
					></div>
				</div>

				<!-- Status pills -->
				<div class="mt-4 flex flex-wrap gap-2">
					<span
						class="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
					>
						进行中 {stats.active}
					</span>
					<span
						class="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
					>
						已完成 {stats.completed}
					</span>
					<span
						class="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
					>
						已过期 {stats.overdue}
					</span>
					<span
						class="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
					>
						即将到期 {stats.dueSoon}
					</span>
				</div>
			</div>

			<!-- ── Upcoming deadlines ───────────────────────────────────────────── -->
			{#if upcoming.length > 0}
				<div
					class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
						<h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
							⏰ 即将到期（最近 {upcoming.length} 个）
						</h2>
					</div>
					<ul class="divide-y divide-gray-100 dark:divide-gray-700">
						{#each upcoming as project (project.id)}
							{@const badge = getDeadlineBadge(project)}
							<li class="flex flex-wrap items-center gap-3 px-6 py-3">
								<!-- Title link -->
								<a
									href="/ProjectTracker"
									class="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400"
									aria-label="跳转到项目：{project.title}">{project.title}</a
								>

								<!-- Deadline badge -->
								{#if badge}
									<span
										class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold {badge.bg} {badge.text_}"
									>
										{badge.text}
									</span>
								{/if}

								<!-- Notes count -->
								<span
									class="shrink-0 text-xs text-gray-400 dark:text-gray-500"
									aria-label="{project.notes.length} 条笔记"
								>
									📝 {project.notes.length}
								</span>

								<!-- Inline add-note -->
								<button
									onclick={() => toggleNoteInput(project.id)}
									class="shrink-0 rounded-md border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400"
									aria-label="为 {project.title} 添加笔记">+ 笔记</button
								>

								{#if noteInputVisible[project.id]}
									<div class="mt-1 flex w-full gap-2">
										<input
											type="text"
											bind:value={noteInputValues[project.id]}
											placeholder="输入笔记… Enter 提交，Esc 取消"
											class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
											onkeydown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													submitNote(project);
												}
												if (e.key === 'Escape') toggleNoteInput(project.id);
											}}
										/>
										<button
											onclick={() => submitNote(project)}
											class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
											aria-label="提交笔记">添加</button
										>
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- ── Filter / sort toolbar ────────────────────────────────────────── -->
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div
					class="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800"
				>
					{#each ['all', 'active', 'completed', 'overdue'] as const as f}
						<button
							onclick={() => (filter = f)}
							class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors
								{filter === f
								? 'bg-blue-600 text-white shadow-sm'
								: 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}"
							aria-pressed={filter === f}
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

				<div class="flex items-center gap-2">
					<button
						onclick={() => (sortAsc = !sortAsc)}
						class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
						aria-label="切换截止时间排序方向"
					>
						{sortAsc ? '↑' : '↓'} 截止时间
					</button>
					<button
						onclick={exportCSV}
						class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
						aria-label="导出为 CSV"
					>
						⬇ CSV
					</button>
				</div>
			</div>

			<!-- ── Project cards grid ───────────────────────────────────────────── -->
			{#if cardProjects.length === 0}
				<div
					class="rounded-xl border-2 border-dashed border-gray-200 py-14 text-center text-gray-400 dark:border-gray-700"
				>
					<p class="text-2xl">🔍</p>
					<p class="mt-2 text-sm">没有符合条件的项目</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each cardProjects as project (project.id)}
						{@const badge = getDeadlineBadge(project)}
						<div
							class="flex flex-col rounded-xl border-2 bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800
								{cardBorderClass(project)}
								{project.status === 'completed' ? 'opacity-65' : ''}"
						>
							<!-- Card body -->
							<div class="flex flex-1 flex-col p-5">
								<!-- Title + status badge -->
								<div class="mb-2 flex items-start gap-2">
									<h3
										class="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-white
										{project.status === 'completed' ? 'line-through decoration-gray-400' : ''}"
									>
										{project.title}
									</h3>
									{#if project.status === 'completed'}
										<span
											class="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400"
										>
											✓
										</span>
									{/if}
								</div>

								<!-- Description preview -->
								{#if project.description}
									<p class="mb-3 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
										{project.description}
									</p>
								{/if}

								<!-- Deadline badge -->
								{#if badge}
									<span
										class="mb-3 self-start rounded-full px-2 py-0.5 text-[10px] font-semibold {badge.bg} {badge.text_}"
									>
										{badge.text}
									</span>
								{/if}

								<!-- Mini progress (notes as proxy) -->
								<div class="mb-1 flex items-center gap-2">
									<span class="text-xs text-gray-400 dark:text-gray-500">笔记</span>
									<div
										class="flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"
										style="height:4px"
									>
										<div
											class="h-full rounded-full bg-blue-500"
											style="width: {project.notes.length > 0
												? Math.min(project.notes.length * 20, 100)
												: 0}%"
										></div>
									</div>
									<span class="text-xs text-gray-400 dark:text-gray-500"
										>{project.notes.length}</span
									>
								</div>

								<!-- Inline add-note (in card) -->
								{#if noteInputVisible[project.id]}
									<div class="mt-2 flex gap-1">
										<input
											type="text"
											bind:value={noteInputValues[project.id]}
											placeholder="笔记… Enter 提交"
											class="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
											onkeydown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													submitNote(project);
												}
												if (e.key === 'Escape') toggleNoteInput(project.id);
											}}
										/>
										<button
											onclick={() => submitNote(project)}
											class="rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
											aria-label="提交笔记">↵</button
										>
									</div>
								{/if}
							</div>

							<!-- Card actions footer -->
							<div
								class="flex flex-wrap gap-1.5 border-t border-gray-100 px-4 py-3 dark:border-gray-700"
							>
								<!-- Toggle complete -->
								<button
									onclick={() => projectStore.toggleStatus(project.id)}
									class="rounded-md border px-2 py-1 text-xs font-medium transition-colors
										{project.status === 'completed'
										? 'border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400'
										: 'border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600 dark:border-gray-600 dark:text-gray-400'}"
									aria-label="{project.status === 'completed'
										? '标记为进行中'
										: '标记为已完成'}: {project.title}"
								>
									{project.status === 'completed' ? '↺' : '✓'}
								</button>

								<!-- Add note -->
								<button
									onclick={() => toggleNoteInput(project.id)}
									class="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400"
									aria-label="为 {project.title} 添加笔记">📝</button
								>

								<!-- Jump to project -->
								<a
									href="/ProjectTracker"
									class="ml-auto rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400"
									aria-label="在项目追踪页打开: {project.title}">→</a
								>

								<!-- Delete -->
								<button
									onclick={() => {
										if (confirm(`确定要删除"${project.title}"吗？`)) {
											projectStore.removeProject(project.id);
										}
									}}
									class="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-red-400 hover:border-red-400 hover:bg-red-50 dark:border-gray-600 dark:text-red-500"
									aria-label="删除项目: {project.title}">✕</button
								>
							</div>
						</div>
					{/each}
				</div>

				{#if filteredProjects.length > MAX_CARDS}
					<p class="text-center text-xs text-gray-400 dark:text-gray-600">
						只显示前 {MAX_CARDS} 个项目，共 {filteredProjects.length} 个。前往
						<a href="/ProjectTracker" class="text-blue-500 hover:underline">项目追踪</a> 查看全部。
					</p>
				{/if}
			{/if}
		</div>
	</main>
</div>
