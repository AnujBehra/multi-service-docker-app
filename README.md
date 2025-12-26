# 🐳 Multi-Service Docker Application

A **production-ready**, enterprise-grade multi-service Docker implementation featuring microservices architecture with comprehensive monitoring, logging, security, and DevOps best practices.

![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat&logo=nginx&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=flat&logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat&logo=grafana&logoColor=white)

## 🏗️ Architecture

```
                              ┌─────────────────────────────────────┐
                              │          NGINX PROXY                │
                              │    (SSL/TLS, Rate Limiting,        │
                              │     Load Balancing)                │
                              │         Port 80/443                │
                              └───────────┬─────────────────────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                           │                           │
   ┌──────────▼──────────┐    ┌───────────▼───────────┐   ┌──────────▼──────────┐
   │   FRONTEND (React)  │    │   BACKEND (Node.js)   │   │    MONITORING       │
   │   Nginx Static      │    │   Express API         │   │    Prometheus       │
   │   Port: 80          │    │   Port: 3000          │   │    Grafana          │
   └─────────────────────┘    └───────────┬───────────┘   │    Loki             │
                                          │               └─────────────────────┘
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
          ┌─────────▼─────────┐  ┌────────▼────────┐  ┌─────────▼─────────┐
          │    POSTGRESQL     │  │     REDIS       │  │      BACKUP       │
          │    (Database)     │  │    (Cache)      │  │    (Automated)    │
          │    Port: 5432     │  │    Port: 6379   │  │    Retention: 7d  │
          └───────────────────┘  └─────────────────┘  └───────────────────┘
```

## ✨ Features

### 🔐 Security
- **SSL/TLS Support** - HTTPS with modern cipher suites
- **Rate Limiting** - API and connection rate limiting
- **Security Headers** - HSTS, CSP, X-Frame-Options, etc.
- **Non-root Containers** - All services run as non-root users
- **Network Isolation** - Database on internal-only network
- **Input Validation** - Request validation with express-validator
- **HTTP Parameter Pollution Protection** - HPP middleware

### 📊 Monitoring & Observability
- **Prometheus** - Metrics collection and alerting
- **Grafana** - Beautiful dashboards and visualization
- **Loki + Promtail** - Centralized log aggregation
- **Node Exporter** - System metrics
- **cAdvisor** - Container metrics
- **PostgreSQL Exporter** - Database metrics
- **Redis Exporter** - Cache metrics
- **Custom API Metrics** - Request rate, latency, error rate

### 🚀 Performance
- **Multi-stage Docker Builds** - Minimal production images
- **Redis Caching** - Reduced database load
- **Gzip Compression** - Smaller response sizes
- **Connection Pooling** - Efficient database connections
- **Static Asset Caching** - Browser caching with immutable headers
- **Alpine Images** - 5x smaller footprint

### 🛠️ Developer Experience
- **Hot Reload** - Instant code updates in development
- **Swagger API Docs** - Interactive API documentation
- **pgAdmin** - PostgreSQL management UI
- **Redis Commander** - Redis management UI
- **Mailhog** - Email testing in development
- **Makefile** - Simple commands for common tasks
- **Winston Logging** - Structured logging with levels

### 💾 Data Management
- **Automated Backups** - Scheduled PostgreSQL backups
- **Backup Retention** - Configurable retention policy
- **Data Persistence** - Named volumes for all data
- **Health Checks** - Automatic container health monitoring

### 🔄 DevOps
- **CI/CD Pipeline** - GitHub Actions workflow
- **Docker Compose Profiles** - Modular service activation
- **Environment Configs** - Separate dev/prod configurations
- **Security Scanning** - Trivy vulnerability scanning

## 📁 Project Structure

```
dockerproject01/
├── 📄 docker-compose.yml          # Basic production setup
├── 📄 docker-compose.prod.yml     # Full production with profiles
├── 📄 docker-compose.dev.yml      # Development with hot reload
├── 📄 Makefile                    # Command shortcuts
├── 📄 .env.example                # Environment template
├── 📄 .env.development            # Dev environment
├── 📄 .env.production             # Prod environment
│
├── 📁 nginx/                      # Reverse Proxy
│   ├── 📄 Dockerfile
│   ├── 📄 nginx.conf              # Basic config
│   ├── 📄 nginx-ssl.conf          # SSL config
│   └── 📁 ssl/                    # SSL certificates
│
├── 📁 frontend/                   # React Frontend
│   ├── 📄 Dockerfile              # Production build
│   ├── 📄 Dockerfile.dev          # Development
│   ├── 📄 nginx.conf
│   ├── 📄 package.json
│   ├── 📁 public/
│   └── 📁 src/
│
├── 📁 backend/                    # Node.js Backend
│   ├── 📄 Dockerfile              # Production build
│   ├── 📄 Dockerfile.dev          # Development
│   ├── 📄 package.json
│   └── 📁 src/
│       ├── 📄 index.js            # Entry point
│       ├── 📁 routes/             # API routes
│       ├── 📁 config/             # Configurations
│       └── 📁 utils/              # Utilities
│
├── 📁 database/                   # PostgreSQL
│   ├── 📁 init/                   # Init scripts
│   └── 📁 config/                 # Custom config
│
├── 📁 redis/                      # Redis Cache
│   └── 📄 redis.conf
│
├── 📁 monitoring/                 # Observability Stack
│   ├── 📁 prometheus/
│   ├── 📁 grafana/
│   ├── 📁 loki/
│   └── 📁 promtail/
│
├── 📁 backup/                     # Backup Service
│   ├── 📄 Dockerfile
│   └── 📄 backup.sh
│
├── 📁 scripts/                    # Utility Scripts
│   └── 📄 generate-ssl.sh
│
└── 📁 .github/                    # CI/CD
    └── 📁 workflows/
        └── 📄 ci-cd.yml
```

## 🚀 Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- Make (optional, for shortcuts)

### Development Mode

```bash
# Start development environment with hot reload
make dev

# Or manually:
cp .env.development .env
docker-compose -f docker-compose.dev.yml up --build
```

**Development URLs:**
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| API Docs | http://localhost:3001/api/docs |
| pgAdmin | http://localhost:5050 |
| Redis Commander | http://localhost:8081 |
| Mailhog | http://localhost:8025 |

### Production Mode

```bash
# Basic production
make up

# With monitoring stack
make monitoring

# With admin tools
make admin

# Full stack (all profiles)
make full
```

**Production URLs:**
| Service | URL |
|---------|-----|
| Application | http://localhost |
| Health Check | http://localhost/health |
| API Docs | http://localhost/api/docs |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |
| pgAdmin | http://localhost:5050 |

## 📋 API Documentation

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check with service status |
| GET | `/ready` | Readiness probe |
| GET | `/live` | Liveness probe |
| GET | `/metrics` | Prometheus metrics |
| GET | `/api` | API info |
| GET | `/api/docs` | Swagger documentation |
| GET | `/api/items` | List items (cached) |
| POST | `/api/items` | Create item |
| GET | `/api/items/:id` | Get item by ID |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |

### Health Response Example

```json
{
  "status": "healthy",
  "timestamp": "2025-12-26T10:30:00.000Z",
  "version": "2.0.0",
  "uptime": 3600,
  "services": {
    "postgres": "connected",
    "redis": "connected"
  }
}
```

## 🔧 Make Commands

```bash
# Development
make dev              # Start dev environment
make dev-detached     # Start dev in background
make dev-down         # Stop dev environment
make dev-logs         # View dev logs

# Production
make build            # Build images
make up               # Start services
make down             # Stop services
make restart          # Restart services
make logs             # View logs
make status           # Show container status

# Profiles
make monitoring       # Start with Prometheus/Grafana
make admin            # Start with pgAdmin/Redis Commander
make full             # Start everything

# Maintenance
make backup           # Run database backup
make restore BACKUP_FILE=xxx.sql.gz
make clean            # Remove everything
make prune            # Docker system prune
make ssl              # Generate SSL certificates

# Quality
make test             # Run tests
make lint             # Run linters

# Database
make db-shell         # PostgreSQL shell
make redis-shell      # Redis CLI

# Health
make health           # Check service health
```

## 🌐 Docker Compose Profiles

| Profile | Services | Use Case |
|---------|----------|----------|
| (default) | nginx, frontend, backend, postgres, redis | Core application |
| `admin` | + pgAdmin, Redis Commander | Database management |
| `monitoring` | + Prometheus, Grafana, Loki, Promtail, exporters | Observability |
| `backup` | + Backup service | Database backups |

```bash
# Activate profiles
docker-compose -f docker-compose.prod.yml --profile monitoring up -d
docker-compose -f docker-compose.prod.yml --profile admin --profile monitoring up -d
```

## 🔒 SSL/HTTPS Setup

```bash
# Generate self-signed certificates (development)
make ssl

# For production, use Let's Encrypt:
# 1. Point your domain to the server
# 2. Install certbot
# 3. Run: certbot certonly --standalone -d yourdomain.com
# 4. Copy certificates to nginx/ssl/
```

## 📊 Monitoring Dashboard

Access Grafana at http://localhost:3001

**Default credentials:** admin / admin

Pre-configured dashboards include:
- System Overview (CPU, Memory, Disk)
- Container Metrics
- API Performance (request rate, latency, errors)
- Database Metrics
- Redis Metrics

## 💾 Backup & Restore

```bash
# Create backup
make backup

# List backups
ls -la backup/data/

# Restore from backup
make restore BACKUP_FILE=backup_20251226_120000.sql.gz
```

## 🚢 CI/CD Pipeline

The GitHub Actions workflow includes:

1. **Test** - Linting and unit tests
2. **Build** - Multi-platform Docker images
3. **Security** - Trivy vulnerability scanning
4. **Deploy Staging** - Auto-deploy on develop branch
5. **Deploy Production** - Deploy on release

## 📈 Scaling

```bash
# Scale backend service
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

> Update nginx upstream configuration for load balancing when scaling.

## 🐛 Troubleshooting

### View logs
```bash
docker-compose logs -f backend
docker-compose logs -f --tail=100 nginx
```

### Access container shell
```bash
docker-compose exec backend sh
docker-compose exec postgres psql -U appuser -d appdb
docker-compose exec redis redis-cli
```

### Reset everything
```bash
make clean
make build
make up
```

### Check container health
```bash
docker-compose ps
docker inspect --format='{{.State.Health.Status}}' backend-api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `make test`
5. Submit a pull request

## 📄 License

MIT License - Feel free to use this for your projects!

---
App:- multi-service-docker-app-xorism.up.railway.app

Built with Docker, Node.js, React, PostgreSQL, Redis, and more.
