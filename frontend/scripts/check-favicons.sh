#!/bin/bash

# Saifuu Favicon Verification Script
# This script checks if all required favicon files exist

PUBLIC_DIR="/Users/r-horie/private/saifuu/saifuu-main/frontend/public"

echo "🔍 Saifuu Favicon Verification"
echo "============================="

cd "$PUBLIC_DIR"

# Define required files
declare -a REQUIRED_FILES=(
    "favicon.ico"
    "favicon.svg"
    "icon.svg"
    "icon-16x16.png"
    "icon-32x32.png"
    "icon-48x48.png"
    "icon-192x192.png"
    "icon-512x512.png"
    "apple-touch-icon.png"
    "apple-startup-image.png"
    "mstile-70x70.png"
    "mstile-150x150.png"
    "mstile-310x150.png"
    "mstile-310x310.png"
    "icon-maskable-192x192.png"
    "icon-maskable-512x512.png"
    "og-image.png"
    "manifest.json"
    "browserconfig.xml"
    "robots.txt"
    "sitemap.xml"
)

# Check each file
missing_files=()
existing_files=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
        existing_files+=("$file")
    else
        echo "❌ $file"
        missing_files+=("$file")
    fi
done

echo ""
echo "📊 Summary:"
echo "  ✅ Existing files: ${#existing_files[@]}"
echo "  ❌ Missing files: ${#missing_files[@]}"

if [ ${#missing_files[@]} -gt 0 ]; then
    echo ""
    echo "🚨 Missing files need to be generated:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    echo ""
    echo "💡 Run the generation script:"
    echo "  ./scripts/generate-favicons.sh"
    echo ""
    echo "🌐 Or use online tools:"
    echo "  https://realfavicongenerator.net/"
else
    echo ""
    echo "🎉 All favicon files are present!"
    echo ""
    echo "🔍 Next steps:"
    echo "  1. Test favicons at https://realfavicongenerator.net/favicon_checker"
    echo "  2. Test PWA functionality on mobile devices"
    echo "  3. Verify icons display correctly in browsers"
fi

echo ""
echo "📁 Working directory: $PUBLIC_DIR"