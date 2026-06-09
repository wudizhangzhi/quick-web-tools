# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Build for production
npm run lint     # Run ESLint
npm start        # Start production server
```

## Architecture

This is a Next.js 14 (App Router) + TypeScript + Tailwind CSS project for building a collection of web tools.

### Layout Pattern

- `app/layout.tsx` - Root layout with responsive sidebar navigation
- `components/Sidebar.tsx` - Client component with mobile hamburger menu (hidden on md+ screens)
- Tools live in `app/tools/[tool-name]/page.tsx`
- API routes live in `app/api/[tool-name]/route.ts`

### Adding New Tools

1. Create `app/tools/[tool-name]/page.tsx` for the frontend
2. Create `app/api/[tool-name]/route.ts` if backend processing is needed
3. Add entry to `tools` array in both `components/Sidebar.tsx` and `app/page.tsx`
4. **必做：埋点审计** — 见下方 Analytics 段。新页面/新组件落地后，跑一遍 `grep -nE "onClick|onSubmit|onCopy|<a [^>]*href" <新文件>`，对每一处反问"这是不是需要被监测的转化点？"如果是，按命名规范在 handler 里 / onClick 里加 `gaEvent(...)`。审计也适用于在已有页面上新增任何按钮、外链、复制/下载入口。

### Current Tools

- **Hupu Video Download** (`/tools/hupu-video`): Parses Hupu share links to extract video URLs. Backend scrapes the page, extracts `__NEXT_DATA__` JSON, and finds video info from multiple content sources.
- **Subscription Converter** (`/tools/sub-converter`): Converts proxy subscription URLs (from 3x-ui etc.) to Clash/FiClash YAML configs. Supports VMess, VLESS, Trojan, Shadowsocks protocols. Features preset rule configs (ACL4SSR) and advanced options (filter, emoji, UDP, rename, sort). Backend: `app/api/sub-converter/` with `parsers.ts`, `presets.ts`, `clash.ts`, `route.ts`.
- **Invisible Unicode Text** (`/tools/invisible-unicode`): Encodes text into invisible zero-width Unicode characters (steganography). Supports encode, decode, detect hidden chars, and embed secret text in carrier text. Pure client-side, no API needed.
- **Force Yes** (`/tools/force-yes`): 创建者配置 yes/no 文案与表情包，生成专属链接 `/y/[code]`。访问者点 no 会让 yes 按钮放大、no 按钮逃跑；点 yes 后撒花 + 震动 + 成功文案。Upstash Redis 存配置，Cloudflare Turnstile 防机器人，覆盖式 cookie 限制每人一条。
- **Video Delogo Command** (`/tools/video-delogo`): 选本地视频 → 在画面上拖框选台标/水印区域（可多框、拖动/缩放/删除）→ 生成对应的 ffmpeg `delogo` 命令拿去本地跑。纯客户端，视频不上传（`URL.createObjectURL` 喂 `<video>`），覆盖层用 pointer events 画框、`backdrop-blur` 近似预览效果；框存视频真实像素坐标，渲染时按百分比换算回显示坐标。纯逻辑在 `lib/video-delogo/command.ts`（坐标取整/贴边 clamp、链式 `delogo=...,delogo=...` 拼接、文件名加引号、输出名默认 `_delogo` 后缀），有 vitest 覆盖。不做真实视频处理 / 不做时间段裁剪。
- **World Cup Predict** (`/tools/world-cup-predict`): 世界杯竞猜。随机推一场未开赛的比赛让用户猜（小组赛胜/平/负，淘汰赛猜晋级方），匿名 cookie 记录预测，每天跑抓取脚本更新真实赛果并统计命中率。可生成专属链接 `/p/[code]` 以晋级树形式展示预测，访客可自行竞猜。分享支持出「战报海报」图：`components/world-cup/SharePoster.tsx` 用 `html-to-image` 把 `ShareCard.tsx` 截成 PNG（保存/复制图片/复制链接），`/p/[code]/opengraph-image.tsx` 用 `next/og`（Satori）出链接预览卡（构建时抓 Noto Sans SC 子集 + twemoji）；冠军预测由 `lib/world-cup/champion.ts` 从 final 选择推出（淘汰赛球队未定时为 null）；海报还会展示一场「精选竞猜对阵」（`lib/world-cup/featured.ts`：优先未出结果、kickoff 时间最近的预测对阵，全部已出结果则随机一场，只显示用户的猜测不显示真实赛果）。数据为 `data/worldcup-2026.json`（仓库内、可版本控制、换届只需换文件）；预测存 Upstash Redis；`npm run fetch:wc`（`scripts/fetch-worldcup.ts`）从 FIFA 官方 API 抓赛程/赛果。纯逻辑在 `lib/world-cup/`，有 vitest 覆盖（`npm test`）。

### Styling

Uses Tailwind CSS with mobile-first responsive design. Breakpoint `md:` (768px) switches between mobile and desktop layouts.

### Analytics

GA4 通过 `NEXT_PUBLIC_GA_ID` 注入，仅生产环境启用（dev 不发请求）。`components/GoogleAnalytics.tsx` 注入 gtag.js 并在路由切换时手动上报 PV；`lib/gtag.ts` 暴露 `event(name, params)` 给工具页埋点，仅上报状态枚举与必要元数据，**不上报用户输入内容**（URL / 文本 / token / 配置等永远不进 params）。Vercel Web Analytics 默认关闭，由 `VERCEL_ANALYTICS_ENABLED=true` 显式开启（Hobby 档 2.5k events/月易爆，跟 GA4 重复，按需才开）。

**命名规范**
- 核心动作：`<tool>_<verb>` —— 表单提交 / 主流程触发，例：`hupu_parse`, `sub_convert`, `invisible_unicode_action`, `force_yes_create`, `force_yes_choice`
- 结果二次操作：`<tool>_share` —— 对产物的复制/下载/分享，用 `status` 枚举区分，例：`sub_share` `{ status: 'copy_yaml' | 'download' | 'copy_url' }`
- CTA / 其他离散场景：自取语义化名，例：`force_yes_post_win`
- 状态字段统一用 `status: 'success' | 'fail' | <动作枚举>`，失败时附简短 `error` 标识

**必埋点的动作（新页面、新组件、给已有页面加交互时都要审计）**
- 表单提交 / API 触发 / 主功能执行
- 任何"复制到剪贴板"按钮（每一个都单独 event，区分复制的内容种类）
- 文件下载、外链跳转下载（`<a target="_blank">` 也要 onClick 加 gaEvent，PV 不会捕获跳出）
- 分享类 CTA、社交分享、用户引导按钮
- 主流程关键决策点（force-yes 的 yes/no、未来类似的二选一交互）

**故意不打**
- 站内导航 `Link`（PV 已覆盖目的路由）
- 表单 `onChange` / 文本框输入
- preset / 模式 / 折叠面板 / 主题等纯 UI 切换
- hover、tooltip、focus

**审计 checklist（每次提交前）**
```bash
grep -nE "onClick|onSubmit|onCopy|<a [^>]*href" <改动的文件>
```
逐项问：这个动作产生用户主动的"完成"或"分享"效果吗？是 → 加 event；否（纯 UI / 内部导航）→ 跳过。落实时优先写到 handler 函数里，外链点击型加 inline onClick。

**当前事件清单**
- 核心：`hupu_parse` / `sub_convert` / `invisible_unicode_action` / `force_yes_create` / `force_yes_choice` / `wc_predict`（`{ stage, choice }`）
- 二次：`hupu_share` / `sub_share` / `invisible_unicode_share` / `force_yes_post_win` / `wc_share`（`{ status: 'save_image' | 'copy_image' | 'copy_link' }`）/ `video_delogo_share`（`{ status: 'copy_command', regions }`）
