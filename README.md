![Logo for ZhuYi](assets/header-dark.png) 

![GitHub top language](https://img.shields.io/github/languages/top/vk22006/OneThing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

欢迎来到**逐一**!

逐一（ZhuYi）是 OneThing 的中文实验版。它是一个小型的生产力工具，目标是帮助我记录任务、跟踪项目和查看进度，支持离线优先，未来计划打包成桌面应用。

## 目前功能（已/在做）

* 待办列表（Todo）—— 增、删、改、查，支持本地持久化保存。
* 项目追踪（Project Tracker）—— 支持多项目管理、设定截止时间提醒、内置轻量笔记，数据基于 `localStorage` 本地保存。
* 进度看板（Progress Dashboard）—— 提供项目状态统计、整体进度条可视化、临近截止提醒以及数据一键导出为 CSV 格式。
* 设置页面（Settings）—— 页面已建，选项待补充。
* 离线优先设计（目标）—— 计划使用 IndexedDB 实现本地持久化和增强的离线体验。
* 桌面打包（目标）—— 计划用 Tauri 打包成桌面应用。
* 导入 / 导出（在做）—— 已支持将项目数据单向导出为 CSV，计划后续完善完整的 JSON/CSV 导入导出。

## 技术栈

* 前端：SvelteKit + Vite
* 样式：Tailwind CSS + Flowbite（flowbite-svelte）
* 本地存储：localStorage / IndexedDB（后续）
* 打包（目标）：Tauri（桌面）

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