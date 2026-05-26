#!/bin/bash
# ConsultTrack — GitHub Setup Helper
# Run: ./setup-github.sh

echo ""
echo "================================================"
echo "  ConsultTrack — GitHub Setup"
echo "================================================"
echo ""

# Check git
if ! command -v git &>/dev/null; then
    echo "  ✗ Git not found. Install from https://git-scm.com"
    exit 1
fi

# Already a repo?
if [ -d ".git" ]; then
    echo "  ✓ Already a git repository."
    REMOTE=$(git remote get-url origin 2>/dev/null)
    if [ -n "$REMOTE" ]; then
        echo "  ✓ Remote already set: $REMOTE"
        echo ""
        echo "  To push latest changes:"
        echo "    git add . && git commit -m 'Update' && git push"
        exit 0
    fi
fi

echo "  Step 1: Create a GitHub repo at https://github.com/new"
echo "          Name it 'consulttrack' (private recommended)"
echo ""
echo "  Step 2: Paste the repo URL below."
echo "          Example: https://github.com/yourname/consulttrack.git"
echo ""
read -p "  GitHub repo URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "  ✗ No URL provided. Exiting."
    exit 1
fi

# Extract username/repo from URL
REPO_SLUG=$(echo "$REPO_URL" | sed 's|https://github.com/||' | sed 's|.git$||')

echo ""
echo "  Setting up git repository..."

if [ ! -d ".git" ]; then
    git init
    echo "  ✓ Initialized git repository"
fi

git add .
git commit -m "Initial ConsultTrack setup" 2>/dev/null || echo "  (nothing new to commit)"
git branch -M main 2>/dev/null
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"
echo "  ✓ Remote set: $REPO_URL"

echo ""
echo "  Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "  ✅ Successfully pushed to GitHub!"
    echo ""
    echo "  Now edit server.py and server.js and set:"
    echo "    GITHUB_REPO = \"$REPO_SLUG\""
    echo ""
    echo "  Then start the server:"
    echo "    python3 server.py"
else
    echo ""
    echo "  ✗ Push failed. You may need to authenticate."
    echo "  Try: gh auth login (if you have GitHub CLI)"
    echo "  Or:  use a Personal Access Token"
fi

echo "================================================"
echo ""
