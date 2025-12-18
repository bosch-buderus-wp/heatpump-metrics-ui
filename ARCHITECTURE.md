# Architecture Documentation

This document provides a technical overview of the Heatpump Metrics application architecture, design decisions, and implementation details.

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
- [Component Structure](#component-structure)
- [Data Flow](#data-flow)
- [State Management](#state-management)
- [Authentication & Authorization](#authentication--authorization)
- [Build & Deployment](#build--deployment)
- [Security Considerations](#security-considerations)
- [Performance Optimizations](#performance-optimizations)

## 🏗️ System Overview

Heatpump Metrics is a React-based single-page application (SPA) that provides visualization and management of heat pump efficiency metrics.

### Architecture Style

- **Frontend**: React SPA with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Distribution**: CDN via jsDelivr (embeddable widget)
- **Build**: Vite with library mode for single-file output

### High-Level Architecture

```
┌─────────────────┐
│   Web Browser   │
│  (User/Client)  │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐       ┌──────────────────┐
│   jsDelivr CDN  │       │   Supabase       │
│   (app.js/css)  │◄──────┤   - PostgreSQL   │
└─────────────────┘       │   - Auth Service │
         │                │   - Edge Funcs   │
         │                │   - Row Level    │
         │                │     Security     │
         │                └──────────────────┘
         │
         ▼
┌─────────────────┐
│  React App      │
│  - Components   │
│  - State Mgmt   │
│  - Routing      │
└─────────────────┘
```

## 🔧 Technology Stack

### Core Technologies

| Category       | Technology     | Version | Purpose                 |
| -------------- | -------------- | ------- | ----------------------- |
| **Framework**  | React          | 19.x    | UI framework            |
| **Language**   | TypeScript     | 5.x     | Type safety             |
| **Build Tool** | Vite           | 7.x     | Fast builds, dev server |
| **Router**     | React Router   | 7.x     | Client-side routing     |
| **State**      | TanStack Query | 5.x     | Server state management |
| **Backend**    | Supabase       | 2.x     | Database, Auth, APIs    |

### UI Libraries

| Library           | Purpose                       |
| ----------------- | ----------------------------- |
| Material-UI (MUI) | Component library, DataGrid   |
| Nivo              | Charts and data visualization |
| Emotion           | CSS-in-JS (MUI dependency)    |

### Development Tools

| Tool       | Purpose                     |
| ---------- | --------------------------- |
| Biome      | Linting and code formatting |
| Terser     | JavaScript minification     |
| TypeScript | Type checking               |

### Dependencies

Key dependencies (see `package.json` for full list):

- `@supabase/supabase-js` - Supabase client
- `@tanstack/react-query` - Data fetching/caching
- `@mui/material` & `@mui/x-data-grid` - UI components
- `@nivo/bar` & `@nivo/core` - Charts
- `react-hook-form` - Form management
- `i18next` & `react-i18next` - Internationalization
- `dayjs` - Date manipulation
- `zod` - Runtime validation

## 🏛️ Application Architecture

### Layered Architecture

```
┌─────────────────────────────────────────┐
│          Presentation Layer             │
│  (Pages, Components, UI, Routing)       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Application Layer               │
│  (Hooks, State Management, Business     │
│   Logic, Data Transformations)          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Data Access Layer              │
│  (Supabase Client, API Calls,           │
│   Type Definitions)                     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         External Services               │
│  (Supabase Database, Auth, Edge Funcs)  │
└─────────────────────────────────────────┘
```

### Module Structure

```
src/
├── pages/              # Presentation Layer (Routes)
├── components/         # Presentation Layer (UI)
├── hooks/              # Application Layer (Business Logic)
├── lib/                # Data Access Layer (Utilities)
└── types/              # Type Definitions
```

## 🧩 Component Structure

### Component Organization

We follow a **domain-driven** and **atomic design** hybrid approach:

```
components/
├── common/             # Shared infrastructure components
│   ├── layout/         # Layout components (Header, Footer)
│   ├── charts/         # Chart components
│   └── data-grid/      # DataGrid components
│
├── features/           # Domain-specific feature modules
│   ├── monthly/        # Monthly values feature
│   ├── profile/        # User profile feature
│   └── system/         # Heating system feature
│
├── form/               # Form-related components
│   ├── fields/         # Form field components
│   └── MonthYearPicker.tsx
│
└── ui/                 # Generic UI components
    ├── ActionBar.tsx
    ├── ConfirmDialog.tsx
    └── CopyField.tsx
```

### Component Patterns

#### 1. Page Components (Routes)

Located in `src/pages/`, handle routing and top-level layout:

```typescript
// src/pages/Monthly.tsx
export default function Monthly() {
  const { data, isLoading } = useQuery({ ... })

  return (
    <PageLayout titleKey="monthly.title">
      <DataGridWrapper rows={data} columns={columns} />
      <AzBarChart data={data} />
    </PageLayout>
  )
}
```

#### 2. Feature Components

Located in `src/components/features/`, contain domain logic:

```typescript
// src/components/features/system/SystemSection.tsx
export function SystemSection({ system, onSave, onDelete }) {
  const [isSaving, setIsSaving] = useState(false);

  // Feature-specific logic

  return (
    <section>
      <SystemForm system={system} onSubmit={handleSave} />
      <ActionBar actions={actions} />
    </section>
  );
}
```

#### 3. UI Components

Located in `src/components/ui/`, generic and reusable:

```typescript
// src/components/ui/ConfirmDialog.tsx
export function ConfirmDialog({ open, title, message, onConfirm }) {
  return <Dialog open={open}>{/* Generic dialog UI */}</Dialog>;
}
```

## 🔄 Data Flow

### Data Fetching Pattern

We use **TanStack Query** for server state management:

```typescript
// 1. Query hook
const { data, isLoading, error } = useQuery({
  queryKey: ["systems"],
  queryFn: async () => {
    const { data, error } = await supabase.from("heating_systems").select("*");
    if (error) throw error;
    return data;
  },
});

// 2. Mutation hook
const mutation = useMutation({
  mutationFn: async (newSystem) => {
    const { error } = await supabase.from("heating_systems").insert(newSystem);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries(["systems"]);
  },
});
```

### Data Flow Diagram

```
┌──────────────┐
│  Component   │
│   (UI Layer) │
└──────┬───────┘
       │ uses
       ▼
┌──────────────┐
│  Custom Hook │  (useSystem, useProfile)
│ (Logic Layer)│
└──────┬───────┘
       │ uses
       ▼
┌──────────────┐
│ React Query  │  (Caching, Refetching)
└──────┬───────┘
       │ calls
       ▼
┌──────────────┐
│  Supabase    │  (Database Operations)
│   Client     │
└──────┬───────┘
       │ HTTP
       ▼
┌──────────────┐
│  Supabase    │
│   Backend    │
└──────────────┘
```

## 📦 State Management

### State Categories

1. **Server State** (TanStack Query)

   - Database records
   - User data
   - Measurements
   - Cached and synchronized

2. **UI State** (React useState/useReducer)

   - Form inputs
   - Modal visibility
   - Loading states
   - Temporary UI state

3. **URL State** (React Router)

   - Current route
   - Query parameters
   - Navigation history

4. **Global State** (React Context)
   - User session (via SessionContext)
   - i18n language
   - Theme (if implemented)

### State Management Example

```typescript
// Server state (TanStack Query)
const { data: systems } = useQuery({
  queryKey: ["systems"],
  queryFn: fetchSystems,
});

// UI state (React)
const [isModalOpen, setIsModalOpen] = useState(false);

// Global state (Context)
const { session } = useSession();

// URL state (Router)
const navigate = useNavigate();
const { systemId } = useParams();
```

## 🔐 Authentication & Authorization

### Authentication Flow

1. **Login** - User authenticates via Supabase (magic link or password)
2. **Session** - Session stored in localStorage
3. **Token** - JWT access token included in API requests
4. **Refresh** - Automatic token refresh

### Session Management

```typescript
// src/components/common/layout/Layout.tsx
const SessionContext = createContext<SessionContextType>({ session: null });

export function Layout({ children }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session }}>
      {children}
    </SessionContext.Provider>
  );
}
```

### Authorization

- **Row Level Security (RLS)** - Enforced at database level
- **Client-side checks** - `useSession()` hook provides session
- **Protected routes** - Check session before rendering
- **Edge functions** - Validate JWT tokens

## 🚀 Build & Deployment

### Build Configuration

**Library Mode** - Single-file output for CDN distribution:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    outDir: "../bosch-buderus-wp.github.io/assets/metrics",
    minify: "terser",
    lib: {
      entry: "./src/main.tsx",
      formats: ["es"],
      fileName: () => "app.js",
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

### Output

- **app.js** - ~1.9MB (584KB gzipped) - All application code
- **app.css** - ~3KB (1KB gzipped) - All styles

### Distribution

**jsDelivr CDN:**

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/user/repo@1.0.2/assets/metrics/app.css"
/>
<script
  type="module"
  src="https://cdn.jsdelivr.net/gh/user/repo@1.0.2/assets/metrics/app.js"
></script>
```

### Versioning

- Semantic versioning (MAJOR.MINOR.PATCH)
- Git tags for releases
- jsDelivr automatically serves tagged versions

## 🔒 Security Considerations

### Security Measures

1. **XSS Protection**

   - React auto-escapes all text content
   - No `dangerouslySetInnerHTML` usage
   - No direct DOM manipulation with user data

2. **SQL Injection Protection**

   - Supabase client uses parameterized queries
   - No raw SQL from user input

3. **CSRF Protection**

   - Token-based auth (not cookie-based)
   - SameSite policies handled by Supabase

4. **Authentication**

   - JWT tokens with expiration
   - Secure token storage
   - Automatic token refresh

5. **Row Level Security (RLS)**

   - Database-enforced access control
   - Users can only modify their own data
   - Public read access for metrics

6. **Environment Variables**
   - `.env` files not committed to git
   - `.env.example` as template
   - Anon key is public by design (RLS protects data)

### Security Best Practices

- Never commit secrets
- Validate user input
- Use TypeScript for type safety
- Keep dependencies updated
- Follow OWASP guidelines

## ⚡ Performance Optimizations

### Current Optimizations

1. **Build Optimization**

   - Terser minification
   - Tree shaking (dead code elimination)
   - Console/debugger removal in production

2. **Caching Strategy**

   - TanStack Query caches server data
   - Supabase client caches session
   - Browser caches static assets

3. **Code Organization**

   - Modular component structure
   - Reusable hooks and utilities
   - Efficient re-renders

4. **Data Fetching**
   - React Query prevents redundant requests
   - Automatic background refetching
   - Optimistic updates for mutations

### Future Optimization Opportunities

1. **Code Splitting** - Would break CDN single-file model
2. **Image Optimization** - Currently no images
3. **Service Worker** - For offline support
4. **Virtual Scrolling** - For very large datasets
5. **Memoization** - For expensive computations

## 🧪 Testing Strategy

### Current State

- **Manual Testing** - In development
- **TypeScript** - Compile-time type checking
- **Biome Linting** - Code quality checks

### Recommended Testing Approach

1. **Unit Tests** - Test hooks and utilities
2. **Component Tests** - Test React components
3. **Integration Tests** - Test feature workflows
4. **E2E Tests** - Test complete user flows

### Testing Tools (Future)

- Vitest - Unit/integration testing
- React Testing Library - Component testing
- Playwright - E2E testing

## 📚 Design Patterns

### Patterns Used

1. **Container/Presentational Pattern**

   - Pages = Containers (logic + data)
   - Components = Presentational (UI only)

2. **Custom Hooks Pattern**

   - Encapsulate business logic
   - Reusable across components
   - Single responsibility

3. **Compound Components Pattern**

   - Form components with fields
   - Flexible and composable

4. **Provider Pattern**
   - SessionContext for auth
   - QueryClientProvider for React Query
   - i18n provider for translations

## 🔮 Architecture Decisions

### Why React?

- Large ecosystem and community
- Component-based architecture
- Excellent TypeScript support
- Good performance

### Why Supabase?

- PostgreSQL with RESTful API
- Built-in authentication
- Row Level Security
- Real-time subscriptions
- Edge functions

### Why Vite?

- Fast build times
- Excellent dev experience
- Native ESM support
- Library mode for CDN distribution

### Why Library Mode?

- Single-file output for easy embedding
- CDN distribution via jsDelivr
- Simple integration for consumers
- No build process for users

### Why TanStack Query?

- Excellent caching strategy
- Automatic background refetching
- Optimistic updates
- Better DX than manual state management

## 📖 Further Reading

- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Material-UI](https://mui.com/)

---

For development setup, see [DEVELOPMENT.md](DEVELOPMENT.md)  
For contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md)
