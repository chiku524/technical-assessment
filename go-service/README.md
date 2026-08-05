# Go PDF Report Microservice

Standalone service that generates student PDF reports by calling the Node.js backend API (no direct DB access).

## Run locally

1. Start PostgreSQL + Node backend.
2. From this directory:

```bash
go mod tidy
go run .
```

Service listens on `http://localhost:8080` by default.

## Endpoint

```bash
curl -OJ "http://localhost:8080/api/v1/students/1/report"
```

Optional: forward browser auth cookies / CSRF:

```bash
curl -OJ \
  -H "Cookie: accessToken=...; refreshToken=...; csrfToken=..." \
  -H "x-csrf-token: ..." \
  "http://localhost:8080/api/v1/students/1/report"
```

If auth headers are omitted, the service logs in with:

- `NODE_API_USER` (default `admin@school-admin.com`)
- `NODE_API_PASSWORD` (default demo password)

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Listen port |
| `NODE_API_URL` | `http://localhost:5007` | Node backend base URL |
| `NODE_API_USER` | admin email | Service login username |
| `NODE_API_PASSWORD` | demo password | Service login password |
