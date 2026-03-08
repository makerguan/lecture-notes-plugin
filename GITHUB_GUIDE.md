# GitHub 上传指南

## 当前项目状态

### 已修改的文件
- ✅ `manifest.json` - 插件配置
- ✅ `src/main.ts` - 主逻辑代码
- ✅ `src/settings.ts` - 设置面板
- ✅ `styles.css` - 样式文件

### 新增的文件
- ✅ `README_CN.md` - 中文使用文档

### 需要添加的文件
- ❌ `main.js` - 编译后的文件（需要在 .gitignore 中排除）

## GitHub 上传步骤

### 1. 初始化 Git 仓库（如果还没有）

```bash
cd obsidian-sample-plugin
git init
```

### 2. 检查 .gitignore 文件

确保 `.gitignore` 包含以下内容：
```
node_modules/
main.js
*.js.map
.DS_Store
```

### 3. 添加文件到暂存区

```bash
# 添加所有修改的文件
git add .

# 或者逐个添加
git add manifest.json
git add src/
git add styles.css
git add README_CN.md
```

### 4. 提交更改

```bash
git commit -m "feat: 完成听课笔记插件开发

- 支持学段和学科选择（高中/初中/小学，18个学科）
- 模板文件支持（选择库中的任何笔记作为模板）
- 自动创建多级文件夹（跨平台兼容）
- 移动端优化（紧凑布局，避免输入法遮挡）
- 简化对话框（去掉地点和日期输入）
- 支持多种变量（基础、日期、系统变量）
- 修复模板文件选择后输入框不更新的bug"
```

### 5. 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - Repository name: `obsidian-lecture-notes-plugin`
   - Description: `Obsidian 听课笔记插件 - 支持学段学科选择、模板文件、自动创建文件夹`
   - 选择 Public 或 Private
   - 不要勾选 "Add a README file"（我们已经有了）
   - 不要勾选 "Add .gitignore"（我们已经有了）

3. 点击 "Create repository"

### 6. 连接远程仓库

```bash
# 添加远程仓库
git remote add origin https://github.com/你的用户名/obsidian-lecture-notes-plugin.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 7. 创建 Release

1. 在 GitHub 仓库页面，点击 "Releases"
2. 点击 "Draft a new release"
3. 填写信息：
   - Tag version: `v1.0.0`
   - Release title: `v1.0.0 - 听课笔记插件首次发布`
   - Description: 复制 README_CN.md 中的功能介绍
4. 上传文件：
   - `main.js`
   - `manifest.json`
   - `styles.css`
5. 点击 "Publish release"

## 发布到 Obsidian 社区插件库（可选）

### 1. Fork obsidian-releases

1. 访问 https://github.com/obsidianmd/obsidian-releases
2. 点击 "Fork"

### 2. 修改 community-plugins.json

在你的 fork 中，编辑 `community-plugins.json`，添加：

```json
{
  "id": "lecture-notes-plugin",
  "name": "Lecture Notes Plugin",
  "author": "你的名字",
  "description": "Obsidian 听课笔记插件 - 支持学段学科选择、模板文件、自动创建文件夹",
  "repo": "你的用户名/obsidian-lecture-notes-plugin"
}
```

### 3. 提交 Pull Request

1. 提交你的修改
2. 创建 Pull Request 到 obsidian-releases
3. 等待审核

## 项目文件清单

### 必需文件（需要上传到 GitHub）
- ✅ `manifest.json` - 插件配置
- ✅ `main.js` - 编译后的代码（在 Release 中上传）
- ✅ `styles.css` - 样式文件
- ✅ `README.md` - 英文文档
- ✅ `README_CN.md` - 中文文档
- ✅ `LICENSE` - 许可证

### 源代码文件（需要上传到 GitHub）
- ✅ `src/main.ts` - 主逻辑
- ✅ `src/settings.ts` - 设置面板
- ✅ `package.json` - 项目配置
- ✅ `tsconfig.json` - TypeScript 配置
- ✅ `esbuild.config.mjs` - 构建配置

### 不需要上传的文件
- ❌ `node_modules/` - 依赖文件
- ❌ `*.js.map` - Source map 文件

## 快速命令

```bash
# 查看当前状态
git status

# 添加所有文件
git add .

# 提交
git commit -m "你的提交信息"

# 推送
git push

# 拉取最新代码
git pull
```

## 注意事项

1. **main.js 文件**：
   - 不要提交到源代码仓库
   - 只在 Release 中上传
   - 用户安装插件时下载的是 Release 中的文件

2. **版本号**：
   - 每次发布新版本时，更新 `manifest.json` 中的 `version`
   - 创建对应的 Release tag

3. **README 文件**：
   - `README.md` - 英文版（GitHub 默认显示）
   - `README_CN.md` - 中文版（可选）

4. **许可证**：
   - 建议使用 MIT License
   - 在 LICENSE 文件中添加许可证内容

## 下一步

1. ✅ 检查所有文件是否正确
2. ✅ 提交到 GitHub
3. ✅ 创建 Release
4. ✅ （可选）提交到社区插件库

祝你的插件发布成功！🎉
