# MARD Bead Studio v2.2.6 — Optional AI Connections (BYOK)

Pure static GitHub Pages site. No backend operated by the Studio owner. All ordinary bead editing works without AI or an account.

## Deploy

Upload these seven entries to repository root, preserving `.github/workflows/pages.yml`:
- `index.html`, `style.css`, `app.js`, `ai-byok.js`, `palette.js`, `README.md`, `.github/workflows/pages.yml`

Do not upload the ZIP as a ZIP; extract it and upload the contents. Existing locally saved projects should be backed up as JSON before updates.

## AI panel

Open **🔑 自带 AI 连接 · BYOK / Sambung AI** under conversion settings. This panel is optional and starts collapsed. It never calls an AI provider without the user's button press.

### Gemini (experimental direct browser connection)
1. Select Gemini and choose an image-capable model.
2. Paste your own Gemini API key. By default the key is kept only in JavaScript memory and is lost on reload.
3. Explicitly check the consent box, and upload an original image in Studio.
4. Use Test (GET the provider model metadata), or Optimize (send the current source image and prompt to Google).
5. Preview the returned image. Import only if you want to replace current generated variants.

**Security warning:** Direct browser API keys can be exposed to page scripts, extensions or other software. Use restricted low-quota keys and monitor usage. Even encrypted local storage does not protect keys while they are unlocked. A server-side user-controlled proxy is preferable. Direct calls may also fail because of provider CORS, region, model availability, quota or billing restrictions; this has not been live-tested with an actual key.

### Encrypted device storage
The advanced submenu saves a key in browser `localStorage` as AES-256-GCM ciphertext with a key derived using PBKDF2 SHA-256 (250,000 iterations) from the user's passphrase. The passphrase is never stored. Unlock is required after reload. `Forget` removes the ciphertext and in-memory key. Encrypted at-rest storage does **not** prevent malicious scripts or extensions accessing the key after unlock. Don't use shared devices.

### Personal AI proxy (recommended for OpenAI or secret API keys)
The Studio accepts an explicitly configured HTTPS URL (HTTP only permitted for `localhost` / `127.0.0.1`) for a user-owned proxy. No API secret is sent from Studio to the proxy. The proxy itself must manage authentication, API keys, access controls, CORS, rate limits, billing, and protection against external callers. Unauthenticated publicly exposed endpoints are not suitable.

Proxy HTTP contract:
- `GET /health` → JSON success (any 2xx JSON); this is the test endpoint.
- `POST <configured-url>` with `{ "prompt": "...", "image": {"mimeType":"image/png", "data":"<base64>"} }`.
- Return JSON `{ "image_base64":"<base64>", "mime_type":"image/png" }` or `{ "image_data_url":"data:image/png;base64,..." }`.
- CORS must allow the Studio origin, e.g. `https://zhugr.github.io`.

This ZIP does not ship or run a local proxy. Installing/running a proxy is optional and separate from GitHub Pages hosting.

## Limits
- AI API use may incur charges on the user's own account.
- ChatGPT Plus/Pro subscription does not automatically provide OpenAI API credit.
- AI output may diverge from the source; the Studio resamples it to exact cell count and currently selected bead palette.
- Images are not transmitted until the user presses the AI action and confirms; the proxy/Gemini then receives the downsized source image.
- No guarantee of real-time provider availability. The ordinary Studio remains usable when AI is disabled.
