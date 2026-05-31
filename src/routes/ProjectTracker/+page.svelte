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
		ClipboardOutline,
		AnnotationOutline,
		CloseOutline,
		CheckOutline,
		RefreshOutline,
		PlusOutline,
		EditOutline,
		TrashBinOutline,
		ChevronUpOutline,
		ChevronDownOutline,
		ClockOutline,
		LockOutline
	} from 'flowbite-svelte-icons';

	let activeUrl = $derived($page.url.pathname);

	// ── New project form ──────────────────────────────────────────────────────
	let newTitle = $state('');
	let newDesc = $state('');
	let newDeadline = $state('');

	function localToISO(local: string): string | undefined {
		if (!local) return undefined;
		return new Date(local).toISOString();
	}

	// ── Focus project logic ───────────────────────────────────────────────────
	// focusProjectId tracks which project is currently the "active focus".
	// Initially it is the first (oldest) project in the store.
	// It is persisted in sessionStorage so it survives page navigation within
	// the same session but resets on reload (intentionally lightweight).
	let focusProjectId = $state<string | null>(null);

	// Switch-focus dialog state
	let switchDialogPending = $state<{ newProject: Project; currentProject: Project } | null>(null);

	// Projects sorted by creation time (ascending) — oldest first
	let sortedByCreation = $derived(
		[...$projectStore].sort(
			(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
		)
	);

	// On first load (or when store is hydrated), seed the focusProjectId
	$effect(() => {
		if (sortedByCreation.length > 0 && focusProjectId === null) {
			focusProjectId = sortedByCreation[0].id;
		}
		// If the focused project was deleted, fall back to the oldest remaining
		if (
			focusProjectId !== null &&
			!sortedByCreation.find((p) => p.id === focusProjectId)
		) {
			focusProjectId = sortedByCreation[0]?.id ?? null;
		}
	});

	// Derived: the project we are currently focused on
	let focusProject = $derived(
		sortedByCreation.find((p) => p.id === focusProjectId) ?? null
	);

	// Whether the multi-project focus banner should show
	let showFocusBanner = $derived($projectStore.length > 1);

	function isDisabled(project: Project): boolean {
		if ($projectStore.length <= 1) return false;
		return project.id !== focusProjectId;
	}

	// Called after addProject; checks if the newly created project has a sooner deadline
	function checkDeadlineSwitchPrompt(newProject: Project) {
		if (!focusProject) return;
		if (!newProject.deadline) return; // New project has no deadline → no reason to switch
		const newDeadlineMs = new Date(newProject.deadline).getTime();
		const currentDeadlineMs = focusProject.deadline
			? new Date(focusProject.deadline).getTime()
			: Infinity;
		if (newDeadlineMs < currentDeadlineMs) {
			switchDialogPending = { newProject, currentProject: focusProject };
		}
	}

	function handleAddProject(e: Event) {
		e.preventDefault();
		if (!newTitle.trim()) return;

		// Capture count before adding
		const beforeCount = $projectStore.length;

		projectStore.addProject({
			title: newTitle.trim(),
			description: newDesc.trim() || undefined,
			deadline: localToISO(newDeadline)
		});

		// After addProject the store updates reactively; we need the new project object.
		// We use a microtask to let the store settle first.
		const capturedTitle = newTitle.trim();
		const capturedDeadline = localToISO(newDeadline);

		newTitle = '';
		newDesc = '';
		newDeadline = '';

		// Only check for switch if we already had at least one project
		if (beforeCount >= 1 && capturedDeadline) {
			// The new project will have been pushed to the store; find it by title + deadline
			setTimeout(() => {
				const newest = [...$projectStore].sort(
					(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				)[0];
				if (newest && newest.title === capturedTitle && newest.deadline === capturedDeadline) {
					checkDeadlineSwitchPrompt(newest);
				}
			}, 0);
		}
	}

	function confirmSwitch() {
		if (switchDialogPending) {
			focusProjectId = switchDialogPending.newProject.id;
		}
		switchDialogPending = null;
	}

	function declineSwitch() {
		switchDialogPending = null;
	}

	// ── Filter & sort state ───────────────────────────────────────────────────
	type Filter = 'all' | 'active' | 'completed' | 'overdue';
	let filter = $state<Filter>('all');
	let sortAsc = $state(true);

	let displayProjects = $derived.by(() => {
		let list = [...$projectStore];
		if (filter === 'active') list = list.filter((p) => p.status === 'active');
		else if (filter === 'completed') list = list.filter((p) => p.status === 'completed');
		else if (filter === 'overdue') list = list.filter(isOverdue);
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
	let deadlineInputs = $state<Record<string, string>>({});

	function isoToDatetimeLocal(iso: string | undefined): string {
		if (!iso) return '';
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

	function deleteProject(id: string) {
		if (confirm('确定要删除该项目吗？此操作不可撤销。')) {
			projectStore.removeProject(id);
			if (expandedId === id) expandedId = null;
		}
	}

	function cardBorder(p: Project): string {
		if (isDisabled(p)) return 'border-gray-200 dark:border-gray-700';
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
		// Normal deadline: use neutral colors to avoid confusion with primary (red-orange)
		return {
			text: formatDeadline(p.deadline),
			cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
		};
	}
</script>

<AppShell {activeUrl}>
	<Header title="你的项目" />

	<div class="mx-auto max-w-3xl space-y-5 pb-6">
		<!-- Stats bar -->
		<div class="flex flex-wrap gap-3">
			<span class="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">总数 <strong>{stats.total}</strong></span>
			<span class="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">进行中 <strong>{stats.active}</strong></span>
			<span class="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">已过期 <strong>{stats.overdue}</strong></span>
			<span class="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">即将到期 <strong>{stats.dueSoon}</strong></span>
			<span class="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">已完成 <strong>{stats.completed}</strong></span>
		</div>

		<!-- New project form -->
		<form
			onsubmit={handleAddProject}
			class="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
		>
			<!-- Focus banner — shown only when multiple projects exist -->
			{#if showFocusBanner}
				<div class="mb-4 flex items-center justify-center rounded-lg bg-amber-50 px-4 py-2.5 text-center text-sm font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-700/50">
					让我们一次只专注于一个项目！
				</div>
			{/if}

			<h2 class="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
				新建项目
			</h2>
			<div class="flex flex-col gap-3">
				<div>
					<label for="new-title" class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
						项目标题 <span class="text-primary-500">*</span>
					</label>
					<input
						id="new-title"
						type="text"
						bind:value={newTitle}
						placeholder="比如：毕业设计"
						required
						class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-primary-800"
					/>
				</div>
				<div class="flex gap-3">
					<div class="flex-1">
						<label for="new-desc" class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">描述（可选）</label>
						<input
							id="new-desc"
							type="text"
							bind:value={newDesc}
							placeholder="简要描述项目目标"
							class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-primary-800"
						/>
					</div>
					<div>
						<label for="new-deadline" class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">截止时间（可选）</label>
						<input
							id="new-deadline"
							type="datetime-local"
							bind:value={newDeadline}
							class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-primary-800"
						/>
					</div>
				</div>
				<button
					type="submit"
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 focus:outline-none dark:focus:ring-primary-800"
				>
					<PlusOutline class="h-4 w-4" /> 添加项目
				</button>
			</div>
		</form>

		<!-- Switch-focus dialog -->
		{#if switchDialogPending}
			<div
				class="rounded-xl border border-amber-300 bg-amber-50 p-5 shadow-md dark:border-amber-700 dark:bg-amber-900/20"
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="switch-dialog-title"
			>
				<p id="switch-dialog-title" class="mb-1 font-semibold text-amber-800 dark:text-amber-200">
					新项目截止更早！
				</p>
				<p class="mb-4 text-sm text-amber-700 dark:text-amber-300">
					「{switchDialogPending.newProject.title}」的截止时间比当前聚焦项目「{switchDialogPending.currentProject.title}」更早。要将专注切换到新项目吗？
				</p>
				<div class="flex gap-3">
					<button
						onclick={confirmSwitch}
						class="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
					>
						<CheckOutline class="h-4 w-4" /> 是，切换专注
					</button>
					<button
						onclick={declineSwitch}
						class="flex items-center gap-1.5 rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/40"
					>
						<CloseOutline class="h-4 w-4" /> 否，保持原项目
					</button>
				</div>
			</div>
		{/if}

		<!-- Filter + Sort toolbar -->
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div class="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
				{#each ['all', 'active', 'completed', 'overdue'] as const as f}
					<button
						onclick={() => (filter = f)}
						class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors {filter === f
							? 'bg-primary-600 text-white shadow-sm'
							: 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}"
					>
						{f === 'all' ? '全部' : f === 'active' ? '进行中' : f === 'completed' ? '已完成' : '已过期'}
					</button>
				{/each}
			</div>
			<button
				onclick={() => (sortAsc = !sortAsc)}
				class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
			>
				{#if sortAsc}
					<ChevronUpOutline class="h-3.5 w-3.5" />
				{:else}
					<ChevronDownOutline class="h-3.5 w-3.5" />
				{/if}
				截止时间
			</button>
		</div>

		<!-- Project card list -->
		{#if displayProjects.length === 0}
			<div class="rounded-xl border-2 border-dashed border-gray-200 py-14 text-center text-gray-400 dark:border-gray-700">
				<ClipboardOutline class="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
				<p class="mt-2 text-sm">没有项目。在上面创建一个吧！</p>
			</div>
		{:else}
			<ul class="space-y-4">
				{#each displayProjects as project (project.id)}
					{@const label = deadlineLabel(project)}
					{@const isExpanded = expandedId === project.id}
					{@const isEditing = editingId === project.id}
					{@const disabled = isDisabled(project)}
					<li
						class="rounded-xl border-2 bg-white shadow-sm transition-all dark:bg-gray-800 {cardBorder(project)} {project.status === 'completed' ? 'opacity-70' : ''} {disabled ? 'opacity-50 grayscale' : ''}"
					>
						<!-- Locked overlay label -->
						{#if disabled}
							<div class="flex items-center gap-2 rounded-t-xl border-b border-gray-100 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-900/60">
								<LockOutline class="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
								<span class="text-xs font-medium text-gray-400 dark:text-gray-500">当前已锁定 · 专注完成当前项目后可访问</span>
							</div>
						{/if}

						<!-- Card header -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
						<div
							class="p-4 select-none {disabled ? 'cursor-not-allowed' : 'cursor-pointer'}"
							role="button"
							tabindex={disabled ? -1 : 0}
							onclick={() => { if (!isEditing && !disabled) { toggleExpand(project.id); initDeadlineInput(project); } }}
							onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!isEditing && !disabled) { toggleExpand(project.id); initDeadlineInput(project); } } }}
						>
							<div class="flex items-start justify-between gap-4">
								<!-- Title / edit form -->
								<div class="min-w-0 flex-1">
									{#if isEditing}
										<div class="flex flex-col gap-2" onclick={(e) => e.stopPropagation()} role="presentation">
											<input type="text" bind:value={editTitle} required class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="项目标题" onkeydown={(e) => e.key === 'Enter' && saveEdit(project)} />
											<input type="text" bind:value={editDesc} class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="描述（可选）" onkeydown={(e) => e.key === 'Enter' && saveEdit(project)} />
											<div class="flex gap-2">
												<button onclick={(e) => { e.stopPropagation(); saveEdit(project); }} class="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"><CheckOutline class="h-3 w-3" /> 保存</button>
												<button onclick={(e) => { e.stopPropagation(); editingId = null; }} class="flex items-center gap-1 rounded-md bg-gray-400 px-3 py-1 text-xs font-medium text-white hover:bg-gray-500"><CloseOutline class="h-3 w-3" /> 取消</button>
											</div>
										</div>
									{:else}
										<p class="truncate font-semibold text-gray-900 dark:text-white {project.status === 'completed' ? 'line-through decoration-gray-400' : ''}">{project.title}</p>
										{#if project.description}
											<p class="mt-0.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
										{/if}
									{/if}
								</div>

								<!-- Right meta -->
								{#if !isEditing}
									<div class="flex shrink-0 flex-col items-end gap-2">
										{#if project.status === 'completed'}
											<span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">COMPLETED</span>
										{/if}
										{#if label.text}
											<span class="rounded-full px-2 py-0.5 text-xs font-semibold {label.cls}">{label.text}</span>
										{/if}
										{#if project.notes.length > 0}
											<span class="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
												<AnnotationOutline class="h-3 w-3" /> {project.notes.length}
											</span>
										{/if}
									</div>
								{/if}
							</div>

							<!-- Action buttons row — hidden for disabled (locked) projects -->
							{#if !isEditing && !disabled}
								<div class="mt-3 flex flex-wrap gap-2" onclick={(e) => e.stopPropagation()} role="presentation">
									<button onclick={(e) => { e.stopPropagation(); startEdit(project); expandedId = project.id; }} class="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-primary-400 hover:text-primary-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-primary-500 dark:hover:text-primary-400">
										<EditOutline class="h-3 w-3" /> 编辑
									</button>
									<button onclick={(e) => { e.stopPropagation(); toggleExpand(project.id); initDeadlineInput(project); }} class="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-primary-400 hover:text-primary-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-primary-500 dark:hover:text-primary-400">
										<AnnotationOutline class="h-3 w-3" /> 笔记
									</button>
									<button onclick={(e) => { e.stopPropagation(); projectStore.toggleStatus(project.id); }} class="flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors {project.status === 'completed' ? 'border-green-300 text-green-600 hover:border-green-400 hover:bg-green-50 dark:border-green-700 dark:text-green-400' : 'border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-green-500 dark:hover:text-green-400'}">
										{#if project.status === 'completed'}
											<RefreshOutline class="h-3 w-3" /> 重新开始
										{:else}
											<CheckOutline class="h-3 w-3" /> 完成
										{/if}
									</button>
									<button onclick={(e) => { e.stopPropagation(); deleteProject(project.id); }} class="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-red-500 dark:hover:text-red-400">
										<TrashBinOutline class="h-3 w-3" /> 删除
									</button>
								</div>
							{/if}
						</div>

						<!-- Expanded detail panel — only for non-disabled projects -->
						{#if isExpanded && !isEditing && !disabled}
							<div class="border-t border-gray-100 px-4 pt-4 pb-4 dark:border-gray-700">
								{#if project.description}
									<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">{project.description}</p>
								{/if}

								<!-- Deadline editor -->
								<div class="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
									<p class="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
										<ClockOutline class="h-3.5 w-3.5" /> 截止时间
									</p>
									<div class="flex flex-wrap items-center gap-2">
										<input type="datetime-local" bind:value={deadlineInputs[project.id]} class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
										<button onclick={() => applyDeadline(project)} class="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700">更新</button>
										{#if project.deadline}
											<button onclick={() => { projectStore.setDeadline(project.id, null); deadlineInputs[project.id] = ''; }} class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:text-gray-200">清除截止时间</button>
										{/if}
									</div>
								</div>

								<!-- Notes -->
								<div>
									<p class="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
										<AnnotationOutline class="h-3.5 w-3.5" /> 笔记
									</p>
									<div class="mb-3 flex gap-2">
										<input type="text" bind:value={noteInputs[project.id]} placeholder="添加笔记… (Enter 提交)" class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitNote(project); } }} />
										<button onclick={() => submitNote(project)} class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">添加</button>
									</div>
									{#if project.notes.length === 0}
										<p class="text-sm text-gray-400 italic dark:text-gray-600">暂无笔记</p>
									{:else}
										<ul class="space-y-2">
											{#each [...project.notes].reverse() as note (note.id)}
												<li class="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900">
													<span class="flex-1 text-gray-700 dark:text-gray-300">{note.text}</span>
													<span class="shrink-0 text-xs text-gray-400">{new Date(note.createdAt).toLocaleDateString('zh-CN')}</span>
													<button onclick={() => projectStore.removeNote(project.id, note.id)} class="shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400" title="删除笔记">
														<CloseOutline class="h-3.5 w-3.5" />
													</button>
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
</AppShell>
