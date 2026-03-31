<script lang="ts">
	import AppShell from '../AppShell.svelte';
	import Header from '../Header.svelte';
	import { page } from '$app/stores';
	import {
		projectStore,
		isOverdue,
		isDueSoon,
		formatDeadline,
		getStats,
		type Project
	} from '$lib/projectStore';
	import {
		FolderOpenOutline,
		RocketOutline,
		CheckCircleOutline,
		CloseCircleOutline,
		ClockOutline,
		AnnotationOutline,
		SearchOutline,
		RefreshOutline,
		CheckOutline,
		ArrowRightOutline,
		CloseOutline
	} from 'flowbite-svelte-icons';

	// ── Config ────────────────────────────────────────────────────────────────
	const MAX_CARDS = 8;
	const MAX_UPCOMING = 5;

	let activeUrl = $derived($page.url.pathname);

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

	let completionPct = $derived(
		allProjects.length === 0 ? 0 : Math.round((stats.completed / allProjects.length) * 100)
	);

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

	let upcoming = $derived(
		sortByDeadline(
			allProjects.filter((p) => p.deadline && p.status !== 'completed'),
			true
		).slice(0, MAX_UPCOMING)
	);

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
			bg: 'bg-primary-50 dark:bg-primary-900/20',
			text_: 'text-primary-700 dark:text-primary-400'
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
		const headers = ['ID', 'Title', 'Description', 'Status', 'Deadline', 'Notes', 'Created', 'Updated'];
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
		{ label: '全部项目', value: stats.total, icon: FolderOpenOutline, color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700' },
		{ label: '进行中', value: stats.active, icon: RocketOutline, color: 'text-primary-700 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20', border: 'border-primary-200 dark:border-primary-800' },
		{ label: '已完成', value: stats.completed, icon: CheckCircleOutline, color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
		{ label: '已过期', value: stats.overdue, icon: CloseCircleOutline, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' }
	]);
</script>

<AppShell {activeUrl}>
	<Header title="你的进步" />

	<div class="mx-auto max-w-5xl space-y-5 pb-6">
		<!-- Last updated -->
		<p class="text-center text-xs text-gray-400 dark:text-gray-600">
			{#if lastUpdated}最后更新：{lastUpdated}{:else}暂无项目数据{/if}
		</p>

		<!-- Stat cards -->
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
			{#each statCards as card}
				{@const Icon = card.icon}
				<div class="rounded-xl border {card.border} {card.bg} p-4 shadow-sm">
					<div class="flex items-center gap-3">
						<div class={card.color} aria-hidden="true">
							<Icon class="h-8 w-8" />
						</div>
						<div>
							<p class="text-2xl font-bold {card.color}">{card.value}</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Progress bar -->
		<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
			<div class="mb-3 flex items-center justify-between">
				<span class="text-sm font-semibold text-gray-700 dark:text-gray-300">项目完成进度</span>
				<span class="text-lg font-bold text-primary-600 dark:text-primary-400">{completionPct}%</span>
			</div>
			<div class="relative h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
				<div
					class="h-full rounded-full bg-gradient-to-r from-primary-500 to-rose-500 transition-all duration-700"
					style="width: {completionPct}%"
					role="progressbar"
					aria-valuenow={completionPct}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-label="项目完成进度 {completionPct}%"
				></div>
			</div>
			<div class="mt-4 flex flex-wrap gap-2">
				<span class="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">进行中 {stats.active}</span>
				<span class="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">已完成 {stats.completed}</span>
				<span class="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">已过期 {stats.overdue}</span>
				<span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">即将到期 {stats.dueSoon}</span>
			</div>
		</div>

		<!-- Upcoming deadlines -->
		{#if upcoming.length > 0}
			<div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
				<div class="border-b border-gray-100 px-5 py-3 dark:border-gray-700">
					<h2 class="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
						<ClockOutline class="h-4 w-4 text-amber-500" />
						即将到期（最近 {upcoming.length} 个）
					</h2>
				</div>
				<ul class="divide-y divide-gray-100 dark:divide-gray-700">
					{#each upcoming as project (project.id)}
						{@const badge = getDeadlineBadge(project)}
						<li class="flex flex-wrap items-center gap-3 px-5 py-3">
							<a href="/ProjectTracker" class="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 hover:text-primary-600 dark:text-gray-200 dark:hover:text-primary-400" aria-label="跳转到项目：{project.title}">{project.title}</a>
							{#if badge}
								<span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold {badge.bg} {badge.text_}">{badge.text}</span>
							{/if}
							<span class="flex shrink-0 items-center gap-1 text-xs text-gray-400 dark:text-gray-500" aria-label="{project.notes.length} 条笔记">
								<AnnotationOutline class="h-3 w-3" />
								{project.notes.length}
							</span>
							<button onclick={() => toggleNoteInput(project.id)} class="flex shrink-0 items-center gap-1 rounded-md border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:border-primary-400 hover:text-primary-600 dark:border-gray-600 dark:text-gray-400" aria-label="为 {project.title} 添加笔记">
								<AnnotationOutline class="h-3 w-3" />
								笔记
							</button>
							{#if noteInputVisible[project.id]}
								<div class="mt-1 flex w-full gap-2">
									<input type="text" bind:value={noteInputValues[project.id]} placeholder="输入笔记… Enter 提交，Esc 取消" class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white" onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitNote(project); } if (e.key === 'Escape') toggleNoteInput(project.id); }} />
									<button onclick={() => submitNote(project)} class="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700" aria-label="提交笔记">添加</button>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Filter / sort toolbar -->
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div class="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800">
				{#each ['all', 'active', 'completed', 'overdue'] as const as f}
					<button
						onclick={() => (filter = f)}
						class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors {filter === f ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}"
						aria-pressed={filter === f}
					>
						{f === 'all' ? '全部' : f === 'active' ? '进行中' : f === 'completed' ? '已完成' : '已过期'}
					</button>
				{/each}
			</div>
			<div class="flex items-center gap-2">
				<button onclick={() => (sortAsc = !sortAsc)} class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700" aria-label="切换截止时间排序方向">
					{sortAsc ? '↑' : '↓'} 截止时间
				</button>
				<button onclick={exportCSV} class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700" aria-label="导出为 CSV">
					⬇ CSV
				</button>
			</div>
		</div>

		<!-- Project cards grid -->
		{#if cardProjects.length === 0}
			<div class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-14 text-center text-gray-400 dark:border-gray-700">
				<SearchOutline class="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
				<p class="text-sm">没有符合条件的项目</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each cardProjects as project (project.id)}
					{@const badge = getDeadlineBadge(project)}
					<div
						class="flex flex-col rounded-xl border-2 bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800
							{cardBorderClass(project)}
							{project.status === 'completed' ? 'opacity-65' : ''}"
					>
						<!-- Card body -->
						<div class="flex flex-1 flex-col p-4">
							<!-- Title + status badge -->
							<div class="mb-2 flex items-start gap-2">
								<h3 class="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-white {project.status === 'completed' ? 'line-through decoration-gray-400' : ''}">
									{project.title}
								</h3>
								{#if project.status === 'completed'}
									<span class="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">✓</span>
								{/if}
							</div>

							{#if project.description}
								<p class="mb-3 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{project.description}</p>
							{/if}

							{#if badge}
								<span class="mb-3 self-start rounded-full px-2 py-0.5 text-[10px] font-semibold {badge.bg} {badge.text_}">{badge.text}</span>
							{/if}

							<!-- Notes mini progress -->
							<div class="mb-1 flex items-center gap-2">
								<span class="text-xs text-gray-400 dark:text-gray-500">笔记</span>
								<div class="flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700" style="height:4px">
									<div class="h-full rounded-full bg-primary-500" style="width: {project.notes.length > 0 ? Math.min(project.notes.length * 20, 100) : 0}%"></div>
								</div>
								<span class="text-xs text-gray-400 dark:text-gray-500">{project.notes.length}</span>
							</div>

							{#if noteInputVisible[project.id]}
								<div class="mt-2 flex gap-1">
									<input type="text" bind:value={noteInputValues[project.id]} placeholder="笔记… Enter 提交" class="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:border-primary-500 focus:ring-1 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white" onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitNote(project); } if (e.key === 'Escape') toggleNoteInput(project.id); }} />
									<button onclick={() => submitNote(project)} class="rounded-lg bg-primary-600 px-2 py-1 text-xs font-medium text-white hover:bg-primary-700" aria-label="提交笔记">↵</button>
								</div>
							{/if}
						</div>

						<!-- Card actions footer -->
						<div class="flex flex-wrap gap-1.5 border-t border-gray-100 px-3 py-2 dark:border-gray-700">
							<button onclick={() => projectStore.toggleStatus(project.id)} class="flex items-center justify-center rounded-md border px-2 py-1 transition-colors {project.status === 'completed' ? 'border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400' : 'border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600 dark:border-gray-600 dark:text-gray-400'}" aria-label="{project.status === 'completed' ? '标记为进行中' : '标记为已完成'}: {project.title}">
								{#if project.status === 'completed'}
									<RefreshOutline class="h-3.5 w-3.5" />
								{:else}
									<CheckOutline class="h-3.5 w-3.5" />
								{/if}
							</button>
							<button onclick={() => toggleNoteInput(project.id)} class="flex items-center justify-center rounded-md border border-gray-200 px-2 py-1 text-gray-500 hover:border-primary-400 hover:text-primary-600 dark:border-gray-600 dark:text-gray-400" aria-label="为 {project.title} 添加笔记">
								<AnnotationOutline class="h-3.5 w-3.5" />
							</button>
							<a href="/ProjectTracker" class="ml-auto flex items-center justify-center rounded-md border border-gray-200 px-2 py-1 text-gray-500 hover:border-primary-400 hover:text-primary-600 dark:border-gray-600 dark:text-gray-400" aria-label="在项目追踪页打开: {project.title}">
								<ArrowRightOutline class="h-3.5 w-3.5" />
							</a>
							<button onclick={() => { if (confirm(`确定要删除"${project.title}"吗？`)) { projectStore.removeProject(project.id); } }} class="flex items-center justify-center rounded-md border border-gray-200 px-2 py-1 text-red-400 hover:border-red-400 hover:bg-red-50 dark:border-gray-600 dark:text-red-500" aria-label="删除项目: {project.title}">
								<CloseOutline class="h-3.5 w-3.5" />
							</button>
						</div>
					</div>
				{/each}
			</div>

			{#if filteredProjects.length > MAX_CARDS}
				<p class="text-center text-xs text-gray-400 dark:text-gray-600">
					只显示前 {MAX_CARDS} 个项目，共 {filteredProjects.length} 个。前往 <a href="/ProjectTracker" class="text-primary-500 hover:underline">项目追踪</a> 查看全部。
				</p>
			{/if}
		{/if}
	</div>
</AppShell>
