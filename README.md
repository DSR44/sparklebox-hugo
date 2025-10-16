# Sparklebox Hugo Site

Your WordPress site has been successfully migrated to Hugo!

## Next Steps

### 1. Install Hugo
```bash
# On macOS
brew install hugo

# On Linux
sudo apt-get install hugo

# On Windows
choco install hugo-extended
```

### 2. Choose and Install a Theme
Hugo needs a theme to display your site. Some popular options:

- **PaperMod** - Clean, fast, minimal: https://github.com/adityatelange/hugo-PaperMod
- **Blowfish** - Modern, feature-rich: https://github.com/nunocoracao/blowfish
- **Congo** - Beautiful, powerful: https://github.com/jpanther/congo
- **Anatole** - Elegant, simple: https://github.com/lxndrblz/anatole

To install a theme (example with PaperMod):
```bash
cd hugo_site
git init
git submodule add --depth=1 https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
```

Then update `config.toml` to use your theme:
```toml
theme = "PaperMod"
```

### 3. Test Your Site Locally
```bash
cd hugo_site
hugo server -D
```

Visit http://localhost:1313 to see your site!

### 4. Build Your Site
```bash
hugo
```

This creates a `public/` folder with your static site.

### 5. Deploy Your Site
Hugo sites are just static HTML/CSS/JS. You can host them anywhere:

- **Netlify** (Free, easy): Drop the `public/` folder or connect to Git
- **Vercel** (Free, fast): Similar to Netlify
- **GitHub Pages** (Free): Host directly from a GitHub repo
- **Cloudflare Pages** (Free, very fast): Great CDN
- **Your own server**: Just upload the `public/` folder

No WordPress, no PHP, no database. Just fast, static files!

## Directory Structure

```
hugo_site/
├── config.toml          # Site configuration
├── content/             # Your content
│   ├── posts/          # Blog posts
│   └── pages/          # Pages
├── static/             # Static files (images, etc.)
├── themes/             # Hugo themes (add your chosen theme here)
└── public/             # Generated site (after running 'hugo')
```

## Customization

- Edit `config.toml` for site-wide settings
- Add custom CSS in `static/css/`
- Add images to `static/images/`
- Modify content in `content/`

## Need Help?

- Hugo Documentation: https://gohugo.io/documentation/
- Hugo Forums: https://discourse.gohugo.io/
- Hugo Themes: https://themes.gohugo.io/

Enjoy your freedom from WordPress! 🎉
# Force deployment Thu Oct 16 10:23:31 EEST 2025
