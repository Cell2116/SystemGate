# Netlify Deploy Instructions

1. Go to https://app.netlify.com
2. Drag and drop your `dist/spa` folder to Netlify
3. Your PWA will be available at https://yoursite.netlify.app
4. Test "Add to Home Screen" on mobile with HTTPS

OR

Use Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --dir=dist/spa --prod
```
