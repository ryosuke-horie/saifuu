#!/bin/bash

# PWA Validation Script for Saifuu Finance App
# This script validates PWA compliance and identifies missing components

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Saifuu PWA Validation Script${NC}"
echo -e "${BLUE}==============================${NC}"

# Initialize counters
passed=0
failed=0
warnings=0

# Function to check if file exists
check_file() {
    local file="$1"
    local description="$2"
    local required="$3"
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $description${NC}"
        ((passed++))
        return 0
    else
        if [ "$required" = "required" ]; then
            echo -e "${RED}❌ $description (MISSING)${NC}"
            ((failed++))
        else
            echo -e "${YELLOW}⚠️  $description (MISSING - OPTIONAL)${NC}"
            ((warnings++))
        fi
        return 1
    fi
}

# Function to check JSON validity
check_json() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        if python3 -m json.tool "$file" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $description (Valid JSON)${NC}"
            ((passed++))
            return 0
        else
            echo -e "${RED}❌ $description (Invalid JSON)${NC}"
            ((failed++))
            return 1
        fi
    else
        echo -e "${RED}❌ $description (MISSING)${NC}"
        ((failed++))
        return 1
    fi
}

echo -e "${CYAN}📋 1. Core PWA Files${NC}"
echo -e "${CYAN}===================${NC}"

check_json "public/manifest.json" "Web App Manifest"
check_file "public/sw.js" "Service Worker" "required"
check_file "src/components/pwa/ServiceWorkerRegistration.tsx" "Service Worker Registration Component" "required"
check_file "src/app/offline/page.tsx" "Offline Fallback Page" "required"

echo ""
echo -e "${CYAN}📱 2. Essential Icons (PWA Installation Required)${NC}"
echo -e "${CYAN}=================================================${NC}"

check_file "public/icon-192x192.png" "PWA Icon 192x192" "required"
check_file "public/icon-512x512.png" "PWA Icon 512x512" "required"
check_file "public/icon-maskable-192x192.png" "Maskable Icon 192x192" "required"
check_file "public/icon-maskable-512x512.png" "Maskable Icon 512x512" "required"
check_file "public/apple-touch-icon.png" "Apple Touch Icon" "required"

echo ""
echo -e "${CYAN}🔍 3. Additional Icons (Enhanced Experience)${NC}"
echo -e "${CYAN}============================================${NC}"

check_file "public/icon-16x16.png" "Favicon 16x16"
check_file "public/icon-32x32.png" "Favicon 32x32"
check_file "public/icon-48x48.png" "Favicon 48x48"
check_file "public/icon-72x72.png" "PWA Icon 72x72"
check_file "public/icon-96x96.png" "PWA Icon 96x96"
check_file "public/icon-144x144.png" "PWA Icon 144x144"

echo ""
echo -e "${CYAN}🪟 4. Platform-Specific Icons${NC}"
echo -e "${CYAN}=============================${NC}"

check_file "public/mstile-70x70.png" "Microsoft Tile 70x70"
check_file "public/mstile-150x150.png" "Microsoft Tile 150x150"
check_file "public/mstile-310x150.png" "Microsoft Tile 310x150"
check_file "public/mstile-310x310.png" "Microsoft Tile 310x310"
check_file "public/apple-startup-image.png" "Apple Startup Image"

echo ""
echo -e "${CYAN}📷 5. Social Media & Branding${NC}"
echo -e "${CYAN}=============================${NC}"

check_file "public/og-image.png" "Open Graph Image"
check_file "public/favicon.ico" "Favicon ICO" "required"
check_file "public/favicon.svg" "Favicon SVG" "required"

echo ""
echo -e "${CYAN}⚙️  6. Configuration Files${NC}"
echo -e "${CYAN}=========================${NC}"

check_file "public/browserconfig.xml" "Browser Configuration"
check_file "public/robots.txt" "Robots.txt"
check_file "public/_headers" "Cloudflare Headers"

echo ""
echo -e "${CYAN}🔒 7. Security & Best Practices${NC}"
echo -e "${CYAN}===============================${NC}"

# Check if HTTPS is configured (check Next.js config)
if [ -f "next.config.ts" ]; then
    echo -e "${GREEN}✅ Next.js Configuration Present${NC}"
    ((passed++))
else
    echo -e "${YELLOW}⚠️  Next.js Configuration Missing${NC}"
    ((warnings++))
fi

# Check if service worker has proper caching strategies
if [ -f "public/sw.js" ]; then
    if grep -q "API_SENSITIVE" public/sw.js; then
        echo -e "${GREEN}✅ Sensitive Data Protection (Service Worker)${NC}"
        ((passed++))
    else
        echo -e "${YELLOW}⚠️  Service Worker Missing Sensitive Data Protection${NC}"
        ((warnings++))
    fi
    
    if grep -q "cache-first\|network-first" public/sw.js; then
        echo -e "${GREEN}✅ Cache Strategies Implemented${NC}"
        ((passed++))
    else
        echo -e "${YELLOW}⚠️  Basic Cache Strategies Missing${NC}"
        ((warnings++))
    fi
fi

echo ""
echo -e "${CYAN}🧪 8. Code Quality & Testing${NC}"
echo -e "${CYAN}============================${NC}"

# Check for PWA tests
check_file "src/components/pwa/ServiceWorkerRegistration.test.tsx" "PWA Component Tests"
check_file "src/lib/pwa.test.ts" "PWA Utilities Tests"

# Check TypeScript configuration
check_file "tsconfig.json" "TypeScript Configuration"

echo ""
echo -e "${CYAN}📊 Validation Summary${NC}"
echo -e "${CYAN}===================${NC}"

total=$((passed + failed + warnings))
success_rate=$((passed * 100 / total))

echo -e "${GREEN}✅ Passed: $passed${NC}"
echo -e "${RED}❌ Failed: $failed${NC}"
echo -e "${YELLOW}⚠️  Warnings: $warnings${NC}"
echo -e "${BLUE}📈 Success Rate: $success_rate%${NC}"

echo ""

# Determine overall status
if [ $failed -eq 0 ]; then
    if [ $warnings -eq 0 ]; then
        echo -e "${GREEN}🎉 EXCELLENT! Your PWA is fully compliant and ready for production.${NC}"
        exit 0
    else
        echo -e "${YELLOW}✨ GOOD! Your PWA is functional but could be enhanced.${NC}"
        echo -e "${YELLOW}💡 Consider addressing warnings for optimal user experience.${NC}"
        exit 0
    fi
else
    echo -e "${RED}🚨 ISSUES FOUND! Your PWA has critical problems that need fixing.${NC}"
    echo ""
    echo -e "${BLUE}🔧 Quick Fix Options:${NC}"
    echo -e "   1. Run: ${CYAN}./scripts/generate-pwa-icons.sh${NC} to create missing icons"
    echo -e "   2. Check manifest.json for proper configuration"
    echo -e "   3. Ensure service worker is properly implemented"
    echo ""
    echo -e "${BLUE}📚 For detailed analysis, see: PWA_VALIDATION_REPORT.md${NC}"
    exit 1
fi