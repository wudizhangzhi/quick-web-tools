# Quick Web Tools

实用小工具集合，基于 Next.js 构建，部署于 Vercel。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **部署**: Vercel (Serverless Functions)

## 功能列表

### 虎扑视频下载

解析虎扑分享链接，提取视频地址并下载。

- 支持帖子和回复中的视频
- 显示视频封面图
- 显示发布者和标题
- 一键下载/复制链接

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build

# 启动生产服务器
npm start
```

访问 http://localhost:3000

## 部署到 Vercel

### 方式一：GitHub 连接

1. 将代码推送到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入仓库
3. 自动部署完成

### 方式二：Vercel CLI

```bash
npm i -g vercel
vercel
```

## 项目结构

```
├── app/
│   ├── api/
│   │   └── hupu/
│   │       └── route.ts      # 虎扑视频解析 API
│   ├── tools/
│   │   └── hupu-video/
│   │       └── page.tsx      # 虎扑视频下载页面
│   ├── layout.tsx            # 全局布局
│   ├── page.tsx              # 首页
│   └── globals.css
├── components/
│   └── Sidebar.tsx           # 侧边栏导航
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 添加新工具

1. 在 `app/tools/` 下创建新目录和 `page.tsx`
2. 如需后端接口，在 `app/api/` 下创建对应的 `route.ts`
3. 在 `components/Sidebar.tsx` 的 `tools` 数组添加导航入口
4. 在 `app/page.tsx` 的 `tools` 数组添加首页卡片

## License

MIT
