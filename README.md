![Logo for ZhuYi](assets/header-dark.png) 

![GitHub top language](https://img.shields.io/github/languages/top/vk22006/OneThing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

欢迎来到**逐一**!

逐一（ZhuYi）是 OneThing 的中国版个人实验项目，目标是打造一款专注任务与进度管理、支持离线优先的桌面/网页生产力工具。

---

## 项目现状（Project status）

- **Scaffold & UI theme:** SvelteKit + Tailwind + Flowbite 已配置（landing 页面文本可见）。  
- **Implemented:** 基础项目结构、主题与样式 (`src/routes/layout.css`)。  
- **WIP / TODO:** Progress Dashboard、Project Tracker、Settings 页面需要实现（文件已存在但尚为空）。


## Features（短期目标）

- 离线优先的数据存储（IndexedDB / localForage）
- 任务进度面板（Progress Dashboard）
- 项目追踪器（Project Tracker）
- 导入/导出、同步（后续）
- 桌面封装（Tauri / Electron）


## 技术栈

- **Frontend:** SvelteKit, Vite.  
- **Styling:** Tailwind CSS, Flowbite / flowbite-svelte.  
- **Tools:** Node, npm.  
- **Scripts:** `dev`, `build`, `preview`（见 `package.json`）.


## 快速开始

1. 克隆仓库  
   `git clone https://github.com/vk22006/ZhuYi.git`
2. 进入目录并安装依赖

   ```bash
   cd ZhuYi
   npm install
   ```

3. 启动开发服务器

    ```bash
    npm run dev
    ```

4. 打开浏览器访问`http://localhost:5173`（或终端输出的地址）。
（如果需要同步SvelteKit配置：`npm run prepare`）.

## 项目结构

* `src/routes/+page.svelte` — 项目首页文字（当前显示一行欢迎文案）。
* `src/routes/ProgressDashboard/` — Progress Dashboard 页面（待实现）。
* `src/routes/ProjectTracker/` — Project Tracker 页面（待实现）。
* `src/routes/Settings/` — Settings 页面（待实现）。
* `src/routes/layout.css` — Tailwind / theme / flowbite 相关配置（颜色 & 插件）。


## Roadmap（短期里程碑）

1. 基本 Dashboard 界面与导航（已建页面框架） ✅
2. 本地数据模型 + IndexedDB 持久化
3. 离线优先 & 同步接口设计
4. 导入/导出（CSV / JSON）
5. 打包成桌面应用（Tauri）


## 如何贡献（Contributing）

1. 打开 issue 描述你的想法或 bug。
2. 认领 issue 后新建分支：`feature/<short-desc>` 或 `fix/<short-desc>`。
3. 提交 PR，说明变更与测试步骤。
4. 遵守 Prettier 格式（仓库已配置）。


## 截图

(在 `assets/` 加入更多截图或 GIF；如果已部署请放置 demo 链接。) 


## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE)。


## 联系

作者：vk22006 — 欢迎提 issue 或 PR。

