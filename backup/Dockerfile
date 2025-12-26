FROM postgres:16-alpine

LABEL maintainer="DevOps Team"
LABEL description="PostgreSQL Backup Container"

# Install required tools
RUN apk add --no-cache bash gzip

# Copy backup script
COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# Create backup directory
RUN mkdir -p /backups

# Set working directory
WORKDIR /backups

# Default command
CMD ["/usr/local/bin/backup.sh"]
