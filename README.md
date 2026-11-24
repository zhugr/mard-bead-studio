# MARD Bead Studio v2.2.7 — Local AI Edition (GitHub Pages)

本版以 v2.2.6 为基础，新增 **A. 浏览器本地 AI** 与 **B. 电脑本地视觉 AI**，保留原有三语、BYOK、图片转换、三种候选、编辑、导出及本机作品库。无需安装你自己的在线服务器或数据库。

## 安装

将 ZIP 的 `index.html`、`style.css`、`app.js`、`palette.js`、`ai-byok.js`、`ai-local.js`、`README.md` 直接上传到现有 GitHub Repository 根目录（`zhugr/mard-bead-studio`），覆盖对应文件。原本 `.github/workflows/pages.yml` 保持不动，GitHub Pages 会自动重新部署。更新前建议导出本机作品 JSON 备份。部署后可强制刷新页面。

## 使用

上传一张原图，展开左侧「🧠 本地 AI」。

- **A — 浏览器本地 AI（去背景）**：首次按「开始」才下载 Transformers.js 3.8.1 和 `onnx-community/ormbg-ONNX` ONNX 模型，随后在浏览器 WebAssembly 中对图像进行主体背景分割。无需 API Key，不把图片送往第三方推理 API。首次模型下载需联网，模型可能较大，手机/旧设备可能失败或很慢。模型推理完成后先显示 PNG 预览；仅在确认「导入预览」后调用原有 MARD 生成流程。模型加载由浏览器缓存处理，缓存可能被清理。
- **B — Ollama（电脑）**：先在**使用网页的同一台电脑**安装 Ollama，启用包含图片输入能力的视觉模型并启动本机服务。默认服务地址 `http://127.0.0.1:11434`；输入已安装的视觉模型 ID。若浏览器阻拦 GitHub Pages 向 localhost 请求，需在本机服务中允许此 GitHub Pages 来源的 CORS（参见 Ollama `OLLAMA_ORIGINS` 配置），同时允许浏览器的本机网络请求（如果有权限提示）。点击「测试本地连接」，再点「开始」。**本地视觉模型只估计主体边界，Studio 在浏览器裁剪构图；并非真正的 AI 图像生成**。
- **B — LM Studio（电脑）**：在 LM Studio Developer 里启动本机 API Server，加载支持 Vision/Image Input 的模型。默认 `http://127.0.0.1:1234`。按需开启 CORS，输入对应模型名，先测试连接再分析。也是只生成主体构图裁剪预览，不是图像编辑生成。

## 数据安全

- 仅在用户手动点击按钮后尝试加载模型或连接本机 AI。新模块**不要求/不储存秘密 API Key**。本地地址仅允许 localhost / 127.0.0.1 / ::1，并拒绝包含用户名密码、查询参数及 fragment 的 URL。配置中仅保存模式、模型名和本机基础 URL。
- 不自动修改当前图纸。AI 预览需用户确认导入，导入前会提示已有候选图可能被覆盖。普通图片转换始终可单独使用。
- 不要把 Ollama 或 LM Studio 端口对公网开放。CORS 只授权受信任的 GitHub Pages 来源，不要随意设置通配来源。
- 浏览器仍可能因 CORS、Private Network Access、混合内容规则阻止 GitHub Pages 访问 localhost；这是浏览器/本机设置的约束，不能保证所有设备都能直连。手机不能直接使用**电脑的** localhost，方案 B 推荐同机桌面浏览器。
- v2.2.6 的「BYOK」模块仍独立存在，不和本地 AI 混用秘密 API Key。

## 当前功能边界与测试

浏览器模型可进行背景分割，但**不等于理解眼睛、嘴巴等语义细节的完整 AI 图像编辑器**。Ollama / LM Studio 的普通视觉模型会给出主角范围，而不是直接返回重新绘制的图片。模型输出不符合 JSON 或分割异常会显示错误，原图和既有图纸不会被破坏。

已完成：JavaScript 语法检查、HTML 元素与文件引用检查、模块加载静态检查及 ZIP 完整性测试。**当前沙盒拦截了 Chromium 导航和外部模型下载，未能执行真实 ONNX 推理或真实 Ollama/LM Studio 端到端连接测试。** 因此这是实验性版本，建议先在自己的电脑使用测试图片验证，再对其他用户推广。

参考资料：
- https://huggingface.co/docs/transformers.js/v3.8.1/en/installation
- https://huggingface.co/onnx-community/ormbg-ONNX
- https://github.com/ollama/ollama/blob/main/docs/faq.mdx
- https://lmstudio.ai/docs/developer/openai-compat

---

English: This is a GitHub Pages-compatible experimental build. Browser AI downloads a background-removal model and runs local inference; desktop AI connectors request a normalized subject bounding box from a local vision-enabled Ollama/LM Studio model. Both only replace your pattern after an explicit preview-and-import confirmation. Browser CORS / localhost restrictions may prevent desktop connections.
