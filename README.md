![Logo for ZhuYi](assets/header-dark.png) 

![GitHub top language](https://img.shields.io/github/languages/top/vk22006/OneThing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

欢迎来到**逐一**!

逐一（ZhuYi）是 OneThing 的中文实验版。它是一个小型的生产力工具，目标是帮助我记录任务、跟踪项目和查看进度，支持离线优先，未来计划打包成桌面应用。

## 目前功能（已/在做）

* 待办列表（Todo）—— 增、删、改、查，支持本地保存。
* 进度看板（Progress Dashboard）—— 页面框架已建，内容正在开发。
* 项目追踪（Project Tracker）—— 页面结构已放好，业务逻辑待实现。
* 设置页面（Settings）—— 页面已建，选项待补充。
* 离线优先设计（目标）—— 计划使用 IndexedDB / localForage 实现本地持久化和离线体验。
* 桌面打包（目标）—— 计划用 Tauri 打包成桌面应用。
* 导入 / 导出（后续）—— 支持 JSON/CSV 的导入导出计划中。

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
* 页面框架：主页、Progress Dashboard、Project Tracker、Settings 都已创建。
* 核心功能（如 Todo 的持久化、Dashboard 逻辑、项目数据模型）还在实现中。

## 短期计划（下一个里程碑）

1. 把 Todo 的 CRUD 与本地持久化稳定好（MVP）。
2. 完成 Progress Dashboard 的基础视图和数据展示。
3. 为数据添加 IndexedDB 支持，实现离线优先。
4. 加入简单测试与 CI（Vitest + GitHub Actions）。
5. 部署一个在线 Demo（Vercel / Netlify），并在 README 加 Demo 链接。

## 如何贡献

* 提 issue 或 PR，说明变更点和测试步骤。
* 分支命名示例：`feature/<短描述>` 或 `fix/<短描述>`。
* 保持代码格式（仓库有 Prettier 配置）。

## 许可证与联系方式

* 许可证：MIT。
* 作者：vk22006 — 欢迎提 issue 或 PR。