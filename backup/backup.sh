#!/bin/bash
# ===========================================
# PostgreSQL Backup Script
# Automated backups with retention policy
# ===========================================

set -e

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=${RETENTION_DAYS:-7}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql.gz"

# Database connection
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-appdb}
DB_USER=${DB_USER:-appuser}

echo "=========================================="
echo "PostgreSQL Backup - $(date)"
echo "=========================================="

# Create backup directory if not exists
mkdir -p ${BACKUP_DIR}

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until PGPASSWORD=${PGPASSWORD} pg_isready -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER}; do
    sleep 2
done

echo "Creating backup: ${BACKUP_FILE}"

# Create backup with compression
PGPASSWORD=${PGPASSWORD} pg_dump \
    -h ${DB_HOST} \
    -p ${DB_PORT} \
    -U ${DB_USER} \
    -d ${DB_NAME} \
    --format=plain \
    --no-owner \
    --no-acl \
    | gzip > ${BACKUP_DIR}/${BACKUP_FILE}

# Calculate backup size
BACKUP_SIZE=$(ls -lh ${BACKUP_DIR}/${BACKUP_FILE} | awk '{print $5}')
echo "Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Remove old backups
echo "Removing backups older than ${RETENTION_DAYS} days..."
find ${BACKUP_DIR} -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# List remaining backups
echo ""
echo "Current backups:"
ls -lh ${BACKUP_DIR}/backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo ""
echo "Backup completed successfully!"
echo "=========================================="
