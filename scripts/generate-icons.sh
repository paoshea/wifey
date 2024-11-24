#!/bin/bash

# Required sizes for various platforms
SIZES=(16 32 48 72 96 128 144 152 192 384 512)

# Source SVG file
SOURCE="public/branding/app-icon.svg"

# Create necessary directories
mkdir -p public/branding/icons

# Generate PNG files for each size
for size in "${SIZES[@]}"; do
  # Using ImageMagick to convert SVG to PNG
  convert -background none -size ${size}x${size} "$SOURCE" "public/branding/app-icon-${size}.png"
done

# Generate favicon.ico (multi-size)
convert "public/branding/app-icon-16.png" "public/branding/app-icon-32.png" "public/branding/app-icon-48.png" "public/favicon.ico"

# Generate Apple Touch Icons
convert -background none -size 180x180 "$SOURCE" "public/apple-touch-icon.png"

# Generate shortcut icons
convert -background none -size 192x192 "public/branding/icons/wifi.svg" "public/branding/wifi-shortcut.png"
convert -background none -size 192x192 "public/branding/icons/coverage.svg" "public/branding/coverage-shortcut.png"

echo "Icon generation complete!"
