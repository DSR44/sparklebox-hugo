#!/bin/bash
# Vercel build script for Hugo with git submodules

echo "🔧 Initializing git submodules..."
git submodule update --init --recursive

echo "📦 Building Hugo site..."
hugo --minify

echo "✅ Build complete!"

