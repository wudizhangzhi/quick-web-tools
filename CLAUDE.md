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

### Styling

Uses Tailwind CSS with mobile-first responsive design. Breakpoint `md:` (768px) switches between mobile and desktop layouts.
