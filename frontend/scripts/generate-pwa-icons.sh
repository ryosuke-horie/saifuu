#!/bin/bash

# PWA Icon Generation Script for Saifuu Finance App
# This script generates all required PWA icons from the existing SVG sources

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Saifuu PWA Icon Generation Script${NC}"
echo -e "${BLUE}====================================${NC}"

# Check if we're in the right directory
if [ ! -f "public/favicon.svg" ] || [ ! -f "public/icon.svg" ]; then
    echo -e "${RED}❌ Error: Cannot find favicon.svg or icon.svg in public directory${NC}"
    echo -e "${YELLOW}💡 Please run this script from the project root directory${NC}"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo -e "${RED}❌ ImageMagick is not installed${NC}"
    echo -e "${YELLOW}💡 Please install ImageMagick:${NC}"
    echo -e "${YELLOW}   - macOS: brew install imagemagick${NC}"
    echo -e "${YELLOW}   - Ubuntu: sudo apt-get install imagemagick${NC}"
    echo -e "${YELLOW}   - Windows: Download from https://imagemagick.org/script/download.php${NC}"
    echo ""
    echo -e "${BLUE}📝 Alternative: Use online tools like https://realfavicongenerator.net/${NC}"
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p public/icons

echo -e "${GREEN}📱 Generating PWA icons...${NC}"

# Generate small icons (16x16 to 96x96) from simplified icon.svg
echo -e "${BLUE}🔸 Generating small icons (16x16 to 96x96)...${NC}"
convert public/icon.svg -resize 16x16 public/icon-16x16.png
convert public/icon.svg -resize 32x32 public/icon-32x32.png
convert public/icon.svg -resize 48x48 public/icon-48x48.png
convert public/icon.svg -resize 72x72 public/icon-72x72.png
convert public/icon.svg -resize 96x96 public/icon-96x96.png

# Generate medium to large icons (144x144 to 512x512) from detailed favicon.svg
echo -e "${BLUE}🔸 Generating medium to large icons (144x144 to 512x512)...${NC}"
convert public/favicon.svg -resize 144x144 public/icon-144x144.png
convert public/favicon.svg -resize 192x192 public/icon-192x192.png
convert public/favicon.svg -resize 512x512 public/icon-512x512.png

# Generate Apple Touch Icon (180x180)
echo -e "${BLUE}🍎 Generating Apple Touch Icon...${NC}"
convert public/favicon.svg -resize 180x180 public/apple-touch-icon.png

# Generate maskable icons with safe zone
echo -e "${BLUE}🎭 Generating maskable icons...${NC}"
convert public/icon.svg -resize 154x154 -gravity center -background transparent -extent 192x192 public/icon-maskable-192x192.png
convert public/icon.svg -resize 410x410 -gravity center -background transparent -extent 512x512 public/icon-maskable-512x512.png

# Generate Microsoft tile icons
echo -e "${BLUE}🪟 Generating Microsoft tile icons...${NC}"
convert public/icon.svg -resize 70x70 public/mstile-70x70.png
convert public/icon.svg -resize 150x150 public/mstile-150x150.png
convert public/icon.svg -resize 310x310 public/mstile-310x310.png
# Wide tile with background
convert public/icon.svg -resize 248x248 -gravity center -background "#2563eb" -extent 310x150 public/mstile-310x150.png

# Generate Apple startup image
echo -e "${BLUE}🚀 Generating Apple startup image...${NC}"
convert public/favicon.svg -resize 200x200 -gravity center -background "#ffffff" -extent 320x568 public/apple-startup-image.png

# Generate base Open Graph image (text overlay needed separately)
echo -e "${BLUE}📱 Generating Open Graph image base...${NC}"
convert public/favicon.svg -resize 400x400 -gravity northwest -background "#ffffff" -extent 1200x630 public/og-image-base.png

echo -e "${GREEN}✅ Icon generation complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Generated files:${NC}"
echo -e "   • icon-16x16.png (16x16)"
echo -e "   • icon-32x32.png (32x32)"
echo -e "   • icon-48x48.png (48x48)"
echo -e "   • icon-72x72.png (72x72)"
echo -e "   • icon-96x96.png (96x96)"
echo -e "   • icon-144x144.png (144x144)"
echo -e "   • icon-192x192.png (192x192)"
echo -e "   • icon-512x512.png (512x512)"
echo -e "   • icon-maskable-192x192.png (192x192, maskable)"
echo -e "   • icon-maskable-512x512.png (512x512, maskable)"
echo -e "   • apple-touch-icon.png (180x180)"
echo -e "   • apple-startup-image.png (320x568)"
echo -e "   • mstile-70x70.png (70x70)"
echo -e "   • mstile-150x150.png (150x150)"
echo -e "   • mstile-310x150.png (310x150)"
echo -e "   • mstile-310x310.png (310x310)"
echo -e "   • og-image-base.png (1200x630, needs text overlay)"

echo ""
echo -e "${BLUE}🔍 Next steps:${NC}"
echo -e "   1. Run the PWA validation script: ./scripts/validate-pwa.sh"
echo -e "   2. Test PWA installation on mobile devices"
echo -e "   3. Add text overlay to og-image-base.png for social sharing"
echo -e "   4. Optimize PNG files if needed: pngquant public/icon-*.png"

echo ""
echo -e "${GREEN}🎉 PWA icons are ready! Your Saifuu app can now be installed as a PWA.${NC}"