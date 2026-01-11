#!/bin/bash

echo "=== NGINX POFOLOGY SETUP SCRIPT ==="
echo ""

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx is not installed. Installing..."
    sudo apt update
    sudo apt install -y nginx
fi

echo "✅ Nginx is installed"
echo ""

# Show current enabled sites
echo "=== CURRENT ENABLED SITES ==="
ls -la /etc/nginx/sites-enabled/
echo ""

# Show current sites content
echo "=== CURRENT SITES CONFIGURATION ==="
for file in /etc/nginx/sites-enabled/*; do
    if [ -f "$file" ]; then
        echo "--- File: $file ---"
        cat "$file"
        echo ""
    fi
done

# Create pofology nginx config
echo "=== CREATING POFOLOGY NGINX CONFIG ==="

# Get server IP or domain
read -p "Enter your domain name (or press Enter to use IP): " DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN="_"
    echo "Using default server (IP-based)"
else
    echo "Using domain: $DOMAIN"
fi

# Create config file
CONFIG_FILE="/etc/nginx/sites-available/pofology"
sudo tee $CONFIG_FILE > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Increase body size for file uploads if needed
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

echo "✅ Created config file: $CONFIG_FILE"
echo ""

# Enable site
echo "=== ENABLING SITE ==="
sudo ln -sf /etc/nginx/sites-available/pofology /etc/nginx/sites-enabled/pofology
echo "✅ Enabled pofology site"
echo ""

# Test nginx configuration
echo "=== TESTING NGINX CONFIGURATION ==="
sudo nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Nginx configuration is valid!"
    echo ""
    read -p "Do you want to reload nginx now? (y/n): " RELOAD
    if [ "$RELOAD" = "y" ] || [ "$RELOAD" = "Y" ]; then
        sudo systemctl reload nginx
        echo "✅ Nginx reloaded successfully"
    else
        echo "⚠️  Remember to reload nginx: sudo systemctl reload nginx"
    fi
else
    echo "❌ Nginx configuration has errors. Please fix them before reloading."
    exit 1
fi

echo ""
echo "=== NEXT STEPS ==="
echo "1. Make sure Docker container is running on port 3000:"
echo "   docker run -d -p 3000:3000 --name pofology ntdno1/pofology:latest"
echo ""
echo "2. Check nginx status:"
echo "   sudo systemctl status nginx"
echo ""
echo "3. Check container logs:"
echo "   docker logs pofology"
echo ""
echo "4. Access your application at:"
if [ "$DOMAIN" != "_" ]; then
    echo "   http://$DOMAIN"
else
    echo "   http://$(curl -s ifconfig.me || hostname -I | awk '{print $1}')"
fi

