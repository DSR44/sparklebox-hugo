#!/bin/bash

# Simple deployment script for Sparklebox Hugo site

echo "🚀 Building Sparklebox site..."
hugo --gc --minify

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📁 Your site is ready in the 'public/' folder"
    echo ""
    echo "Next steps:"
    echo "  • Upload 'public/' folder to your web host, OR"
    echo "  • Deploy to Netlify/Vercel/Cloudflare Pages"
    echo ""
    echo "To test locally first:"
    echo "  hugo server"
else
    echo "❌ Build failed. Check the errors above."
    exit 1
fi

