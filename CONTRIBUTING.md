# Contributing to RxAegis

Thank you for your interest in contributing to RxAegis! This document provides guidelines and instructions for contributing.

## 🌟 Ways to Contribute

- Report bugs and issues
- Suggest new features or enhancements
- Improve documentation
- Submit bug fixes
- Add new features
- Improve code quality and performance

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- Basic understanding of React and TypeScript

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/rxaegis.git
   cd rxaegis
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/rxaegis.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📝 Development Workflow

### 1. Create a Feature Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Follow the existing code style
- Write clear, descriptive commit messages
- Keep changes focused and atomic
- Test your changes thoroughly

### 3. Commit Your Changes

```bash
git add .
git commit -m "feat: add medicine search filter"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### 4. Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

### 5. Push Your Changes

```bash
git push origin feature/your-feature-name
```

### 6. Create a Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your feature branch
4. Fill in the PR template
5. Submit the pull request

## 💻 Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use explicit return types for functions

```typescript
// ✅ Good
interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
}

function getMedicine(id: string): Promise<Medicine> {
  // ...
}

// ❌ Bad
function getMedicine(id: any): any {
  // ...
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use meaningful component and prop names
- Extract reusable logic into custom hooks

```typescript
// ✅ Good
interface MedicineCardProps {
  medicine: Medicine;
  onVerify: (id: string) => void;
}

export const MedicineCard = ({ medicine, onVerify }: MedicineCardProps) => {
  // ...
};

// ❌ Bad
export const Card = (props: any) => {
  // ...
};
```

### Styling

- Use Tailwind CSS utility classes
- Use semantic design tokens from `index.css`
- Never use inline hex colors
- Keep responsive design in mind

```typescript
// ✅ Good
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Verify
</button>

// ❌ Bad
<button className="bg-[#3498db] text-white">
  Verify
</button>
```

### File Organization

- Place components in appropriate directories
- Keep related files together
- Use index files for clean imports
- Follow existing project structure

```
src/
├── components/
│   ├── medicine/
│   │   ├── MedicineCard.tsx
│   │   ├── MedicineList.tsx
│   │   └── index.ts
│   └── ui/
├── pages/
└── hooks/
```

## 🧪 Testing Guidelines

### Before Submitting

1. **Test manually**
   - Test your changes in different browsers
   - Test on mobile devices/responsive views
   - Test with different user permissions

2. **Check for errors**
   - No console errors
   - No TypeScript errors
   - No ESLint warnings

3. **Test edge cases**
   - Empty states
   - Error states
   - Loading states
   - Invalid inputs

### Running Tests

```bash
npm run lint        # Check code style
npm run build       # Ensure build works
```

## 🔐 Security Considerations

### Handling Sensitive Data

- Never commit API keys or secrets
- Use environment variables for configuration
- Implement proper authentication checks
- Follow RLS policies for database access

### Database Operations

- Always use parameterized queries
- Implement proper RLS policies
- Validate user input
- Use Supabase client methods (never raw SQL in edge functions)

## 📚 Documentation

### Code Comments

- Write clear, concise comments
- Explain "why" not "what"
- Document complex logic
- Keep comments up to date

```typescript
// ✅ Good
// Batch processing to avoid hitting rate limits
const batchSize = 100;

// ❌ Bad
// Set batch size to 100
const batchSize = 100;
```

### Documentation Updates

When adding features:
- Update README.md if needed
- Add inline code documentation
- Update API documentation
- Add usage examples

## 🐛 Reporting Bugs

### Before Reporting

1. Check if the bug has already been reported
2. Verify the bug exists in the latest version
3. Collect relevant information

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- Browser: [e.g., Chrome 120]
- Device: [e.g., iPhone 13, Desktop]
- OS: [e.g., iOS 17, Windows 11]

**Additional context**
Any other relevant information.
```

## 💡 Suggesting Features

### Feature Request Template

```markdown
**Feature Description**
Clear description of the proposed feature.

**Problem it Solves**
What problem does this feature address?

**Proposed Solution**
How you envision the feature working.

**Alternatives Considered**
Other solutions you've thought about.

**Additional Context**
Any mockups, examples, or references.
```

## 🔄 Pull Request Process

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Changes have been tested thoroughly
- [ ] Documentation has been updated
- [ ] No TypeScript or ESLint errors
- [ ] Commit messages are clear and descriptive
- [ ] PR description explains what and why

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring

## Testing
How has this been tested?

## Screenshots
If applicable, add screenshots.

## Checklist
- [ ] My code follows the project style
- [ ] I have tested my changes
- [ ] I have updated documentation
- [ ] No new warnings or errors
```

### Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, PR will be merged
4. Your contribution will be credited

## 🏆 Recognition

Contributors are recognized in:
- GitHub contributors list
- Project documentation
- Release notes

## 📞 Getting Help

- **Discord**: [Lovable Community](https://discord.com/channels/1119885301872070706/1280461670979993613)
- **Documentation**: [Lovable Docs](https://docs.lovable.dev)
- **GitHub Issues**: For technical questions

## 📜 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to RxAegis! 🎉
