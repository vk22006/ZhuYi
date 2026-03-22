# 贡献指南（CONTRIBUTING）

感谢你想为 **逐一（ZhuYi）** 项目做贡献。

本项目现在还在开发中，所以欢迎提出建议、修复问题和添加功能。

## 开始之前

请先做下面的步骤：

1. Fork 这个仓库
2. 克隆你的 Fork

```bash
git clone https://github.com/YOUR_USERNAME/ZhuYi.git
cd ZhuYi
```

3. 安装依赖

```bash
npm install
```

4. 运行网页开发服务器

```bash
npm run dev
```

5. 运行桌面应用 (Tauri) 服务器

```bash
npm run tauri:dev
```

6. 打包桌面应用安装程序

```bash
npm run tauri:build
```

## 提交代码流程

建议使用下面的流程：

1. 创建新的分支

```bash
git checkout -b feature/short-description
```

例如：

```
feature/add-todo-filter
feature/dashboard-progress
fix/todo-save-error
```

2. 修改代码并测试。

3. 提交代码

```bash
git add .
git commit -m "feat: add todo filter"
```

4. 推送到你的 fork

```bash
git push origin feature/short-description
```

5. 创建 Pull Request。


## 提交信息建议

推荐使用简单的“提交”类型：

| 类型       | 用途     |
| -------- | ------ |
| feat     | 新功能    |
| fix      | 修复 bug |
| docs     | 文档修改   |
| refactor | 重构代码   |
| style    | 格式修改   |

示例：

```
feat: add todo CRUD
fix: todo not saving in localStorage
docs: update README
```


## 代码风格

请保持代码简单和清晰。

* 使用 **TypeScript**
* 使用 **Tailwind CSS**
* 组件尽量小
* 不要写非常复杂的逻辑

如果有格式工具，请在提交前运行。


## 议题 (Issue)

如果发现 bug 或有新想法，请创建 Issue。

Issue 可以包括：

* Bug 报告
* 新功能建议
* UI 改进
* 文档问题

写 Issue 时请说明：

* 问题是什么
* 如何复现
* 期望行为


## 项目目标

逐一（ZhuYi）是一个简单的生产力工具。

主要目标：

* Todo 管理
* 项目进度跟踪
* 离线优先应用
* 桌面版本（v1.0.0 已发布，将持续优化）

---

如果你有问题，可以在 Issue 里讨论。

感谢你的贡献！

