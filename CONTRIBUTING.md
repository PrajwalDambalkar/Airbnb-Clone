# Contributing to Airbnb Clone

Thank you for contributing! This document outlines our branching strategy and workflow.

## Branch Hierarchy

Our repository follows a strict branching hierarchy to maintain code quality and organization:

```
main (production)
  ↑
dev (integration/staging)
  ↑              ↑
prajwal       Pukhraj (personal integration branches)
  ↑              ↑
feature/*    feature/* (feature branches)
```

## Branching Strategy

### Branch Types

1. **`main`** - Production-ready code
   - Only accepts merges from `dev`
   - Protected branch
   - Requires PR review

2. **`dev`** - Integration/Staging environment
   - Only accepts merges from `prajwal` or `Pukhraj`
   - All features are integrated here before production
   - Protected branch

3. **`prajwal` / `Pukhraj`** - Personal integration branches
   - Only accept merges from `feature/*` branches
   - Used to integrate multiple features from the same developer
   - Can also accept PRs from forked repositories

4. **`feature/*`** - Feature development branches
   - Must follow naming: `feature/descriptive-name`
   - Examples: `feature/add-login`, `feature/booking-system`
   - Merge into `prajwal` or `Pukhraj` only

### Workflow

#### For Direct Contributors (with write access)

1. **Create a feature branch from your personal branch:**
   ```bash
   git checkout prajwal  # or Pukhraj
   git pull origin prajwal
   git checkout -b feature/your-feature-name
   ```

2. **Develop your feature:**
   ```bash
   # Make changes
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

3. **Create PR to your personal branch:**
   - `feature/your-feature-name` → `prajwal` (or `Pukhraj`)
   - Get code review
   - Merge after approval

4. **Integrate to dev:**
   - `prajwal` (or `Pukhraj`) → `dev`
   - After testing multiple features together

5. **Deploy to production:**
   - `dev` → `main`
   - After thorough testing on dev

#### For External Contributors (Forked Repo - e.g., Pukhraj)

1. **Fork the repository** (already done for Pukhraj)

2. **Create feature branch in your fork:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Develop and push to your fork:**
   ```bash
   git add .
   git commit -m "feat: your feature"
   git push origin feature/your-feature-name
   ```

4. **Create PR to main repo's personal branch:**
   - From: `your-fork/feature/your-feature-name`
   - To: `main-repo/Pukhraj` (or your designated branch)

5. **After merge, main repo owner will:**
   - Integrate `Pukhraj` → `dev`
   - Then `dev` → `main`

## Branch Protection Rules

The following rules are enforced automatically via GitHub Actions:

- ✅ PRs to `main` must come from `dev` only
- ✅ PRs to `dev` must come from `prajwal` or `Pukhraj` only
- ✅ PRs to `prajwal`/`Pukhraj` must come from `feature/*` branches

**These rules are validated automatically** - PRs that violate the hierarchy will fail CI checks.

## Commit Message Convention

Please follow conventional commits format:

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
feat: add user authentication
fix: resolve booking date validation bug
docs: update API documentation
```

## Pull Request Guidelines

1. **Use the PR template** (auto-populated when creating PR)
2. **Link related issues** if applicable
3. **Provide clear description** of changes
4. **Add screenshots** for UI changes
5. **Ensure CI checks pass** before requesting review
6. **Keep PRs focused** - one feature per PR
7. **Update documentation** if needed

## Code Review Process

1. Create PR following the branch hierarchy
2. Automated checks will run (branch validation, tests, linting)
3. Request review from team members
4. Address review comments
5. Merge after approval and passing checks

## Questions?

If you have questions about the workflow or encounter issues, please:
- Check this document first
- Review closed PRs for examples
- Ask in team discussions

---

**Remember:** Following the branch hierarchy keeps our codebase organized and stable! 🚀
