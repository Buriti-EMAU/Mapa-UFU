# How to Deploy to GitHub Pages

Follow these steps to deploy your UFU Map project to GitHub Pages:

## 1. Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in to your account
2. Click on the "+" icon in the top-right corner and select "New repository"
3. Name your repository (e.g., "ufu-campus-map")
4. Make sure the repository is set to "Public"
5. Click "Create repository"

## 2. Push Your Code to GitHub

Run these commands in your terminal, replacing `YOUR_USERNAME` with your GitHub username and `YOUR_REPO_NAME` with the name of your repository:

```bash
# Navigate to your project directory
cd /path/to/ufu-map-static

# Add the GitHub repository as a remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push your code to GitHub
git push -u origin main
```

## 3. Configure GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings" (tab at the top)
3. Scroll down to the "GitHub Pages" section
4. Under "Source", select "main" branch
5. Click "Save"

## 4. Access Your Website

After a few minutes, your website will be available at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

## 5. Add Your Mapbox Token

Since your Mapbox token is needed for the map to work, you'll need to add it:

1. Edit the `index.html` file in your GitHub repository
2. Find the line with `mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';`
3. Replace `'YOUR_MAPBOX_TOKEN'` with your actual Mapbox token
4. Commit the changes

## Important Notes

- It may take a few minutes for your site to be published after pushing changes
- Make sure your Mapbox token has the appropriate permissions and domain restrictions
- If you make changes to your site, simply commit and push them to the `main` branch, and GitHub Pages will automatically update