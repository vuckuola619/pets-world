# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Active |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public issue
2. Email: [insert-security-email@example.com]
3. Include a detailed description and steps to reproduce
4. We will acknowledge within 48 hours and provide a fix timeline

## Security Considerations

### Client-Side Application

World Wildlife Atlas is a **fully static, client-side application**. It does not:
- Store user data on any server
- Process authentication credentials
- Handle financial transactions
- Access device sensors (camera, microphone, geolocation are disabled via Permissions-Policy)

### API Key Exposure

The optional `NEXT_PUBLIC_API_NINJAS_KEY` is exposed in the client bundle. This is **by design** for static export architecture. The key is:
- A free-tier API key with rate limiting (10 req/sec)
- Read-only access to public animal data
- Not linked to any billing or sensitive operations

### Security Headers

The following headers are configured in `next.config.ts`:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unused APIs |

### Data Validation

All imported data is validated at build time using **Zod 4** schemas, preventing malformed or injected data from reaching the UI.

### Dependencies

- Dependencies are auditable via `npm audit`
- The CI pipeline runs `npm ci` (clean install) to ensure reproducible builds
- No server-side dependencies — the entire app runs in the browser
