#!/bin/bash

# Saifuu Favicon Generation Script
# This script generates all required favicon files from the base SVG icon

# Color constants
PRIMARY_COLOR="#2563eb"
SECONDARY_COLOR="#1e40af"

# Directories
PUBLIC_DIR="/Users/r-horie/private/saifuu/saifuu-main/frontend/public"
ICON_SOURCE="$PUBLIC_DIR/favicon.svg"

echo "🎯 Saifuu Favicon Generation Script"
echo "===================================="

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick is not installed. Please install it first:"
    echo "   brew install imagemagick"
    echo ""
    echo "🌐 Alternative: Use online tools instead"
    echo "   1. Visit https://realfavicongenerator.net/"
    echo "   2. Upload $ICON_SOURCE"
    echo "   3. Download and extract to $PUBLIC_DIR"
    exit 1
fi

# Check if source icon exists
if [ ! -f "$ICON_SOURCE" ]; then
    echo "❌ Source icon not found: $ICON_SOURCE"
    exit 1
fi

cd "$PUBLIC_DIR"

echo "📁 Working directory: $PUBLIC_DIR"
echo "🎨 Source icon: $ICON_SOURCE"
echo ""

# Generate standard favicon sizes
echo "🔨 Generating standard favicon sizes..."
convert "$ICON_SOURCE" -resize 16x16 icon-16x16.png
convert "$ICON_SOURCE" -resize 32x32 icon-32x32.png
convert "$ICON_SOURCE" -resize 48x48 icon-48x48.png
convert "$ICON_SOURCE" -resize 192x192 icon-192x192.png
convert "$ICON_SOURCE" -resize 512x512 icon-512x512.png

# Generate Apple Touch Icon
echo "🍎 Generating Apple Touch Icon..."
convert "$ICON_SOURCE" -resize 180x180 apple-touch-icon.png

# Generate Apple Startup Image (basic version)
echo "🍎 Generating Apple Startup Image..."
convert "$ICON_SOURCE" -resize 320x568 -gravity center -background white -extent 320x568 apple-startup-image.png

# Generate Microsoft Tiles
echo "🪟 Generating Microsoft Tiles..."
convert "$ICON_SOURCE" -resize 70x70 mstile-70x70.png
convert "$ICON_SOURCE" -resize 150x150 mstile-150x150.png
convert "$ICON_SOURCE" -resize 310x150 -gravity center -background "$PRIMARY_COLOR" -extent 310x150 mstile-310x150.png
convert "$ICON_SOURCE" -resize 310x310 mstile-310x310.png

# Generate basic maskable icons (these need manual adjustment for safe zone)
echo "🎭 Generating basic maskable icons..."
echo "⚠️  Note: Maskable icons need manual adjustment for 20% safe zone"
convert "$ICON_SOURCE" -resize 192x192 -gravity center -background "$PRIMARY_COLOR" -extent 192x192 icon-maskable-192x192.png
convert "$ICON_SOURCE" -resize 512x512 -gravity center -background "$PRIMARY_COLOR" -extent 512x512 icon-maskable-512x512.png

# Generate Open Graph image
echo "📱 Generating Open Graph image..."
convert -size 1200x630 xc:white \
    \( "$ICON_SOURCE" -resize 200x200 \) -gravity west -geometry +100+0 -composite \
    -font "Arial" -pointsize 48 -fill "$PRIMARY_COLOR" -gravity center \
    -annotate +150+0 "Saifuu\n家計管理アプリ" \
    og-image.png

echo ""
echo "✅ Favicon generation complete!"
echo ""
echo "📋 Generated files:"
echo "  ✅ icon-16x16.png"
echo "  ✅ icon-32x32.png"  
echo "  ✅ icon-48x48.png"
echo "  ✅ icon-192x192.png"
echo "  ✅ icon-512x512.png"
echo "  ✅ apple-touch-icon.png"
echo "  ✅ apple-startup-image.png"
echo "  ✅ mstile-70x70.png"
echo "  ✅ mstile-150x150.png"
echo "  ✅ mstile-310x150.png"
echo "  ✅ mstile-310x310.png"
echo "  ✅ icon-maskable-192x192.png"
echo "  ✅ icon-maskable-512x512.png"
echo "  ✅ og-image.png"
echo ""
echo "⚠️  Manual steps required:"
echo "  1. Optimize maskable icons for 20% safe zone at https://maskable.app/"
echo "  2. Test PWA functionality on mobile devices"
echo "  3. Verify all icons display correctly across platforms"
echo ""
echo "🔍 Test your favicons at:"
echo "  https://realfavicongenerator.net/favicon_checker"
echo ""
echo "🎉 All done!"