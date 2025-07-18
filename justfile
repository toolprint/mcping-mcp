#!/usr/bin/env -S just --justfile

# Recommend installing completion scripts: https://just.systems/man/en/shell-completion-scripts.html
# Recommend installing vscode extension: https://just.systems/man/en/visual-studio-code.html

# MCPing - macOS Notification MCP Server
# Commands for development, testing, and running the notification server

# Default recipe - show available commands
_default:
    @just -l -u

# Brew installation
[group('setup')]
brew:
    brew update & brew bundle install --file=./Brewfile


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

# Initial project setup
[group('setup')]
setup: brew
    npm install
    npm run build
    @echo "✅ Setup complete!"

# Run development mode
[group('dev')]
dev:
    npm run dev

# Run the server with stdio transport (for Claude Code)
[group('run')]
run-stdio:
    npm start

# Run the server with HTTP transport
[group('run')]
run-http port="3000":
    npm start -- --transport http --port {{ port }}

# Run the server with verbose logging
[group('run')]
run-verbose transport="stdio":
    npm start -- --transport {{ transport }} --verbose

# Send a test notification (requires HTTP server running)
[group('test')]
test-notify title="Test Notification" message="Hello from MCPing!" port="3000":
    @echo "📤 Sending test notification..."
    @curl -s -X POST http://localhost:{{ port }}/mcp \
        -H "Content-Type: application/json" \
        -d '{ \
            "jsonrpc": "2.0", \
            "id": 1, \
            "method": "tools/call", \
            "params": { \
                "name": "send-notification", \
                "arguments": { \
                    "title": "{{ title }}", \
                    "message": "{{ message }}", \
                    "sound": "Ping" \
                } \
            } \
        }' | jq -r '.result.content[0].text' | jq .

# Send a critical notification
[group('test')]
test-critical title="Critical Alert" message="This is urgent!" port="3000":
    @echo "🚨 Sending critical notification..."
    @curl -s -X POST http://localhost:{{ port }}/mcp \
        -H "Content-Type: application/json" \
        -d '{ \
            "jsonrpc": "2.0", \
            "id": 1, \
            "method": "tools/call", \
            "params": { \
                "name": "send-notification", \
                "arguments": { \
                    "title": "{{ title }}", \
                    "message": "{{ message }}", \
                    "urgency": "critical", \
                    "sound": true, \
                    "timeout": 30 \
                } \
            } \
        }' | jq -r '.result.content[0].text' | jq .

# Send a quiet notification
[group('test')]
test-quiet title="Info" message="Background task complete" port="3000":
    @echo "🔕 Sending quiet notification..."
    @curl -s -X POST http://localhost:{{ port }}/mcp \
        -H "Content-Type: application/json" \
        -d '{ \
            "jsonrpc": "2.0", \
            "id": 1, \
            "method": "tools/call", \
            "params": { \
                "name": "send-notification", \
                "arguments": { \
                    "title": "{{ title }}", \
                    "message": "{{ message }}", \
                    "urgency": "low", \
                    "sound": false, \
                    "timeout": 5 \
                } \
            } \
        }' | jq -r '.result.content[0].text' | jq .

# Run tests
[group('test')]
test:
    npm run test

# Run unit tests only
[group('test')]
test-unit:
    npm run test:unit

# Run integration tests only
[group('test')]
test-integration:
    npm run test:integration

# Run tests in watch mode
[group('test')]
test-watch:
    npm run test:watch

# Build the project
[group('build')]
build:
    npm run build

# Type check the project
[group('build')]
typecheck:
    npx tsc --noEmit

# Clean build artifacts and dependencies
[group('clean')]
clean:
    rm -rf dist/
    rm -rf node_modules/
    rm -rf coverage/
    rm -f *.tgz
    @echo "✅ Clean complete!"

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
    @prettier --check "**/*.json" --ignore-path .gitignore || echo "Prettier not available, skipping JSON linting"
    @echo "Linting Markdown files..."
    @markdownlint-cli2 "**/*.md" "#node_modules" "#.git" || echo "Markdownlint not available, skipping Markdown linting"
    @echo "Linting complete!"

# Pre-publish checks: build, test, lint, and typecheck
[group('publish')]
pre-publish-checks: build test lint typecheck
    @echo "✅ All pre-publish checks passed!"

[group('publish')]
publish: pre-publish-checks
    npm publish --access public

# Version bump and publish commands
[group('publish')]
publish-patch: pre-publish-checks
    npm version patch --no-git-tag-version
    npm publish --access public

[group('publish')]
publish-minor: pre-publish-checks
    npm version minor --no-git-tag-version
    npm publish --access public

[group('publish')]
publish-major: pre-publish-checks
    npm version major --no-git-tag-version
    npm publish --access public

[group('publish')]
publish-beta: pre-publish-checks
    npm version prerelease --preid=beta --no-git-tag-version
    npm publish --access public --tag beta

# Dry run commands
[group('publish')]
publish-dry-run-patch: pre-publish-checks
    npm version patch --no-git-tag-version --dry-run
    npm publish --dry-run --access public

[group('publish')]
publish-dry-run-minor: pre-publish-checks
    npm version minor --no-git-tag-version --dry-run
    npm publish --dry-run --access public

[group('publish')]
publish-dry-run-major: pre-publish-checks
    npm version major --no-git-tag-version --dry-run
    npm publish --dry-run --access public

[group('publish')]
publish-dry-run-beta: pre-publish-checks
    npm version prerelease --preid=beta --no-git-tag-version --dry-run
    npm publish --dry-run --access public --tag beta

# Test local installation
[group('publish')]
test-install: build
    #!/usr/bin/env bash
    echo "📦 Testing local installation..."
    
    # Create package tarball
    npm pack
    
    # Install globally
    PACKAGE_FILE=$(ls toolprint-mcping-mcp-*.tgz | head -1)
    npm install -g "./$PACKAGE_FILE"
    
    # Test installation
    echo "🧪 Testing global command..."
    mcping-mcp --version
    
    echo "🧪 Testing npx execution..."
    npx @toolprint/mcping-mcp --version
    
    # Cleanup
    npm uninstall -g @toolprint/mcping-mcp
    rm -f toolprint-mcping-mcp-*.tgz
    
    echo "✅ Local installation test completed!"

# Quick test workflow - build and send test notification
[group('test')]
quick-test: build
    #!/usr/bin/env bash
    set -e
    echo "🚀 Starting MCPing server..."
    npm start -- --transport http --port 8999 &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 2
    
    echo "📤 Sending test notifications..."
    just test-notify "Build Complete" "All tests passed!" 8999
    sleep 1
    just test-critical "Test Failed" "3 tests failed" 8999
    sleep 1
    just test-quiet "Background Task" "Data sync complete" 8999
    
    # Stop server
    kill $SERVER_PID
    echo "✅ Quick test completed!"

# Test new notification features with icon and sound
[group('test')]
test-features port="3000":
    #!/usr/bin/env bash
    set -e
    echo "🚀 Starting MCPing server for feature testing..."
    npm start -- --transport http --port {{ port }} &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 2
    
    echo "🔔 Testing built-in sound notifications..."
    just test-notify-sound "Sound Test" "Testing Ping sound" "Ping" {{ port }}
    sleep 1
    just test-notify-sound "Sound Test" "Testing Glass sound" "Glass" {{ port }}
    sleep 1
    
    echo "🖼️ Testing with system icon..."
    just test-notify-icon "Icon Test" "Testing with Finder icon" "/System/Library/CoreServices/Finder.app/Contents/Resources/Finder.icns" {{ port }}
    sleep 1
    
    echo "🌐 Testing with clickable URL..."
    just test-notify-url "URL Test" "Click to open GitHub" "https://github.com/toolprint/mcping-mcp" {{ port }}
    
    # Stop server
    kill $SERVER_PID
    echo "✅ Feature test completed!"

# Test notification with custom sound
[group('test')]
test-notify-sound title message sound port="3000":
    @echo "🔔 Sending notification with {{ sound }} sound..."
    @curl -s -X POST http://localhost:{{ port }}/mcp \
        -H "Content-Type: application/json" \
        -d '{ \
            "jsonrpc": "2.0", \
            "id": 1, \
            "method": "tools/call", \
            "params": { \
                "name": "send-notification", \
                "arguments": { \
                    "title": "{{ title }}", \
                    "message": "{{ message }}", \
                    "sound": "{{ sound }}" \
                } \
            } \
        }' | jq -r '.result.content[0].text' | jq .

# Test notification with custom icon
[group('test')]
test-notify-icon title message icon port="3000":
    @echo "🖼️ Sending notification with custom icon..."
    @curl -s -X POST http://localhost:{{ port }}/mcp \
        -H "Content-Type: application/json" \
        -d '{ \
            "jsonrpc": "2.0", \
            "id": 1, \
            "method": "tools/call", \
            "params": { \
                "name": "send-notification", \
                "arguments": { \
                    "title": "{{ title }}", \
                    "message": "{{ message }}", \
                    "icon": "{{ icon }}", \
                    "sound": "Tink" \
                } \
            } \
        }' | jq -r '.result.content[0].text' | jq .

# Test notification with clickable URL
[group('test')]
test-notify-url title message url port="3000":
    @echo "🌐 Sending notification with clickable URL..."
    @curl -s -X POST http://localhost:{{ port }}/mcp \
        -H "Content-Type: application/json" \
        -d '{ \
            "jsonrpc": "2.0", \
            "id": 1, \
            "method": "tools/call", \
            "params": { \
                "name": "send-notification", \
                "arguments": { \
                    "title": "{{ title }}", \
                    "message": "{{ message }}", \
                    "open": "{{ url }}", \
                    "sound": "Hero" \
                } \
            } \
        }' | jq -r '.result.content[0].text' | jq .