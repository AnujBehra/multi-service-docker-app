# 🐳 Multi-Service Docker Application

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NGINX REVERSE PROXY                                  │
│                    (Load Balancer, SSL, Rate Limiting)                       │
│                         Port 80/443 → :80                                    │
└───────────┬─────────────────────┬───────────────────────┬───────────────────┘
            │                     │                       │
            ▼                     ▼                       ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────────────┐
│   REACT FRONTEND  │  │   EXPRESS BACKEND │  │    MONITORING STACK           │
│   (Static Files)  │  │   (REST API)      │  │ • Prometheus (Metrics)        │
│   Port 80         │  │   Port 3000       │  │ • Grafana (Dashboards)        │
│                   │  │                   │  │ • Loki (Logs)                 │
└───────────────────┘  └─────────┬─────────┘  └───────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
            ┌───────────┐ ┌───────────┐ ┌───────────┐
            │ PostgreSQL│ │   Redis   │ │  Logging  │
            │  Database │ │   Cache   │ │  System   │
            │  :5432    │ │   :6379   │ │           │
            └───────────┘ └───────────┘ └───────────┘
```

## 🗂️ Project Structure

```
dockerproject01/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── config/            # Database, Redis, Swagger config
│   │   ├── middleware/        # Auth, validation middleware
│   │   ├── routes/            # API route handlers
│   │   ├── utils/             # Logger, metrics utilities
│   │   └── index.js           # Main entry point
│   ├── Dockerfile             # Production build
│   └── Dockerfile.dev         # Development with hot reload
│
├── frontend/                   # React Application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API service layer
│   │   └── App.js             # Main app component
│   ├── Dockerfile             # Production multi-stage build
│   └── nginx.conf             # Frontend nginx config
│
├── nginx/                      # Reverse Proxy
│   ├── nginx.conf             # Main nginx configuration
│   └── Dockerfile
│
├── database/                   # Database Setup
│   ├── init/                  # SQL initialization scripts
│   │   ├── 01-init.sql       # Items table
│   │   └── 02-users.sql      # Users & auth tables
│   └── config/                # PostgreSQL config
│
├── monitoring/                 # Observability Stack
│   ├── prometheus/            # Metrics collection config
│   ├── grafana/               # Dashboards & datasources
│   ├── loki/                  # Log aggregation config
│   └── promtail/              # Log collector config
│
├── docker-compose.yml          # Standard deployment
├── docker-compose.dev.yml      # Development with hot reload
├── docker-compose.prod.yml     # Full production stack
├── Makefile                    # Convenience commands
└── .env.example               # Environment variables template
```

## 🚀 Quick Start Commands

### Development Mode (Hot Reload)
```bash
make dev
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

### Production Mode
```bash
make prod
# App:       http://localhost
# Grafana:   http://localhost:3001
# Prometheus: http://localhost:9090
```

### Standard Mode
```bash
docker-compose up -d
# App: http://localhost
```

## 🔐 Authentication System

### Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (requires auth) |
| GET | `/api/auth/me` | Get current user profile |

### Usage Example
```bash
# Register
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","username":"myuser"}'

# Login
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Access protected route
curl http://localhost/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Demo Credentials
- **Email:** admin@example.com
- **Password:** admin123

## 📊 Monitoring Stack

### Prometheus (Metrics)
- **URL:** http://localhost:9090
- **Metrics Endpoint:** http://localhost/metrics
- Collects: request rates, response times, memory usage

### Grafana (Dashboards)
- **URL:** http://localhost:3001
- **Login:** admin / admin
- Pre-configured dashboards for application metrics

### Loki (Logs)
- Centralized log aggregation
- Query logs via Grafana

## 🛠️ Available Make Commands

```bash
make help          # Show all commands
make dev           # Start development mode
make prod          # Start production mode
make stop          # Stop all containers
make logs          # View real-time logs
make clean         # Remove all containers and volumes
make shell-backend # SSH into backend container
make shell-db      # Connect to PostgreSQL
make backup        # Backup database
```

## 🌐 API Endpoints

### Items API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | Get all items |
| GET | `/api/items/:id` | Get single item |
| POST | `/api/items` | Create item |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |

### System Endpoints
| Endpoint | Description |
|----------|-------------|
| `/health` | Health check (DB + Redis status) |
| `/ready` | Readiness probe |
| `/live` | Liveness probe |
| `/metrics` | Prometheus metrics |
| `/api/docs` | Swagger API documentation |

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DB_NAME=appdb
DB_USER=appuser
DB_PASSWORD=apppassword

# JWT
JWT_SECRET=your-super-secret-key

# Monitoring
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin

# Ports
NGINX_PORT=80
FRONTEND_PORT=3000
BACKEND_PORT=3001
```

## 🏗️ How Services Connect

1. **User Request** → Nginx (port 80)
2. **Nginx** routes `/api/*` → Backend, everything else → Frontend
3. **Backend** connects to PostgreSQL and Redis
4. **Frontend** calls Backend API via `/api` proxy
5. **Prometheus** scrapes `/metrics` from Backend
6. **Grafana** queries Prometheus for dashboards
7. **Promtail** collects container logs → Loki

## 🔒 Security Features

- ✅ Helmet.js security headers
- ✅ Rate limiting (100 req/15min)
- ✅ CORS configuration
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Input validation
- ✅ SQL injection protection
- ✅ Non-root Docker containers

## 📈 Scaling

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3
```

Nginx will automatically load balance between instances.
