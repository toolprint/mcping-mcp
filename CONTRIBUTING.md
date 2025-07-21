# Contributing to MCPing

Thank you for your interest in contributing to MCPing! We welcome contributions from the community and appreciate your help in making this project better.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Running Tests](#running-tests)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.

## How to Contribute

### Reporting Bugs

- Use the GitHub issue tracker to report bugs
- Check if the issue has already been reported
- Use the bug report template when creating new issues
- Include steps to reproduce, expected behavior, and actual behavior

### Suggesting Enhancements

- Use the GitHub issue tracker to suggest enhancements
- Use the feature request template when applicable
- Clearly describe the feature and its potential benefits
- Consider if the feature aligns with the project's goals

### Code Contributions

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'feat: add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm package manager
- macOS (for notification functionality)

### Installation

1. Clone your fork of the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mcping-mcp.git
   cd mcping-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Running Tests

### Run all tests:
```bash
npm test
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Run unit tests only:
```bash
npm run test:unit
```

### Run integration tests:
```bash
npm run test:integration
```

### Run tests with coverage:
```bash
npm run test:coverage
```

## Submitting Changes

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. Please format your commit messages as follows:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat(notifications): add support for custom sounds

Added ability to specify custom sound files for notifications
through the soundPath parameter.

Closes #123
```

### Pull Request Process

1. Update the README.md with details of changes if applicable
2. Ensure all tests pass and coverage is maintained
3. Update documentation for any API changes
4. Request review from maintainers
5. Wait for approval before merging

## Coding Standards

### TypeScript Guidelines

- Use TypeScript strict mode
- Provide explicit types for function parameters and return values
- Use interfaces for object types
- Avoid `any` type - use `unknown` if type is truly unknown

### Code Style

- Follow the existing code style in the project
- Run `npm run lint` to check for linting errors
- Run `npm run format` to format code with Prettier
- Use meaningful variable and function names
- Add comments for complex logic

### Testing Guidelines

- Write unit tests for all new functionality
- Maintain test coverage above 80%
- Use descriptive test names
- Test edge cases and error conditions
- Mock external dependencies

## Issue Guidelines

### Creating Issues

- Search existing issues before creating a new one
- Use the appropriate issue template
- Provide as much detail as possible
- Include screenshots or logs when relevant

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Documentation improvements
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed

## Questions?

If you have questions about contributing, please open a discussion in the GitHub Discussions tab or reach out to the maintainers.

Thank you for contributing to MCPing! 🎉