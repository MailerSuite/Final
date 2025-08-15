#!/bin/bash

# Script to help update page styling to use StandardPageWrapper
# This script identifies pages that might need updating and provides guidance

echo "🔍 Analyzing pages for styling updates..."
echo "=========================================="

# Find pages that might need updating
echo "📁 Pages that might need StandardPageWrapper updates:"
echo ""

# Search for pages with common background patterns
echo "1. Pages with 'bg-gradient-dark' or similar backgrounds:"
grep -r "bg-gradient-dark\|bg-gradient-to-b\|bg-background" frontend/src/pages/ --include="*.tsx" | head -10
echo ""

# Search for pages with custom header structures
echo "2. Pages with custom header structures:"
grep -r "px-6 py-4 border-b border-border bg-background" frontend/src/pages/ --include="*.tsx" | head -10
echo ""

# Search for pages that might be standalone (not using PageShell)
echo "3. Pages that might be standalone:"
find frontend/src/pages -name "*.tsx" -exec grep -l "return (" {} \; | head -10
echo ""

echo "📋 Manual Update Checklist:"
echo "=========================="
echo "1. Add import: import StandardPageWrapper from '@/components/layout/StandardPageWrapper'"
echo "2. Replace main div with: <StandardPageWrapper title=\"Page Title\" subtitle=\"Optional subtitle\">"
echo "3. Add closing tag: </StandardPageWrapper>"
echo "4. Remove custom header if StandardPageWrapper provides one"
echo "5. Update background classes to use StandardPageWrapper's bg-gradient-dark"
echo ""

echo "🎯 Priority Pages to Update:"
echo "============================"
echo "• frontend/src/pages/landing/index.tsx ✅ (Updated)"
echo "• frontend/src/pages/login/page.tsx ✅ (Updated)"
echo "• frontend/src/pages/ai-tutor/SpamTutorPage.tsx ✅ (Updated)"
echo "• frontend/src/pages/pools/SmtpPoolPage.tsx ✅ (Updated)"
echo "• frontend/src/pages/pools/ProxyPoolPage.tsx ✅ (Updated)"
echo "• frontend/src/pages/finalui2/pages/ThreadPoolManagementPage.tsx ✅ (Updated)"
echo ""

echo "🚀 Next steps:"
echo "1. Test the updated pages to ensure they render correctly"
echo "2. Update remaining pages following the same pattern"
echo "3. Consider creating additional wrapper variants if needed"
echo "4. Update documentation to reflect the new styling standards"
