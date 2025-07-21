# Security Policy

## Reporting Security Vulnerabilities

We take the security of MCPing seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please email us at: **support@onegrep.dev**

Include the following information:
- Type of issue (e.g., arbitrary code execution, command injection, information disclosure, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- We will acknowledge your email within 48 hours
- We will provide a detailed response within 7 days indicating our next steps
- We will keep you informed of progress towards fixing the issue
- We may ask for additional information or guidance

### Security Best Practices

When using MCPing:

1. **System Permissions**: Only grant notification permissions to trusted applications
2. **Environment Variables**: Store sensitive configuration in environment variables, never in code
3. **Network Security**: Use HTTPS endpoints when running in HTTP mode
4. **Updates**: Keep the package updated to the latest version for security patches
5. **Input Validation**: The server validates all inputs, but ensure your integration also validates data

### Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | ✅ Yes             |

### Security Considerations for Notifications

- **User Privacy**: Notification content may be visible to other users on shared systems
- **Content Filtering**: Avoid displaying sensitive information in notifications
- **Rate Limiting**: The server implements rate limiting to prevent notification spam
- **Permission Model**: macOS requires explicit user permission for notifications

### Disclosure Policy

- Security issues will be disclosed publicly after a fix is available
- We will credit reporters who responsibly disclose vulnerabilities
- We aim to fix critical vulnerabilities within 30 days of confirmation

## Security Features

MCPing includes several security features:

- Input validation using Zod schemas
- Sanitization of notification content
- Rate limiting to prevent abuse
- No execution of arbitrary code
- Minimal system permissions required

## Contact

For security concerns, contact: **support@onegrep.dev**

For general questions, use GitHub Discussions or Issues.