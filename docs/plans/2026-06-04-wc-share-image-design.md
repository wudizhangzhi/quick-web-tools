# World Cup 分享图设计（方案 B + 方案 A）

日期：2026-06-04 · 分支：`feat/wc-share-image`

## 目标

让世界杯竞猜的分享从「只复制链接」升级为「可出图」：

- **方案 B（主）**：用户主动生成一张「战报海报」PNG，可**保存到相册**或**复制到剪贴板**，直接发朋友圈/小红书。
- **方案 A（叠加）**：`/p/[code]` 链接被粘贴到微信/Twitter 等时，自动显示一张好看的预览卡（OG image）。
- 现有「复制链接」保留。

## 关键数据约束（决定了海报必须自适应）

1. 竞猜队列只放**双方球队已确定**的比赛（`PlayClient` 用 `placeholder == null` 过滤）。淘汰赛在 FIFA 填入晋级队伍前是「待定 vs 待定」，不可猜。
2. 没有把每轮选择沿赛程树往上传播的逻辑，`BracketTree` 逐场渲染。
3. 因此**「我猜的冠军」= 用户在 `final` 那场的 home/away 选择**，且 `final` 要到 7 月中旬有真实球队后才可猜 → 绝大部分时间没有冠军预测。
4. `AccuracyBadge` 在 `resolved <= 0` 时返回 null；赛前没有任何赛果，称号/正确率也都为空。

## 海报版式（自适应两态）

- **有赛果**：`称号 emoji` + `称号标题` + `正确率% · 猜对 N/M`（+ 若已猜 final 则 `我猜的冠军 🇦🇷 国名`）+ 引流 + 二维码。
- **无赛果（含赛前现在）**：大标题 `我的{title}预测` + `已猜 N 场`（隐藏称号/正确率/冠军）+ 引流 + 二维码。
- 冠军行**条件渲染**：仅当 `championPick()` 非 null 时出现。

尺寸：3:4 竖版海报，CSS 360×480，html-to-image `pixelRatio: 3` → 输出约 1080×1440。

## 架构

共享视觉规范，**两套渲染器**（Satori 不能复用 React 组件）：

### 方案 B（客户端 DOM 截图）

- `components/world-cup/ShareCard.tsx`：React/Tailwind 海报节点（中文/emoji 走浏览器，零字体成本）。
- `components/world-cup/SharePoster.tsx`：自包含面板——挂载时 `POST /api/world-cup/share` 拿 code → 拼 `url = origin + /p/{code}` → `qrcode` 生成二维码 dataURL → 渲染 `ShareCard` 预览 + 三个动作按钮（保存图片 / 复制图片 / 复制链接）。懒创建 code（仅在用户打开分享时）。
- `lib/share-image.ts`：`nodeToPngBlob(node, ratio)`（封装 `html-to-image`）、`triggerDownload`、`copyBlobToClipboard`。
- 接入：
  - `DashboardClient`：「分享」按钮 toggle 出 `<SharePoster>` 面板。
  - `PlayClient`：头部「分享战绩」chip 打开遮罩层，内含 `<SharePoster>`。

### 方案 A（OG image）

- `app/p/[code]/opengraph-image.tsx`：`next/og` 的 `ImageResponse` 重写同版式（横版 1200×630）。
- 字体：构建/运行时 fetch Google Fonts 的 **Noto Sans SC 子集**（用 `&text=` 只取用到的字形，体积极小）。
- emoji：`ImageResponse({ emoji: 'twemoji' })`。
- 复用 `app/p/[code]/page.tsx` 已有的 `loadPredictions` + `computeStats` + `championPick`。
- 失败兜底：字体抓取失败时退回无自定义字体渲染，不让整页 500。

## 纯逻辑

- `lib/world-cup/champion.ts`：`championPick(predictions, data): Team | null`，从 `final` 的 home/away 选择解析，球队未定（`code` 为空或 `placeholder` 非空）时返回 null。vitest 覆盖。

## 依赖

`html-to-image`、`qrcode`、`@types/qrcode`。

## 埋点

`wc_share { status: 'save_image' | 'copy_image' | 'copy_link' }`（沿用现有事件名，新增 status 枚举）。

## 风险

- flagcdn 跨域：截图需图片 CORS。flagcdn 发 `Access-Control-Allow-Origin: *`，预期可用；不行则 fetch 成 dataURL 内联。测试时验证。
- OG 字体体积/超时：用 `&text=` 子集规避。

## 测试

- `npm test`（champion 单测）、`npm run lint`、`npm run build`。
- `npm run dev` 手测：Dashboard / PlayClient 出图（赛前无赛果态）、复制图片、下载、复制链接；`/p/[code]/opengraph-image` 路由直接访问出图。
