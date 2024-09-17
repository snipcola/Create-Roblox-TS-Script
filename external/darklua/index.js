const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { Minify } = require("lua-format");

function minifyLua(code) {
  return Minify(code, {
    RenameGlobals: false,
    RenameVariables: false,
    SolveMath: false,
  })
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => !l.startsWith("--") && l.length > 0)
    .join("\n")
    .trim();
}

function minifyFile(file) {
  const contents = minifyLua(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, contents, "utf8");
}

const platform = os.platform();
const arch = os.arch();

let binaryPath;

if (platform === "linux") {
  binaryPath =
    arch === "arm64" ? "darklua-linux-aarch64" : "darklua-linux-x86_64";
} else if (platform === "darwin") {
  binaryPath =
    arch === "arm64" ? "darklua-macos-aarch64" : "darklua-macos-x86_64";
} else if (platform === "win32") {
  binaryPath = "darklua-windows-x86_64.exe";
} else {
  console.error("Unsupported platform:", platform);
  process.exit(1);
}

const fullPath = path.join(__dirname, "bin", binaryPath);
const args = process.argv.slice(2);
const outFile = args[args.length - 1];

execFileSync(fullPath, args);
minifyFile(outFile);