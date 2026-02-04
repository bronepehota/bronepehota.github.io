#!/bin/bash
# Generate PWA icons from SVG source

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ICONS_DIR="$PROJECT_DIR/public/icons"
SVG_SOURCE="$ICONS_DIR/icon.svg"

# Check if ImageMagick convert command is available
if command -v convert &> /dev/null; then
    CONVERT="convert"
elif command -v magick &> /dev/null; then
    CONVERT="magick"
else
    echo "Error: ImageMagick is not installed. Please install it first:"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    exit 1
fi

# Standard sizes
SIZES=(72 96 128 144 152 192 384 512)

echo "Generating PWA icons..."

for size in "${SIZES[@]}"; do
    echo "Creating icon-${size}x${size}.png..."
    $CONVERT -background none -density 300 \
        "$SVG_SOURCE" \
        -resize ${size}x${size} \
        "$ICONS_DIR/icon-${size}x${size}.png"
done

# Maskable variants (with safe area for adaptive icons)
echo "Creating maskable icons..."
for size in 192 512; do
    echo "Creating icon-maskable-${size}x${size}.png..."
    $CONVERT -background none -density 300 \
        "$SVG_SOURCE" \
        -resize ${size}x${size} \
        "$ICONS_DIR/icon-maskable-${size}x${size}.png"
done

# Also create a favicon.ico
echo "Creating favicon.ico..."
$CONVERT -background none \
    "$SVG_SOURCE" \
    -resize 32x32 \
    "$PROJECT_DIR/public/favicon.ico"

echo "Done! Icons generated in $ICONS_DIR"
