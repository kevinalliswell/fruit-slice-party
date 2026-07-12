# Contributing

Thanks for helping improve Fruit Slice Party.

## Development

1. Fork and clone the repository.
2. Create a focused branch from `main`.
3. Install dependencies with `npm ci`.
4. Make one logical change at a time.
5. Run `npm run check` before opening a pull request.

Use Node.js 20.19 or newer. Keep the game playable without external runtime services or image downloads.

## Pull Requests

Please include:

- A concise explanation of the player-facing change
- Tests for changed rules, collision logic, or audio behavior
- Browser screenshots for visual changes
- The phone, tablet, or desktop sizes you verified

Pull requests must pass CI. Avoid unrelated refactors, generated build output, and new dependencies unless they clearly reduce project complexity.

## Accessibility

Interactive elements must remain keyboard accessible. Preserve visible focus states, readable contrast, responsive layouts down to 320px wide, and meaningful accessible names.

## Reporting Bugs

Use the bug report template and include browser/device details, reproduction steps, expected behavior, and observed behavior. Report security issues privately according to [SECURITY.md](SECURITY.md).
