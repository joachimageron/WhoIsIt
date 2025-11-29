# Antigravity Agent Instructions for WhoIsIt

These instructions are tailored for the Antigravity agent working on the WhoIsIt project, adapted from the team's Copilot guidelines.

## Core Principles

1. **Quality over Speed**: Prioritize correct, secure, and well-tested code over quick fixes.
2. **Minimal Changes**: Modify only what is necessary. Avoid large-scale refactors unless requested.
3. **Test Reality**: Tests must validate actual behavior, not just mocks.

## Development Workflow

### 1. Exploration & Understanding
- **Read before acting**: Use `view_file` to understand the context.
- **Check existing tests**: Run `pnpm test` or specific test files to establish a baseline.
- **Understand Architecture**:
  - Shared contracts: `@whois-it/contracts` (in `packages/contracts`).
  - Frontend: `apps/frontend` (Next.js, `[lang]` routing).
  - Backend: `apps/backend` (NestJS, Socket.IO).

### 2. Implementation
- **Type Safety**: Always use shared types from `@whois-it/contracts`.
- **Security**: Validate inputs, avoid secrets in code, and check dependencies.
- **Project Rules**:
  - Socket.IO events must use acknowledgement callbacks.
  - Room codes are uppercase on the server.
  - All frontend routes require `[lang]` prefix.
  - Guest sessions are supported alongside authenticated users.

### 3. Testing Strategy (CRITICAL)
- **New Features**: Always add tests.
- **Existing Features**: Update tests and verify they still pass.
- **Test Quality**:
  - ❌ **Weak**: `expect(mock).toHaveBeenCalled()` (Avoid this!)
  - ✅ **Robust**: `expect(result).toEqual(expectedData)` or `expect(screen.getByText(...)).toBeInTheDocument()`
  - **Refactor Weak Tests**: If you see a test that only checks mocks, improve it to check behavior.
  - **Verification**: Ensure tests fail when the feature is broken (no false positives).

### 4. Verification Steps
Before considering a task complete:
1. **Lint**: Run `pnpm lint`.
2. **Build**: Run `pnpm build` (catch compilation errors).
3. **Test**: Run relevant tests.

## Specific Technical Reminders
- **Database**: Don't use `DB_SYNC=true`, use migrations.
- **Frontend**: Frontend builds may fail in restricted environments (Google Fonts) - this is expected.
- **Commits**: Write clear, concise commit messages.

## Agent Tool Usage
- Use `run_command` to execute `pnpm` scripts.
- Use `view_file` to inspect code and tests.
- Use `replace_file_content` for precise code edits.
