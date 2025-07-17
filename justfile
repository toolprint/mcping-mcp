#!/usr/bin/env -S just --justfile

# Recommend installing completion scripts: https://just.systems/man/en/shell-completion-scripts.html
# Recommend installing vscode extension: https://just.systems/man/en/visual-studio-code.html

# Common commands
doppler_run := "doppler run --"
doppler_run_preserve := "doppler run --preserve-env --"

# Default recipe - show available commands
_default:
    @just -l -u

# Brew installation
[group('setup')]
brew:
    brew update & brew bundle install --file=./Brewfile

[group('setup')]
doppler-install:
    brew install gnupg
    brew install dopplerhq/cli/doppler

# Recursively sync git submodules
[group('git')]
sync-submodules:
    git submodule update --init --recursive

# Show git status
[group('git')]
git-status:
    git status

# Create a new git branch
[group('git')]
git-branch name:
    git checkout -b {{ name }}

# Initial MCP server setup
[group('setup')]
setup:
    npm install
    npm run build

# Run MCP server in development mode
[group('dev')]
dev:
    npm run dev

# Run MCP server with stdio transport
[group('dev')]
start-stdio:
    npm run build && node dist/index.js --transport stdio

# Run MCP server with HTTP transport
[group('dev')]
start-http port="3000":
    npm run build && node dist/index.js --transport http --port {{ port }} --verbose

# Run MCP inspector to test the server
[group('dev')]
inspector port="3000":
    @echo "Starting MCP Inspector on port {{ port }}..."
    npx @modelcontextprotocol/inspector http://localhost:{{ port }}/mcp

# Run MCP server tests
[group('test')]
test:
    npm test

# Run unit tests only
[group('test')]
test-unit:
    npm run test:unit

# Run integration tests only
[group('test')]
test-integration:
    npm run build && npm run test:integration

# Run tests in watch mode
[group('test')]
test-watch:
    npm run test:watch

# Run tests with coverage
[group('test')]
test-coverage:
    npm run test:coverage

# Build the MCP server
[group('build')]
build:
    npm run build

# Clean build artifacts and dependencies
[group('clean')]
clean:
    rm -rf node_modules dist coverage

# Format code
[group('lint')]
format:
    @echo "Formatting JSON files..."
    @prettier --write "**/*.json" --ignore-path .gitignore || true
    @echo "Formatting Markdown files..."
    @markdownlint-cli2 --fix "**/*.md" "#node_modules" "#.git" || true
    @echo "Formatting complete!"

# Lint code
[group('lint')]
lint:
    @echo "Linting JSON files..."
    @prettier --check "**/*.json" --ignore-path .gitignore || exit 1
    @echo "Linting Markdown files..."
    @markdownlint-cli2 "**/*.md" "#node_modules" "#.git" || exit 1
    @echo "Linting complete!"