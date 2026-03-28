![ZhuYi Title Banner](assets/header-dark.png) 

![GitHub top language](https://img.shields.io/github/languages/top/vk22006/OneThing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

欢迎来到**逐一**!

逐一（ZhuYi）是 OneThing 的中文实验版。它是一个小型的生产力工具，目标是帮助我记录任务、跟踪项目和查看进度，支持离线优先，未来计划打包成桌面应用。

## 目前功能 (Features)

- ✅ **待办列表 (Todo)** —— 增、删、改、查，支持本地持久化保存。
- ✅ **桌面原生通知** —— 基于 Tauri v2 实现的桌面级通知，当你完成任务或新建项目时会弹出系统提醒。
- ✅ **项目追踪 (Project Tracker)** —— 支持多项目管理、设定截止时间、内置轻量笔记，数据基于 `localStorage` 本地安全保存。
- ✅ **进度看板 (Progress Dashboard)** —— 直观的项目状态统计、整体进度条可视化、临近到期提醒，支持将数据一键导出为 CSV 格式。
- ⬜ **导入/导出** —— 已支持单向导出为主流 CSV 格式，计划后续增加完整的 JSON/CSV 数据导入恢复。
- ⬜ **数据存储升级** —— 目前为离线优先的本地存储版本，计划后续引入 IndexedDB 支持。
- ✅ **专属设置页** —— 提供基本配置的基础版本，更多自定义选项正在补充完善中。

![Main screen (initial version)](assets/main_page.gif)

## 技术栈

* 前端：SvelteKit + Vite
* 样式：Tailwind CSS + Flowbite（flowbite-svelte）
* 本地存储：localStorage / IndexedDB（后续）
* 桌面应用：Tauri v2 + Rust（支持 Windows 安装包）

## 颜色主题

目前有两种颜色主题可供选择，具体如下：

1. 深色主题

![Dark theme](assets/dark_theme.png)

2. 浅色主题

![Light theme](assets/light_theme.png)

## 快速开始（本地运行）

1. 克隆仓库

```bash
git clone https://github.com/vk22006/ZhuYi.git
cd ZhuYi
```

2. 安装依赖并运行开发服务器

```bash
npm install
npm run dev
```

3. 打开浏览器访问 `http://localhost:5173`（或终端显示的地址）

## 项目现状（短句）

* UI 框架和主题已搭好（SvelteKit + Tailwind + Flowbite）。
* 核心功能逐步齐备：主页 Todo 列表、Project Tracker 项目追踪以及 Progress Dashboard 进度统计系统，都已实现完整的界面逻辑并由本地存储驱动。
* **v1.0.0 已正式发布！** 现在它是一个完整的桌面应用，能够在你完成任务时发送 Windows 桌面通知。

## 短期计划（下一个里程碑）

1. 完善 Settings 页面选项。
2. 为数据层添加 IndexedDB 支持，由目前的 localStorage 转向更稳固的离线优先架构。
3. 加入简单测试与 CI（Vitest + GitHub Actions）。
4. 部署一个在线 Demo（Vercel / Netlify），并在 README 加 Demo 链接。

## 如何贡献

* 提 issue 或 PR，说明变更点和测试步骤。
* 分支命名示例：`feature/<短描述>` 或 `fix/<短描述>`。
* 保持代码格式（仓库有 Prettier 配置）。

## 许可证与联系方式

* 许可证：MIT。
* 作者：vk22006 — 欢迎提 issue 或 PR。