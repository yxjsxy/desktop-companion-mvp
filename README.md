# Desktop Companion MVP (Windows-first)

最小可交互桌面陪伴应用（Electron + React + TypeScript）。

## MVP 功能
- 文本对话：输入 -> AI 回复（有 Key 时走真实 LLM；无 Key 时本地回显降级）
- 语音播放：一键播放最近一条回复（Web Speech API）
- 桌面陪伴能力：
  - Always-on-top toggle
  - 透明度滑杆
  - 小窗模式 toggle
- 本地配置持久化（electron-store）：
  - 窗口位置/尺寸
  - 透明度
  - 音量
  - always-on-top / mini mode

## 技术栈
- Electron
- React + TypeScript + Vite
- OpenAI SDK（兼容 OpenAI/OpenRouter 方式）
- electron-store

## 目录
- `electron/main.mjs`：主进程（窗口控制、IPC、配置、LLM）
- `electron/preload.mjs`：安全桥接 API
- `src/App.tsx`：聊天 UI + 控制面板 + TTS
- `src/types/global.d.ts`：renderer 类型声明
- `docs/screenshots/`：演示截图

## 环境变量（可选）
可配置其一：
- OpenAI：
  - `OPENAI_API_KEY`
  - `LLM_MODEL`（默认 `gpt-4o-mini`）
- OpenRouter：
  - `OPENROUTER_API_KEY`
  - `LLM_BASE_URL=https://openrouter.ai/api/v1`
  - `LLM_MODEL`（例如 `openai/gpt-4o-mini`）

如果都不配置，会自动进入本地回显模式，确保 MVP 可演示。

## Mac 开发步骤
```bash
cd ~/Documents/vibe_coding/desktop-companion-mvp
npm install
npm run dev
```

## Windows 测试步骤（必须）
```powershell
cd %USERPROFILE%\Documents\vibe_coding\desktop-companion-mvp
npm install
npm run dev
```

手测清单：
1. 应用窗口启动成功
2. 连续发送 3 轮文本
3. 点击“播放最近回复”可发声
4. 切换一次桌面模式（例如置顶开关或小窗）并观察生效
5. 调整透明度并观察窗口变化

## 现状说明
- 当前版本优先“快速可演示”。
- 语音采用系统 TTS，音色后续可替换为高质量链路。
- 未包含角色动画系统（按计划延后）。

## 演示截图
- `docs/screenshots/first-load.png`
- `docs/screenshots/chat-ui.png`
- `docs/screenshots/desktop-mode.png`
