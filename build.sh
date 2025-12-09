#!/bin/bash
# Vercel build script for Hugo

set -e  # Exit on any error

echo "📦 Building Hugo site..."
hugo --minify --gc

echo "✅ Build complete!"
