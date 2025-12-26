# ===========================================
# Stage 1: Build Stage
# ===========================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ===========================================
# Stage 2: Production Stage with Nginx
# ===========================================
FROM nginx:alpine AS production

# Add labels
LABEL maintainer="DevOps Team"
LABEL version="1.0"
LABEL description="Optimized React Frontend with Nginx"

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Add non-root user
RUN addgroup -g 1001 -S nginx-group && \
    chown -R nginx:nginx-group /usr/share/nginx/html && \
    chown -R nginx:nginx-group /var/cache/nginx && \
    chown -R nginx:nginx-group /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx-group /var/run/nginx.pid

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
