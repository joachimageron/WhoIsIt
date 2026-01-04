## Guidelines for Copilot Coding Agents

When making changes to this repository, follow these essential guidelines:

### Making Code Changes

- **Minimal modifications**: Make the smallest possible changes to achieve the goal. Change as few lines as possible.
- **Test incrementally**: Build and test changes frequently after each modification.
- **Ignore unrelated issues**: Don't fix unrelated bugs or broken tests. Focus only on your specific task.

### Decision Priorities (highest to lowest impact on success)

1. Test quality and correctness over speed
2. Security and data protection
3. Type safety and adherence to shared contracts (`@whois-it/contracts`)
4. Minimal changes and maintainability
5. Speed/throughput

### Before Making Changes

1. **Understand the codebase**: Explore relevant files and understand the existing architecture.
2. **Check existing tests**: Run `pnpm test` and `pnpm lint` to understand the baseline.
3. **Identify test patterns**: Look at existing tests in `apps/backend/src/**/*.spec.ts` and `apps/frontend/src/**/*.test.ts|tsx` to understand the testing approach.
4. **Review related tests**: Search for existing tests that cover the code you're about to modify.
5. **Audit test quality**: When reviewing tests, verify they test real functionality. If tests only check mock calls without validating behavior, fix them to test actual outcomes.

### During Development

1. **Lint early and often**: Run `pnpm lint` after making changes.
2. **Build frequently**: Use `pnpm build` to catch compilation errors early.
3. **Test thoroughly**: Run relevant tests with `pnpm test` or workspace-specific commands.
4. **Use existing tools**: Prefer ecosystem tools (npm scripts, package managers) over manual changes.
5. **Validate test quality**: When running tests, analyze if they truly validate functionality. Fix weak tests even if they weren't part of your original task.

### Testing Requirements

#### When Adding New Features

1. **Always add tests** for new features (controllers, services, gateways, components, composables)
2. **Test must validate**:
   - Expected behavior (happy path)
   - Error handling (edge cases)
   - Integration with dependencies
3. **Verify test quality**:
   - Run the test and confirm it passes
   - Temporarily break the feature and confirm the test fails
   - Ensure assertions check actual results, not just mock calls

#### When Modifying Existing Features

1. **Search for existing tests** that cover the modified code
2. **Run existing tests** before making changes to establish baseline
3. **Audit existing tests**:
   - Check if tests validate real behavior or just mock interactions
   - If tests are weak (only checking mocks, no real assertions), refactor them to test actual functionality
   - Fix poor quality tests even if they weren't initially in scope
4. **Update tests** to match new behavior:
   - Adjust expectations if behavior changed intentionally
   - Add new test cases for new scenarios
   - Remove obsolete test cases
5. **Verify test quality**:
   - Check that tests still validate real functionality
   - Ensure tests aren't just "passing for the sake of passing"
   - Confirm tests fail when feature is broken
6. **Run tests after changes** to ensure they still pass

#### Test Quality Checklist

Before considering a test complete, verify:
- ✅ Test has meaningful assertions (not just `expect(mock).toHaveBeenCalled()`)
- ✅ Test validates actual output/behavior
- ✅ Test fails when the feature it tests is broken
- ✅ Test covers both success and failure scenarios
- ✅ Mocks are used appropriately (external dependencies only)
- ❌ Avoid testing implementation details instead of behavior
- ❌ Avoid tests that pass regardless of feature correctness

#### Test Quality Enforcement

**When analyzing or running tests**:
1. **Always evaluate test quality**: Don't assume existing tests are good just because they pass
2. **Identify weak tests**: Look for tests that only verify mock calls without checking actual results
3. **Fix weak tests proactively**: Even if not part of your task, refactor poor quality tests to validate real behavior
4. **Report improvements**: When fixing test quality issues, document what was improved in commit messages

#### Policy for weak tests found out-of-scope (when to refactor vs. signal)

- Refactor immediately if:
  - The weak test covers code you are modifying, or
  - It blocks your change or hides real behavior, or
  - The fix is trivial (<10 lines or <15 minutes).
- Otherwise:
  - Open an issue with a brief proposal and proceed.
  - Do not weaken or delete tests to pass CI.

#### Examples: weak vs. robust tests

Backend (NestJS/Jest):
```ts
// Weak: only checks mock calls; no behavior validated
it('creates user', async () => {
  const repo = { save: jest.fn() } as any;
  const svc = new UserService(repo);
  await svc.create({ name: 'A' });
  expect(repo.save).toHaveBeenCalled(); // does not assert result
});

// Robust: validates observable outcome
it('creates user and returns persisted data', async () => {
  const mem: any[] = [];
  const repo = { save: async (u: any) => (mem.push({ id: 1, ...u }), mem[0]) } as any;
  const svc = new UserService(repo);
  const created = await svc.create({ name: 'A' });
  expect(created).toMatchObject({ id: 1, name: 'A' });
});
```

Frontend (React Testing Library):
```tsx
// Weak: asserts navigation mock only
it('navigates on success', async () => {
  const navigate = jest.fn();
  render(<MyForm onSuccessNavigate={navigate} />);
  fireEvent.click(screen.getByText('Submit'));
  expect(navigate).toHaveBeenCalled(); // no UI/behavior assertion
});

// Robust: asserts visible outcome and side-effect
it('shows success state and navigates', async () => {
  const navigate = jest.fn();
  render(<MyForm onSuccessNavigate={navigate} />);
  fireEvent.click(screen.getByText('Submit'));
  expect(await screen.findByText('Saved')).toBeInTheDocument();
  expect(navigate).toHaveBeenCalledWith('/done');
});
```

### Security and Quality

- **Security scanning**: Always validate changes don't introduce security vulnerabilities.
- **Dependency checks**: When adding dependencies, verify they don't have known vulnerabilities.
- **Code review**: Request code reviews before finalizing changes using the code_review tool.
- **Type safety**: Maintain TypeScript type safety. Use types from `@whois-it/contracts` for shared interfaces.

#### Detailed security checklist (dependencies, secrets)

Dependencies and supply chain:
- Run `pnpm audit --recursive` and address high/critical issues.
- Prefer exact versions for critical runtime deps; avoid widening ranges without reason.
- Inspect new deps: no risky `postinstall` scripts; active maintenance; permissive license.
- Verify lockfile integrity is committed and not manually edited.
- Build locally with `pnpm build` to catch unexpected transitive changes.

Secrets and configuration:
- Never commit secrets. Keep only placeholders in `.env.example`.
- Validate environment variable access paths; provide safe defaults where appropriate.
- Do not log secrets, tokens, or PII. Redact when logging.
- Review third-party calls for SSRF and URL validation if user input is involved.
- If adding cloud SDKs/clients, document required scopes and principle of least privilege.

App surface:
- Validate and sanitize inputs at boundaries (controllers, HTTP, sockets).
- Enforce auth/authorization checks where applicable; do not rely on client-side only.
- Avoid dynamic `eval`/Function; restrict regex patterns to avoid ReDoS.

### Committing Changes

- **Report progress frequently**: Use the report_progress tool to commit and push changes.
- **Meaningful commits**: Write clear, concise commit messages describing what changed.
- **Review before commit**: Always review the files that will be committed.
- **Use .gitignore**: Exclude build artifacts, dependencies (node_modules, dist), and temporary files.

#### Recommended progress reporting cadence

Use `report_progress`:
- After establishing baseline (first `pnpm test && pnpm lint`).
- After introducing a new failing test (red) and after making it pass (green).
- After each logically complete step or ~20–30 minutes, whichever comes first.
- When fixing a security or type-safety issue.
- Before stopping work or switching tasks.

### Documentation

- **Update related docs**: If you change or add functionality, always update relevant documentation.
- **Keep consistency**: Match the style and format of existing documentation.
- **Inline comments**: Add comments only when they match existing patterns or are necessary for complex logic.

### Troubleshooting Failed Changes

If tests or builds fail:
1. Read error messages carefully
2. Check if the failure is related to your changes
3. Review the specific section in this document related to the error
4. Use the troubleshooting section above for common issues
5. If a test fails after your changes, investigate why before attempting fixes
6. Don't make tests pass by weakening assertions or removing validations

### Key Reminders

- ✅ Always use types from `packages/contracts` for cross-cutting changes
- ✅ Socket.IO events must use acknowledgement callbacks
- ✅ Room codes are uppercase on the server
- ✅ All frontend routes require `[lang]` prefix
- ✅ Guest sessions are supported alongside authenticated users
- ✅ Tests are required for both backend and frontend features
- ✅ Tests must validate real functionality
- ✅ Update existing tests when modifying features
- ✅ New features require new tests
- ✅ **Proactively fix weak tests**: When you encounter tests that only check mocks without validating behavior, refactor them even if not in your original scope
- ✅ Update documentation for new or changed features
- ⚠️ Frontend builds may fail in restricted environments (Google Fonts) - this is expected
- ⚠️ Don't use `DB_SYNC=true` in production - use migrations instead
- ⚠️ Tests must fail when the feature they test is broken
