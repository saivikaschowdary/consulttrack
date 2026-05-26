/**
 * ConsultTrack Local Server — Node.js with GitHub Auto-Update
 * Run:    node server.js
 * Update: node server.js --update
 * Open:   http://localhost:3000
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec, execSync } = require("child_process");
const https = require("https");

const PORT = 3000;
const HOST = "localhost";
const const GITHUB_REPO = "saivikaschowdary/consulttrack"; // e.g. "yourusername/consulttrack"

const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript",
  ".css":  "text/css",
  ".json": "application/json",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".ico":  "image/x-icon",
};

// ─── Git Helpers ─────────────────────────────────────────────

function isGitRepo() {
  return fs.existsSync(path.join(ROOT, ".git"));
}

function getCurrentCommit() {
  try { return execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim(); }
  catch { return "unknown"; }
}

function getRemoteCommit() {
  if (!GITHUB_REPO) return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/commits/main`;
    const req = https.get(url, { headers: { "User-Agent": "ConsultTrack" } }, (res) => {
      let data = "";
      res.on("data", d => data += d);
      res.on("end", () => {
        try { resolve(JSON.parse(data).sha.slice(0, 7)); }
        catch { resolve(null); }
      });
    });
    req.on("error", () => resolve(null));
    req.setTimeout(5000, () => { req.destroy(); resolve(null); });
  });
}

function gitPull() {
  return new Promise((resolve) => {
    exec("git pull origin main", { cwd: ROOT }, (err, stdout, stderr) => {
      resolve({ success: !err, output: (stdout + stderr).trim() });
    });
  });
}

function backupHtml() {
  const src = path.join(ROOT, "index.html");
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dst = path.join(ROOT, `index.backup.${ts}.html`);
  if (fs.existsSync(src)) { fs.copyFileSync(src, dst); return dst; }
  return null;
}

// ─── HTTP Server ─────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const headers = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Access-Control-Allow-Origin": "*",
  };

  // API: Check for update
  if (req.url === "/api/check-update") {
    const current = isGitRepo() ? getCurrentCommit() : "n/a";
    const latest  = await getRemoteCommit();
    res.writeHead(200, { ...headers, "Content-Type": "application/json" });
    res.end(JSON.stringify({
      hasUpdate: latest && latest !== current,
      currentCommit: current,
      latestCommit: latest,
      repo: GITHUB_REPO || "not configured",
      isGitRepo: isGitRepo(),
    }));
    return;
  }

  // API: Apply update
  if (req.url === "/api/update") {
    if (!isGitRepo()) {
      res.writeHead(200, { ...headers, "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "Not a git repository" }));
      return;
    }
    const backup = backupHtml();
    const { success, output } = await gitPull();
    res.writeHead(200, { ...headers, "Content-Type": "application/json" });
    res.end(JSON.stringify({ success, message: output, backup }));
    return;
  }

  // Static files
  let filePath = path.join(ROOT, req.url.split("?")[0].split("#")[0]);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(ROOT, "index.html");
  }

  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || "text/plain";

  fs.readFile(filePath, (err, content) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { ...headers, "Content-Type": mime });
    res.end(content);
  });

  if (!req.url.startsWith("/api")) console.log(`  → ${req.method} ${req.url}`);
});

// ─── Startup ─────────────────────────────────────────────────

async function start() {
  // --update flag
  if (process.argv.includes("--update")) {
    console.log("\n  Checking for updates...");
    if (!isGitRepo()) { console.error("  ✗ Not a git repository."); process.exit(1); }
    const backup = backupHtml();
    if (backup) console.log(`  ✓ Backup: ${path.basename(backup)}`);
    const { success, output } = await gitPull();
    console.log(success ? `  ✓ Updated!\n  ${output}` : `  ✗ Failed:\n  ${output}`);
    process.exit(success ? 0 : 1);
  }

  server.listen(PORT, HOST, async () => {
    const commit = isGitRepo() ? getCurrentCommit() : "standalone";
    console.log("=".repeat(52));
    console.log("  ConsultTrack  —  Local Server (Node.js)");
    console.log("=".repeat(52));
    console.log(`\n  Version:     ${commit}`);
    console.log(`  GitHub Repo: ${GITHUB_REPO || "not configured (edit server.js)"}`);

    if (isGitRepo() && GITHUB_REPO) {
      process.stdout.write("\n  Checking GitHub for updates... ");
      const latest = await getRemoteCommit();
      if (latest && latest !== commit) {
        console.log(`⚡ Update available! (→ ${latest})`);
        console.log(`  Run: node server.js --update`);
      } else {
        console.log("✓ Up to date");
      }
    }

    console.log(`\n  HR Dashboard:     http://${HOST}:${PORT}`);
    console.log(`  Employee Portal:  http://${HOST}:${PORT}/#portal`);
    console.log(`\n  Update command:   node server.js --update`);
    console.log(`\n  Ctrl+C to stop`);
    console.log("=".repeat(52) + "\n");

    const open = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    exec(`${open} http://${HOST}:${PORT}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") console.error(`\n  ✗ Port ${PORT} in use. Edit PORT in server.js`);
    else console.error("\n  ✗ Error:", err.message);
    process.exit(1);
  });
}

start();
process.on("SIGINT", () => { console.log("\n\n  Server stopped."); process.exit(0); });
