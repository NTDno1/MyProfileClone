#!/bin/bash

echo "=== NGINX CONFIGURATION CHECKER ==="
echo ""

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx is not installed"
    exit 1
fi

echo "✅ Nginx is installed"
echo ""

# Check nginx status
echo "=== NGINX STATUS ==="
sudo systemctl status nginx --no-pager | head -10
echo ""

# Check nginx version
echo "=== NGINX VERSION ==="
nginx -v
echo ""

# List all enabled sites
echo "=== ENABLED SITES ==="
ls -la /etc/nginx/sites-enabled/
echo ""

# List all available sites
echo "=== AVAILABLE SITES ==="
ls -la /etc/nginx/sites-available/
echo ""

# Show main nginx config
echo "=== MAIN NGINX CONFIG ==="
echo "File: /etc/nginx/nginx.conf"
cat /etc/nginx/nginx.conf
echo ""

# Show all enabled site configs
echo "=== ENABLED SITE CONFIGURATIONS ==="
for file in /etc/nginx/sites-enabled/*; do
    if [ -f "$file" ]; then
        echo "--- File: $file ---"
        cat "$file"
        echo ""
    fi
done

# Check what's listening on port 80
echo "=== PROCESSES LISTENING ON PORT 80 ==="
sudo lsof -i :80 || sudo netstat -tulpn | grep :80 || sudo ss -tulpn | grep :80
echo ""

# Test nginx configuration
echo "=== NGINX CONFIGURATION TEST ==="
sudo nginx -t
echo ""

