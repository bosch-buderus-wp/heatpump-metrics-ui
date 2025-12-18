# Contributing to Heatpump Metrics

Thank you for your interest in contributing to Heatpump Metrics! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Assume good intentions

## 🎯 How Can I Contribute?

### Types of Contributions

1. **Bug Fixes** - Fix issues and improve stability
2. **Features** - Add new functionality
3. **Documentation** - Improve docs, add examples
4. **Translations** - Add/improve language support
5. **Testing** - Write tests, report bugs
6. **Code Quality** - Refactoring, optimization

### Good First Issues

Look for issues labeled:
- `good-first-issue` - Perfect for newcomers
- `help-wanted` - We need community help
- `documentation` - Documentation improvements

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)
- Basic knowledge of React, TypeScript, and Vite

### Initial Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR-USERNAME/metrics.git
   cd metrics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:4000/metrics/
   ```

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup instructions.

## 🔄 Development Workflow

### Branch Strategy

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic

3. **Test your changes**
   ```bash
   npm run lint          # Check code style
   npm run format        # Format code
   npm run build         # Test production build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new chart component"
   ```

   **Commit Message Format:**
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting)
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to GitHub and create a PR
   - Fill in the PR template
   - Link related issues

## 📝 Coding Standards

### TypeScript

- Enable strict mode (already configured)
- Use proper types, avoid `any`
- Use interfaces for component props
- Export types that are reused

```typescript
// ✅ Good
interface SystemFormProps {
  system: HeatingSystem | null;
  onSave: (data: HeatingSystemInsert) => Promise<void>;
}

// ❌ Bad
function SystemForm(props: any) { ... }
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic to custom hooks
- Use proper prop types

```typescript
// ✅ Good
export function MyComponent({ title, onSave }: MyComponentProps) {
  const [data, setData] = useState<string>('');
  // ...
}

// ❌ Bad
export default function MyComponent(props) {
  // ...
}
```

### File Organization

```
src/
├── components/
│   ├── common/          # Shared components
│   ├── features/        # Domain-specific features
│   ├── form/            # Form components
│   └── ui/              # Generic UI components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and helpers
├── pages/               # Page components (routes)
└── types/               # TypeScript type definitions
```

### CSS

- Use `App.css` for application-wide styles
- Use semantic class names
- Follow BEM-like naming for complex components
- Prefer CSS over inline styles for reusable styling

```css
/* ✅ Good */
.section-header { ... }
.action-btn-primary { ... }

/* ❌ Bad */
.btn1 { ... }
.x { ... }
```

### Naming Conventions

- **Components**: PascalCase (`MyComponent.tsx`)
- **Hooks**: camelCase with `use` prefix (`useMyHook.ts`)
- **Utilities**: camelCase (`helperFunction.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Types**: PascalCase (`interface UserData`)

## 🔍 Code Quality

### Before Submitting

Run these commands:

```bash
# Format code
npm run format

# Check for linting issues
npm run lint

# Build to check for errors
npm run build
```

### Testing Changes

- Test in different browsers (Chrome, Firefox, Safari)
- Test responsive design (mobile, tablet, desktop)
- Test with different data scenarios
- Test error cases

## 📤 Submitting Changes

### Pull Request Guidelines

1. **Title**: Clear and descriptive
   - `feat: add monthly chart export feature`
   - `fix: resolve pagination issue in DataGrid`

2. **Description**: Include:
   - What changes were made
   - Why the changes were needed
   - How to test the changes
   - Screenshots (for UI changes)
   - Related issue numbers

3. **Checklist**:
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated (if needed)
   - [ ] No console warnings or errors
   - [ ] Tested in multiple browsers
   - [ ] Build succeeds

### Review Process

1. Maintainers will review your PR
2. Address feedback by pushing new commits
3. Once approved, your PR will be merged
4. Your contribution will be credited

## 🐛 Reporting Bugs

### Before Reporting

- Check if the bug is already reported
- Try to reproduce in latest version
- Check if it's a configuration issue

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Browser: [e.g. Chrome 120]
- OS: [e.g. Windows 11]
- Version: [e.g. 1.0.0]

**Additional context**
Any other relevant information.
```

## 💡 Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Mockups, examples, or references.
```

## 🌍 Translation Contributions

We welcome translations! See [i18n.ts](src/i18n.ts) for the translation structure.

1. Add your language to the resources object
2. Translate all keys
3. Test the new language in the app
4. Submit a PR

## 📚 Documentation

- Keep documentation up-to-date
- Use clear, simple language
- Add code examples
- Include screenshots for UI features

## ❓ Questions?

- Open a GitHub Discussion
- Check existing issues and PRs
- Review [DEVELOPMENT.md](DEVELOPMENT.md) and [ARCHITECTURE.md](ARCHITECTURE.md)

## 🙏 Thank You!

Every contribution, no matter how small, is valuable. Thank you for helping make Heatpump Metrics better!
