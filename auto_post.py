#!/usr/bin/env python3
"""
Simple script to auto-publish blog posts to Hugo
Your AI agent can call this to create posts automatically!
"""

import os
from datetime import datetime
import subprocess
import sys

def create_post(title, content, categories=None, tags=None, author="Elle Vida"):
    """
    Create a new Hugo blog post
    
    Args:
        title: Post title
        content: Post content (markdown format)
        categories: List of categories
        tags: List of tags
        author: Author name
    """
    
    # Generate filename from title
    date_str = datetime.now().strftime("%Y-%m-%d")
    slug = title.lower().replace(" ", "-").replace("'", "").replace('"', '')
    slug = ''.join(c for c in slug if c.isalnum() or c == '-')
    filename = f"{date_str}-{slug}.md"
    
    # Create front matter
    front_matter = "---\n"
    front_matter += f'title: "{title}"\n'
    front_matter += f'date: {datetime.now().strftime("%Y-%m-%dT%H:%M:%S%z")}\n'
    front_matter += f'author: "{author}"\n'
    
    if categories:
        front_matter += "categories:\n"
        for cat in categories:
            front_matter += f'  - "{cat}"\n'
    
    if tags:
        front_matter += "tags:\n"
        for tag in tags:
            front_matter += f'  - "{tag}"\n'
    
    front_matter += "draft: false\n"
    front_matter += "---\n\n"
    
    # Combine front matter and content
    full_content = front_matter + content
    
    # Write to file
    posts_dir = os.path.join(os.path.dirname(__file__), "content", "posts")
    filepath = os.path.join(posts_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(full_content)
    
    print(f"✅ Created post: {filename}")
    return filepath


def build_and_deploy(auto_deploy=False):
    """
    Build the Hugo site and optionally deploy
    
    Args:
        auto_deploy: If True, commits and pushes to Git (requires Git setup)
    """
    
    # Change to hugo_site directory
    os.chdir(os.path.dirname(__file__))
    
    # Build site
    print("🔨 Building site...")
    result = subprocess.run(['hugo', '--gc', '--minify'], capture_output=True)
    
    if result.returncode != 0:
        print("❌ Build failed!")
        print(result.stderr.decode())
        return False
    
    print("✅ Site built successfully!")
    
    # Auto-deploy via Git (if enabled)
    if auto_deploy:
        print("🚀 Deploying to Git...")
        subprocess.run(['git', 'add', '.'])
        subprocess.run(['git', 'commit', '-m', 'Auto-post from AI agent'])
        subprocess.run(['git', 'push'])
        print("✅ Deployed!")
    else:
        print("📦 Upload the 'public' folder to Netlify to publish")
    
    return True


# Example usage
if __name__ == "__main__":
    # Example: Create a post from your AI agent
    
    title = "My AI-Generated Post"
    content = """
This post was automatically created by my AI agent!

## How Cool Is This?

No WordPress API needed. Just pure simplicity.

- Easy to automate
- Fast to deploy
- Complete control

**Welcome to the future!** ✨
"""
    
    categories = ["AI", "Automation"]
    tags = ["future", "technology", "freedom"]
    
    # Create the post
    create_post(title, content, categories, tags)
    
    # Build the site
    build_and_deploy(auto_deploy=False)  # Set to True if you have Git set up
    
    print("\n🎉 Done! Your AI agent just published a post!")

