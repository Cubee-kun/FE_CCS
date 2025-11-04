# 🚀 CCS System - Deployment Guide

## Netlify Deployment

### Method 1: Deploy via Netlify CLI

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login ke Netlify**
```bash
netlify login
```

3. **Initialize Netlify**
```bash
netlify init
```

4. **Deploy**
```bash
netlify deploy --prod
```

### Method 2: Deploy via Git (Recommended)

1. **Push ke GitHub/GitLab/Bitbucket**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Connect Repository di Netlify Dashboard**
   - Buka https://app.netlify.com
   - Click "New site from Git"
   - Choose your Git provider
   - Select repository
   - Configure build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
     - **Branch**: `main`

3. **Add Environment Variables di Netlify**
   - Go to Site settings > Environment variables
   - Add:
     - `VITE_API_URL`: Your API URL
     - `VITE_APP_NAME`: CCS System
     - `VITE_APP_VERSION`: 1.0.0

4. **Deploy!**
   - Click "Deploy site"
   - Wait for build to complete

### Method 3: Manual Deploy via Netlify Drop

1. **Build locally**
```bash
npm run build
```

2. **Drag & Drop**
   - Go to https://app.netlify.com/drop
   - Drag your `dist` folder to the upload area
   - Done!

## Custom Domain Setup

1. Go to Site settings > Domain management
2. Add custom domain
3. Configure DNS settings
4. Enable HTTPS (automatic)

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Verify environment variables
- Check for syntax errors

### 404 on Page Refresh
- Ensure `netlify.toml` redirect rules are in place

### API Connection Issues
- Verify `VITE_API_URL` is correct
- Check CORS settings on backend

## Performance Optimization

- ✅ Code splitting enabled
- ✅ Asset optimization
- ✅ Gzip compression
- ✅ CDN enabled by default

## Monitoring

- Check deploy logs in Netlify dashboard
- Monitor performance with Lighthouse
- Setup error tracking (Sentry recommended)