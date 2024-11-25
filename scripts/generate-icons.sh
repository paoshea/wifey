#!/bin/bash

# Ensure the public directory exists
mkdir -p public/icons

# Source SVG file
SOURCE_SVG="public/branding/logo.svg"

# Generate various sizes of PNG icons
for size in 16 32 48 64 96 128 192 256 384 512; do
  convert "$SOURCE_SVG" -resize ${size}x${size} "public/icons/icon-${size}x${size}.png"
done

# Generate favicon.ico (multi-size)
convert "$SOURCE_SVG" -resize 16x16 "$SOURCE_SVG" -resize 32x32 "$SOURCE_SVG" -resize 48x48 public/favicon.ico

# Generate Apple Touch Icon
convert "$SOURCE_SVG" -resize 180x180 public/apple-touch-icon.png

# Generate Android maskable icon
convert "$SOURCE_SVG" -resize 512x512 -gravity center -extent 512x512 public/maskable-icon.png

# Generate manifest.json
cat > public/manifest.json << EOL
{
  "name": "Wifey",
  "short_name": "Wifey",
  "description": "Find WiFi and cellular coverage anywhere",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563EB",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/maskable-icon.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
EOL

echo "Icon generation complete!"
