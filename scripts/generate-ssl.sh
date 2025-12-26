#!/bin/bash
# ===========================================
# SSL Certificate Generation Script
# For development/testing purposes
# ===========================================

set -e

SSL_DIR="./nginx/ssl"
DAYS_VALID=365

echo "=========================================="
echo "SSL Certificate Generator"
echo "=========================================="

# Create SSL directory
mkdir -p ${SSL_DIR}

# Check if certificates already exist
if [ -f "${SSL_DIR}/cert.pem" ] && [ -f "${SSL_DIR}/key.pem" ]; then
    echo "SSL certificates already exist."
    read -p "Do you want to regenerate them? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing certificates."
        exit 0
    fi
fi

echo "Generating self-signed SSL certificate..."

# Generate private key and certificate
openssl req -x509 -nodes -days ${DAYS_VALID} -newkey rsa:2048 \
    -keyout ${SSL_DIR}/key.pem \
    -out ${SSL_DIR}/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1"

# Set proper permissions
chmod 600 ${SSL_DIR}/key.pem
chmod 644 ${SSL_DIR}/cert.pem

echo ""
echo "SSL certificates generated successfully!"
echo "  Certificate: ${SSL_DIR}/cert.pem"
echo "  Private Key: ${SSL_DIR}/key.pem"
echo "  Valid for: ${DAYS_VALID} days"
echo ""
echo "⚠️  WARNING: These are self-signed certificates for development only."
echo "    For production, use certificates from a trusted CA (e.g., Let's Encrypt)."
echo "=========================================="
