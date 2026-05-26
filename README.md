# ConsultTrack — Local Server + GitHub Integration

## Quick Start (3 steps)

### 1. Create GitHub Repository
1. Go to https://github.com/new
2. Name it `consulttrack` (private or public)
3. Don't add README or .gitignore (we have those)
4. Copy the repo URL shown (e.g. `https://github.com/yourusername/consulttrack.git`)

### 2. Push to GitHub (run once in this folder)
```bash
git init
git add .
git commit -m "Initial ConsultTrack setup"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/consulttrack.git
git push -u origin main
```

### 3. Edit GITHUB_REPO in server files
Open `server.py` and `server.js`, find this line near the top:
```python
GITHUB_REPO = ""
```
Change it to:
```python
GITHUB_REPO = "yourusername/consulttrack"
```

---

## Running the Server

### Mac / Linux
```bash
python3 server.py
```
Or: `./start-server.sh`

### Windows
Double-click `START-SERVER.bat`
Or: `python server.py`

**Opens automatically at http://localhost:3000**

---

## Updating ConsultTrack

### Option 1 — Command line (recommended)
```bash
git pull origin main
```
Or use the built-in update command:
```bash
python3 server.py --update
```

### Option 2 — In-app update button
When a new version is available on GitHub, a yellow **"⚡ Update available"** button appears in the top navigation bar. Click it to update with one click — no terminal needed.

### Option 3 — VS Code / GitHub Desktop
Just sync/pull in your Git client.

---

## Workflow: Making Changes

1. Edit `index.html` in any text editor or VS Code
2. Refresh the browser — changes appear instantly
3. Save to GitHub:
```bash
git add index.html
git commit -m "Added new feature"
git push
```
4. On any other machine: `git pull` or click the update button

---

## File Structure
```
consulttrack/
├── index.html          ← The full app (edit this)
├── server.py           ← Python server with GitHub integration
├── server.js           ← Node.js alternative
├── package.json        ← Node config
├── START-SERVER.bat    ← Windows launcher
├── start-server.sh     ← Mac/Linux launcher
├── .gitignore          ← Git ignore rules
└── README.md           ← This file
```

## URLs
| Page             | URL                              |
|------------------|----------------------------------|
| HR Dashboard     | http://localhost:3000            |
| Employee Portal  | http://localhost:3000/#portal    |
| Check for update | http://localhost:3000/api/check-update |

## Requirements
- Python 3.6+ (pre-installed on Mac/Linux) **OR** Node.js 14+
- Git (for GitHub integration)

Check: `python3 --version` | `node --version` | `git --version`
