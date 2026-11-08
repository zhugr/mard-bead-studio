# MARD Bead Studio · 拼豆工作室

可直接部署在 GitHub Pages 的纯前端拼豆画图、图片转换、MARD 色号及图纸导出工具，无需后端、数据库、安装依赖或构建。

## 功能
- 上传本地图片自动转换为 MARD 参考色拼豆图；可选白底移除、比例保持、颜色上限。
- 逐格绘画、擦除、填色桶、吸色、撤销/重做、缩放。
- 自定义 1–200 格的宽高，常见方形板子尺寸预设，2.6mm / 5mm 估算尺寸。
- 内置 MARD 221 色参考 HEX，搜索色号、限制可用色库、色号数量统计。
- 导出带色号 PNG、纯色 PNG、浏览器打印或另存 PDF、CSV 色号数量清单、JSON 可编辑工程。
- 浏览器本地自动保存，无需上传照片到服务器。

## GitHub Pages 部署（最快方法）
1. 在 GitHub 创建公开 Repository，例：`mard-bead-studio`。
2. 将本文件夹的 `index.html`、`style.css`、`app.js`、`palette.js` 上传到 **仓库根目录**（不是再套一层文件夹）。
3. 打开仓库 Settings → Pages → Build and deployment → Source 选择 **Deploy from a branch**，Branch 选 `main`，Folder 选 `/ (root)`，点击 Save。
4. 完成后访问 `https://你的用户名.github.io/mard-bead-studio/`。

GitHub Pages 会自动以 HTTPS 提供页面。也可以使用仓库中的 GitHub Actions workflow。

## 本地预览
ES module 必须经由 Web 服务器加载。可在目录内执行 `python -m http.server 8000`，打开 `http://localhost:8000`；或使用 VS Code Live Server。不要直接双击 index.html 并使用 `file://`。

## 关于 MARD 色卡
色值参考公开资料 [HansBug/pindou-color-data](https://github.com/HansBug/pindou-color-data/tree/main/mard-221-github)，不代表厂商官方色值。不同光线、批次和显示器会存在色差。默认完整 221 色；`144 色` 是前 144 色的临时参考子集，**并非任何官方 144 色套装**。可使用“管理可用色号”按实际拥有的豆子调整。

## 当前限制与注意
- 图片转换为浏览器本地色差最近匹配加颜色频率约束，适合像素插画；复杂照片可能需要手动修饰。没有保证照片到拼豆的精确颜色还原。
- 改画布尺寸会保留左上角原有格子，而不是自动重采样；上传原图后可重新生成。图片源不保存在 JSON 中。
- 本地自动保存只在当前浏览器有效；跨设备请导出 JSON 并重新打开。清除浏览器数据会影响自动保存。
- 颜色码以完整的 MARD 221 参考集为基础；特殊色库与 144 色套装请以实际购买色卡为准。
- `打印／保存 PDF` 会打开浏览器打印界面，选“另存为 PDF”即可；浏览器需要允许弹出窗口。
- 项目处理的图片不上传服务器，无用户登录与云端同步。
