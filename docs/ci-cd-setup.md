# CI/CD Setup Guide

This document describes the CI/CD setup for the WhoIsIt project.

## GitHub Actions Workflow

The project uses GitHub Actions for continuous integration. The workflow is defined in `.github/workflows/ci.yml` and runs on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### Jobs

The CI workflow includes three parallel jobs:

1. **Lint**: Runs ESLint on all workspace packages
2. **Test**: Runs Jest tests on the backend
3. **Build**: Builds both backend and frontend packages

### Features

- **pnpm Caching**: Dependencies are cached to speed up CI runs
- **Node.js 20 LTS**: Uses the latest LTS version of Node.js
- **Parallel Execution**: Jobs run in parallel for faster feedback
- **Error Handling**: Frontend build failures are allowed due to Google Fonts network restrictions in CI environments

## Branch Protection (Recommended)

To ensure code quality and prevent direct pushes to main, it's recommended to enable branch protection rules for the `main` branch.

### How to Enable Branch Protection

1. Go to the repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Click **Add rule** under "Branch protection rules"
4. Configure the following settings:

   **Branch name pattern**: `main`

   **Protect matching branches**:
   - ✅ Require a pull request before merging
     - ✅ Require approvals (suggested: 1)
   - ✅ Require status checks to pass before merging
     - ✅ Require branches to be up to date before merging
     - **Required status checks**:
       - `lint`
       - `test`
       - `build`
   - ✅ Do not allow bypassing the above settings (recommended for production)

5. Click **Create** or **Save changes**

### Benefits

- **Code Quality**: All code must pass lint, test, and build checks
- **Review Process**: Requires code review before merging
- **Prevention of Accidents**: Prevents accidental direct pushes to main
- **CI/CD Enforcement**: Ensures the CI pipeline runs on all changes

## Local Development

Before pushing code, you can run the same checks locally:

```bash
# Run all checks
pnpm lint    # Lint all packages
pnpm test    # Run tests
pnpm build   # Build all packages

# Run checks for specific packages
pnpm --filter @whois-it/backend lint
pnpm --filter @whois-it/backend test
pnpm --filter @whois-it/backend build
```

## Troubleshooting

### Frontend Build Failures

The frontend build may fail in CI environments due to Google Fonts access restrictions. This is a known issue and is handled by the `continue-on-error: true` flag in the workflow. In local development, ensure you have internet access to fonts.googleapis.com.

### Cache Issues

If you encounter issues with cached dependencies, you can clear the GitHub Actions cache:

1. Go to **Actions** → **Caches**
2. Delete the relevant cache
3. Re-run the workflow

### Node.js Version Mismatch

The CI uses Node.js 20 LTS. Ensure your local environment uses the same version:

```bash
node --version  # Should show v20.x.x
```

You can use `nvm` or `fnm` to manage Node.js versions:

```bash
# Using nvm
nvm install 20
nvm use 20

# Using fnm
fnm install 20
fnm use 20
```
