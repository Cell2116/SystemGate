import fs from "fs";
import path from "path";

function getFolderSize(folderPath) {
  let total = 0;

  if (!fs.existsSync(folderPath)) return 0;
  const stats = fs.statSync(folderPath);

  // kalau file biasa → langsung return size
  if (!stats.isDirectory()) {
    return stats.size;
  }

  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    const fullPath = path.join(folderPath, file);
    total += getFolderSize(fullPath);
  }

  return total;
}

function formatSize(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
}

const nodeModulesPath = path.resolve("./node_modules");
const packages = fs.readdirSync(nodeModulesPath);

const sizes = packages.map(pkg => {
  const pkgPath = path.join(nodeModulesPath, pkg);
  const size = getFolderSize(pkgPath);
  return { name: pkg, size };
});

// Sort by size descending
sizes.sort((a, b) => b.size - a.size);

// Print top 10
//console.log("📦 Top 10 biggest node_modules packages:\n");
sizes.slice(0, 10).forEach(pkg => {
  //console.log(`${pkg.name.padEnd(30)} ${formatSize(pkg.size)}`);
});
