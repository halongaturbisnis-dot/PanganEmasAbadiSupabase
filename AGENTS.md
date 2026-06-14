# Agent Mandatory Instructions
You are an AI developer assisting with a project that follows a strict high-modularity architecture.

Before making any code changes, proposing plans, or answering technical questions about implementation, you MUST ALWAYS
## MANDATORY GUIDANCE CHECK
1. Thoroughly read specific file(s) in 'GUIDANCE/' folder that is/are mentioned by user in prompt to understand all related Rules
2. IN CASE user did not mentioned any file at all, you have to Search, find and thoroughly read relevant Files in 'GUIDANCE/' folder () to understand all related Rules

## BACKEND LOGIC CHECK
1. Thoroughly read specific file(s) that is/are mentioned by user in prompt to maintain "Don't Repeat Yourself" and "Modular Monolith" Principles
2. IN CASE user did not mentioned any file at all, you have to Search, find and thoroughly read relevant Files in 'src/logic/' folder () to maintain "Don't Repeat Yourself" and "Modular Monolith" Principles

## FRONTEND CHECK
1. 'src/ui/styles/tokens.ts' is the only Source of Truth. Use it if there is class provided in it that is fit to development needs
2. Thoroughly read specific file(s) that is/are mentioned by user in prompt to maintain "Don't Repeat Yourself" and "Modular Monolith" Principles
3. IN CASE user did not mentioned any file at all, you have to Search, find and thoroughly read relevant Files in 'src/ui/' folder () to maintain "Don't Repeat Yourself" and "Modular Monolith" Principles

## 🛠️ CODING STANDARDS
1. **Modular Monolith**:
  - Stick to the module-based structure
  - Every distinct feature belongs in its own module folder under `src/modules/`
2. **Dry (Don't Repeat Yurself) & Modular**:
  - One file, one function. No oversized files.
  - One file, one specific responsibility. Avoid giant files; split into smaller files is preferable.
  - If a logic or UI pattern is used twice, move it to `src/logic/` or `src/ui/components/`.
3. **UI Consistency & Universal Design**:
  - Use Design Tokens in `src/ui/styles/tokens.ts`.
  - UI must be generic enough to adapt to different themes using tokens.
4. **Atomic Components**: Differentiate between `elements` (base) and `common` (patterns).
5. **Logic Isolation**: Keep logic in `src/logic/`, services in `src/logic/services/`.
6. **Code Quality**: Follow strictly the rules in `.eslintrc.json` and `.prettierrc` for consistency.
7. **Referrer-Safe Navigation**: Untuk navigasi antar-modul (cross-module), WAJIB menyertakan query parameter `?referrer=` agar tombol 'Back' kembali ke halaman asal secara dinamis. Rujuk `GUIDANCE/NavigationStandard.md`.

## Folder Responsibilities and File Tree (Where to put your code)
### `/src/ui/` (The Face)
- **`styles/`**: Centralized themes (`tokens.ts`), global constants (`assets.ts`), and global CSS.
- **`components/elements/`**: The smallest "Atomic" parts (Buttons, Inputs, Icons). No business logic here.
- **`components/common/`**: Reusable patterns (Cards, Modals, Forms). Context-aware but decoupled.
- **`components/layout/`**: Structural parts (Sidebar, Header, Footer, Navigation). 
- **`wrapper/`**: Main context providers and Top-level layout wrappers, for example (`SampleLayout.tsx`).

### `/src/logic/` (The Brain)
- **`hooks/`**: Custom React hooks for data fetching, state management, and side effects.
- **`libs/`**: External library bridges (Database clients, Auth clients).
- **`api/`**: Generic API clients and route handlers.
- **`utils/`**: Helper functions (text formatting, date math, `cn()` for Tailwind).
- **`services/`**: Feature-agnostic services (Storage, Email, AI processing, `errorService.ts`).
- **`locales/`**: JSON files used by the lightweight Translation Engine for multi-language support.
- **`types/`**: Global TypeScript interfaces and shared data structures.
- **`context/`**: Global State Management. Handles Viewport Engine (dynamic resize), Translation Engine (i18n), and Theme Switching.
- **`utils/config.ts`**: Environment variable validation and app configuration.

## Dynamic UI & Viewport Engine
To prevent UI "shrinkage" or "stretching", the app uses a **Viewport Engine** in `GlobalContext`:
- It tracks `width` and `height` in real-time.
- Provides semantic booleans like `isCompact` (mobile/folded), `isMobile`, and `isWide` (ultra-wide desktop).
- **STRICT RULE**: DILARANG KERAS menggunakan Tailwind CSS media query (seperti `sm:`, `md:`, `lg:`) untuk responsivitas layout/UI. Semua manipulasi class terkait responsive HARUS menggunakan ternary/conditional logic via Viewport Engine (`isMobile`, dll) dari `useGlobalState()` dengan utilitas `cn()`.

## 🚀 DEPLOYMENT & ENVIRONMENT SAFETY
1. **Zero Hardcoding**: DILARANG KERAS menggunakan absolute URL yang merujuk pada environment AI Studio (`ais-dev-...`) di dalam kode sumber. Gunakan `config.appUrl` atau relative path.
2. **Environment Agnostic**: Kode harus berfungsi sama baiknya di AI Studio maupun Vercel. Gunakan `VITE_` prefix untuk variabel lingkungan yang dibutuhkan oleh frontend.
3. **Fail-Safe Config**: Selalu gunakan fallback value di `src/logic/utils/config.ts` untuk mencegah aplikasi crash jika variabel lingkungan belum dikonfigurasi di sisi production.
4. **Vercel Readiness**: Pastikan semua import file memperhatikan case-sensitivity (nama file harus tepat sesuai filesystem) untuk menghindari build failure di Vercel (Linux environment).
5. **Guidance Sync**: Sebelum deploy, wajib merujuk pada `GUIDANCE/EnvironmentSwitchingRule.md` dan `DEPLOYMENT_MANUAL.md`.

## Security & Invariants
- Database scheme must be updated modularly per table in `/database/` folder .
- API keys MUST be accessed only via `process.env` or `import.meta.env`.