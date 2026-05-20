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

### Current Tools

- **Hupu Video Download** (`/tools/hupu-video`): Parses Hupu share links to extract video URLs. Backend scrapes the page, extracts `__NEXT_DATA__` JSON, and finds video info from multiple content sources.
- **Subscription Converter** (`/tools/sub-converter`): Converts proxy subscription URLs (from 3x-ui etc.) to Clash/FiClash YAML configs. Supports VMess, VLESS, Trojan, Shadowsocks protocols. Features preset rule configs (ACL4SSR) and advanced options (filter, emoji, UDP, rename, sort). Backend: `app/api/sub-converter/` with `parsers.ts`, `presets.ts`, `clash.ts`, `route.ts`.
- **Invisible Unicode Text** (`/tools/invisible-unicode`): Encodes text into invisible zero-width Unicode characters (steganography). Supports encode, decode, detect hidden chars, and embed secret text in carrier text. Pure client-side, no API needed.
- **Force Yes** (`/tools/force-yes`): 创建者配置 yes/no 文案与表情包，生成专属链接 `/y/[code]`。访问者点 no 会让 yes 按钮放大、no 按钮逃跑；点 yes 后撒花 + 震动 + 成功文案。Upstash Redis 存配置，Cloudflare Turnstile 防机器人，覆盖式 cookie 限制每人一条。

### Styling

Uses Tailwind CSS with mobile-first responsive design. Breakpoint `md:` (768px) switches between mobile and desktop layouts.

### Analytics

GA4 通过 `NEXT_PUBLIC_GA_ID` 注入，仅生产环境启用（dev 不发请求）。`components/GoogleAnalytics.tsx` 注入 gtag.js 并在路由切换时手动上报 PV；`lib/gtag.ts` 暴露 `event(name, params)` 给工具页埋点，仅上报状态枚举与必要元数据，不上报用户输入内容。事件清单：核心动作 `hupu_parse` / `sub_convert` / `invisible_unicode_action` / `force_yes_create` / `force_yes_choice`；结果二次操作 `hupu_share` / `sub_share` / `invisible_unicode_share` / `force_yes_post_win`。
