# MARD Bead Studio v2.2.3 — UI / Coordinate Fix

This update is based on v2.2.2, intended for static GitHub Pages hosting.

## What changed
- High-contrast selected buttons in dark mode for drawing tools, mirror/pan controls, and candidate images.
- Rulers above and to the left of the canvas remain visible while panning/scrolling the canvas.
- Desktop hover highlights the selected row and column, with a coordinate readout.
- Touching a cell keeps its position highlighted on mobile; use the existing Hand/Pan tool to move the canvas.
- Toggle rulers, row/column highlighting, and 10-cell guide lines.
- Jump to a row and column (1-based coordinates), automatically scrolling it into view.
- Chinese, English, Bahasa Melayu labels for coordinate controls.

## Install
Unzip and upload all root files and the `.github` workflow directory to `zhugr/mard-bead-studio` repository, replacing existing files. Commit to `main` and let Pages deploy.

## Privacy and safety
The app stays browser-local, with no backend or login. Back up your saved projects as JSON before updating, and **do not clear browser site data**. Existing project data is not migrated or deleted by this patch.

## Testing
JavaScript syntax and file packaging have been checked. Browser automation was blocked from accessing both localhost and file URLs in this environment, so live browser and mobile behavior needs a deployment smoke test.

> **v2.2.1 hotfix (2026-11-09):** Fixed an extra closing brace in the finish simulator code that prevented the entire JavaScript module from loading. All controls were consequently inactive. No local artwork or storage migration is required.

# MARD Bead Studio v2.2 · GitHub Pages Edition

免费、无需账号、无需服务器的拼豆设计与完成品模拟工具。中文、English、Bahasa Melayu。

## 主要功能

- 上传 PNG/JPG/WebP 转拼豆图，保持原图、填满裁剪或拉伸三种放置方式；MARD 221 参考色号与自定义色卡。
- 离线色块量化，自动生成 **3 个候选草稿**：默认方案、邻域平滑、色块简化。进入编辑后可切换，每套候选保留自己的格子修改。不调用云端 AI，不能保证复杂小图自动保留所有形状。
- 自由画笔、填色、橡皮擦、吸色、镜像画笔、旋转、翻转、移动、全图颜色替换、网格/色号切换、放大缩小。
- 本机工程库、JSON 工程导入导出、PNG 图纸、用量统计、PDF 打印、CSV、历史快照；分板结果合并下载为 ZIP。
- 进度模式（点格子标记）、孤立豆与薄连接检测、原图叠加对比；检测结果是提示，不自动修改图纸。
- 一键复制外部 AI 优化 Prompt：用户自己在 ChatGPT/Gemini 等工具上传原图，下载优化结果后再导回 Studio。
- **完成品模拟器**：图纸编辑器内直接打开；也可从首页上传其他软件生成的 PNG/JPG/WebP 图纸进行近似模拟。包括普通、轻烫、重烫、白细闪、银细闪、彩虹细闪、网格、毛巾纹、华夫格、灯芯绒、海浪纹、珠光等预设。视觉参考，并非真实熨烫材料/热变形预测。
- 中文/English/BM；深色模式、可折叠设置面板；☕ 自愿支持 LibraeSoft 链接。

## GitHub Pages 部署

1. 解压 ZIP，**只上传根目录的 `index.html`、`app.js`、`palette.js`、`style.css`、`README.md` 和 `.github/workflows/pages.yml`**（保持目录结构），不要再套一层文件夹。
2. 上传到 `zhugr/mard-bead-studio` 的 `main` 分支，覆盖同名文件。
3. GitHub → Settings → Pages → Source 选择 GitHub Actions。仓库已含工作流；部署成功后访问 https://zhugr.github.io/mard-bead-studio/ 。
4. 旧网页仍显示时进行硬刷新或清除缓存。

## 数据、隐私及兼容性

- 浏览器本机储存不等于私人账户：同一浏览器用户资料可访问数据。浏览器数据清除会导致作品丢失，请定期导出 JSON 或项目备份。
- 项目仍支持旧版 `version:2` JSON 导入。三候选仅在 v2.2 生成之后提供；早期工程单图纸仍可照常编辑。
- 图片在浏览器本地转换。外部 AI 由用户自己操作，不需要 API key。
- MARD 参考色值来自公开第三方色卡；色差可能与真实拼豆不同。
- 独立导入第三方图纸的模拟是图像采样：带数字、底纹、压缩噪点的图片会影响效果。**此工具不保证还原其他软件图纸中的真实颗数或色号**。
- 完成品纹理是近似图形滤镜，无法模拟真实热量、烫纸、材料反应或保证结果。应遵循厂商熨烫安全说明。
- 本机浏览器内容保护取决于设备与浏览器，已导出的工程 JSON 可被收到文件的人修改。

## 发布验证

- 已进行 JS 语法检查、文件引用与 ZIP 完整性检查。
- 当前执行环境限制了自动浏览器访问本地页面，故无法声明已通过端到端手动点击/移动端兼容验收。建议部署后重点检查：上传与三候选、编辑切换、旧 JSON 载入、完成品模拟、导出与本机保存。

© LibraeSoft. Free to use. Voluntary support: https://buymeacoffee.com/libraesoft

## v2.2.2 修复 / Mobile canvas & dark-mode fixes

- 深色模式：MARD 色盘的颜色不再被深色主题按钮背景覆盖，色号清晰可辨。
- 手机缩放：在编辑区的缩放按钮旁点击 **✋ 移动画布**，拖动查看放大画布的其他区域。完成后点击 **✎ 返回绘图**。
- 保留已有绘图工具、工程与 GitHub Pages 静态部署结构。
- 本补丁基于 v2.2.1 HOTFIX；更新前请备份 JSON 工程。
- 已验证 JavaScript 语法、DOM ID 引用、ZIP 结构。真实手机浏览器点击测试仍需部署后验收。
