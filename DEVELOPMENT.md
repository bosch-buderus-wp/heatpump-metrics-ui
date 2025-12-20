# Development Guide

This guide covers the development setup, workflow, and best practices for working on Heatpump Metrics.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Build Process](#build-process)
- [Database Setup](#database-setup)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Git** 2.x or higher
- A modern web browser (Chrome, Firefox, Safari, Edge)

### Recommended Tools

- **VS Code** with extensions:
  - Biome (linting/formatting)
  - ES7+ React/Redux/React-Native snippets
  - TypeScript and JavaScript Language Features
- **Supabase Account** (for database access)

### Check Your Setup

```bash
node --version    # Should be v18.x or higher
npm --version     # Should be 9.x or higher
git --version     # Should be 2.x or higher
```

## 🚀 Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/bosch-buderus-wp/heatpump-metrics-ui.git
cd heatpump-metrics-ui
```

### 2. Install Dependencies

```bash
npm install
```

This installs:

- React 19 and React Router
- Material-UI (MUI) components
- Nivo charts
- Supabase client
- TanStack Query (data fetching)
- i18next (internationalization)
- TypeScript and build tools

### 3. Configure Environment Variables

Create environment files:

```bash
cp .env.example .env.development
cp .env.example .env.production
```

Edit `.env.development`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Authentication Method
# Options: 'magic-link' or 'password'
VITE_AUTH_METHOD=magic-link

# Callback URL for authentication
VITE_AUTH_CALLBACK_URL=http://localhost:4000/metrics/#/auth/callback
```

**Getting Supabase Credentials:**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the URL and anon/public key

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:4000/metrics/](http://localhost:4000/metrics/)

The app will auto-reload when you make changes.

## 📁 Project Structure

```
metrics/
├── src/
│   ├── components/          # React components
│   │   ├── common/          # Shared components (layout, charts, data-grid)
│   │   ├── features/        # Domain features (monthly, profile, system)
│   │   ├── form/            # Form components and fields
│   │   └── ui/              # Generic UI components (buttons, dialogs)
│   ├── hooks/               # Custom React hooks
│   │   ├── useSystem.ts     # System data management
│   │   ├── useProfile.ts    # User profile management
│   │   ├── useMonthlyValues.ts
│   │   └── useDeleteOperations.ts
│   ├── lib/                 # Utilities and helpers
│   │   ├── supabaseClient.ts    # Supabase configuration
│   │   ├── enumCatalog.ts       # Enum definitions and labels
│   │   └── tableHelpers.ts      # DataGrid column definitions
│   ├── pages/               # Page components (routes)
│   │   ├── Home.tsx         # Landing page
│   │   ├── Monthly.tsx      # Monthly metrics view
│   │   ├── Yearly.tsx       # Yearly metrics view
│   │   ├── Daily.tsx        # Daily measurements view
│   │   ├── Systems.tsx      # All systems overview
│   │   ├── MyAccount.tsx    # User dashboard
│   │   └── Login.tsx        # Authentication
│   ├── types/               # TypeScript type definitions
│   │   └── database.types.ts    # Generated from Supabase
│   ├── App.tsx              # Main application component
│   ├── App.css              # Application styles
│   ├── main.tsx             # Application entry point
│   ├── i18n.ts              # Internationalization config
│   └── index.css            # Global styles
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
├── biome.json               # Linting/formatting config
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
├── CONTRIBUTING.md          # Contribution guidelines
├── DEVELOPMENT.md           # This file
├── ARCHITECTURE.md          # Technical architecture
└── README.md                # Project overview
```

## 🔄 Development Workflow

### Daily Workflow

1. **Pull latest changes**

   ```bash
   git pull origin main
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Start dev server**

   ```bash
   npm run dev
   ```

4. **Make your changes**

   - Edit files in `src/`
   - Browser auto-reloads
   - Check console for errors

5. **Format and lint**

   ```bash
   npm run format    # Auto-format code
   npm run lint      # Check for issues
   ```

6. **Test the build**

   ```bash
   npm run build     # Production build
   ```

7. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (localhost:4000)
npm run preview          # Preview production build

# Building
npm run build            # Build for production
npm run build:dev        # Build for development
npm run build:prod       # Build for production (explicit)

# Code Quality
npm run lint             # Check code with Biome
npm run format           # Auto-format code with Biome

# TypeScript Type Checking
npx tsc --noEmit         # Check TypeScript types without emitting files
```

### Pre-Commit Hooks

The project uses **Husky** and **lint-staged** to automatically enforce code quality before commits.

**What runs automatically on `git commit`:**

- ✅ **Biome format** - Auto-formats staged `.ts`, `.tsx`, `.json`, and `.md` files
- ✅ **Biome lint** - Lints and auto-fixes staged TypeScript files
- ✅ **TypeScript check** - Validates types across the entire project

**This ensures:**

- Consistent code style
- No lint errors in committed code
- No TypeScript errors before commit

**The hook only runs on staged files**, making it fast while maintaining quality:

- **TypeScript files** (`.ts`, `.tsx`): format, lint, and type-check
- **Documentation/Config files** (`.json`, `.md`): format only

**To bypass the hook (emergency only):**

```bash
git commit --no-verify -m "Emergency commit"
```

## 🏗️ Build Process

### Build Configuration

The app uses **Vite** with **library mode** for CDN distribution via jsDelivr.

### Build Output

Production build creates:

- `app.js` - Single bundled JavaScript file (~1.9MB, 584KB gzipped)
- `app.css` - Extracted styles (~3KB)

Files are optimized with:

- Terser minification
- Console/debugger removal
- Dead code elimination

**How it works:**

1. When you push a git tag (e.g., `v1.0.2`), GitHub Actions automatically builds the project
2. The built files (`app.js` and `app.css`) are attached to the GitHub Release
3. jsDelivr serves these files from the release assets
4. No need to commit build files to the repository!

## 📦 Release Process

### Creating a Release

The version number is defined in `package.json`.
To create a new release:

```bash
# 1. Update version in package.json (e.g., "1.0.7")
# 2. Commit the version change
git add package.json
git commit -m "chore: bump version to 1.0.7"

# 3. Create and push the tag automatically
npm run release
```

This will:

- Create a git tag using the version from `package.json` (e.g., `v1.0.7`)
- Push the tag to GitHub
- Trigger GitHub Actions to build and create a release

### What Happens After Tagging

1. **GitHub Actions** automatically:

   - Runs `npm run build`
   - Creates a GitHub Release with the tag name
   - Attaches `app.js` and `app.css` to the release
   - Generates release notes

2. **jsDelivr CDN** automatically:
   - Mirrors the release files within minutes
   - Makes them available at:
     - Latest: `https://cdn.jsdelivr.net/gh/bosch-buderus-wp/heatpump-metrics-ui@latest/app.js`
     - Specific: `https://cdn.jsdelivr.net/gh/bosch-buderus-wp/heatpump-metrics-ui@v1.0.7/app.js`

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **Major** (1.x.x): Breaking changes
- **Minor** (x.1.x): New features (backward compatible)
- **Patch** (x.x.1): Bug fixes

## 🗄️ Database Setup

### Schema

The database schema is maintained in a separate repository:
[heatpump-metrics-db](https://github.com/bosch-buderus-wp/heatpump-metrics-db)

### Key Tables

- `users` - User profiles
- `heating_systems` - Heating system configurations
- `monthly_values` - Monthly aggregated data
- `measurements` - Hourly measurements

### Accessing Data

Use the Supabase client:

```typescript
import { supabase } from './lib/supabaseClient'

// Query data
const { data, error } = await supabase
  .from('heating_systems')
  .select('*')

// Insert data
const { error } = await supabase
  .from('heating_systems')
  .insert({ name: 'My System', ... })
```

### Row Level Security (RLS)

- Public tables: `heating_systems`, `monthly_values`, `measurements`
- Protected: Users can only edit their own data
- Enforced at database level

## 🛠️ Common Tasks

### Adding a New Page

1. Create page component in `src/pages/`:

   ```typescript
   // src/pages/MyPage.tsx
   export default function MyPage() {
     return <div>My Page Content</div>;
   }
   ```

2. Add route in `src/App.tsx`:

   ```typescript
   import MyPage from "./pages/MyPage";

   <Route path="/my-page" element={<MyPage />} />;
   ```

3. Add navigation link in `src/components/common/layout/Layout.tsx`

### Adding a Translation

Edit `src/i18n.ts`:

```typescript
resources: {
  de: {
    translation: {
      mySection: {
        title: "Mein Titel",
        description: "Beschreibung"
      }
    }
  },
  en: {
    translation: {
      mySection: {
        title: "My Title",
        description: "Description"
      }
    }
  }
}
```

Use in components:

```typescript
const { t } = useTranslation();
return <h1>{t("mySection.title")}</h1>;
```

### Adding a New Component

1. Decide component category (common, features, form, ui)
2. Create component file
3. Export from category's `index.ts`
4. Use in your page/component

Example:

```typescript
// src/components/ui/MyButton.tsx
export function MyButton({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}

// src/components/ui/index.ts
export { MyButton } from "./MyButton";

// Usage
import { MyButton } from "../components/ui";
```

### Updating Types from Supabase

When the database schema changes:

1. Go to Supabase Dashboard → API Docs → TypeScript
2. Copy the generated types
3. Update `src/types/database.types.ts`

### Adding a Form Field

1. Use existing form components from `src/components/form/`
2. Or create new field in `src/components/form/fields/`
3. Export from `src/components/form/index.ts`

Example:

```typescript
import { TextField, NumberField } from "../components/form";

<form>
  <TextField
    label="Name"
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
  <NumberField
    label="Power"
    value={power}
    onChange={(e) => setPower(Number(e.target.value))}
  />
</form>;
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Change port in vite.config.ts or kill the process
lsof -ti:4000 | xargs kill
```

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Check tsconfig.json
# Restart TypeScript server in VS Code: Cmd+Shift+P → "Restart TS Server"
```

### Supabase Connection Issues

- Check `.env.development` has correct credentials
- Verify Supabase project is running
- Check browser console for CORS errors
- Ensure RLS policies are set up correctly

### Styles Not Applying

- Check CSS is imported in component
- Verify class names match
- Check browser DevTools for CSS conflicts
- Clear browser cache

### Hot Reload Not Working

```bash
# Restart dev server
# Check file watchers limit (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [MUI Components](https://mui.com/material-ui/)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)

## 🤝 Getting Help

- Check [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
- Open a GitHub Discussion
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Check existing issues and PRs

Happy coding! 🚀
