const os = require("os");
const { execFileSync } = require("child_process");

const fs = require("fs");
const path = require("path");

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

binaryPath = path.join(__dirname, "bin", binaryPath);

function copyFile(file, copy) {
  const contents = fs.readFileSync(file, "utf8");
  fs.writeFileSync(copy, contents, "utf8");
}

function minifyFile(_path) {
  const file = _path.split("/").pop();
  const config = path.join(__dirname, "config", `${file}.json`);
  execFileSync(binaryPath, ["process", "--config", config, _path, _path]);
}

function cleanLua(code) {
  return code
    .replace(/(\r\n|\n|\r)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanFile(file) {
  const contents = cleanLua(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, contents, "utf8");
}

function minifyAndCleanFile(file) {
  minifyFile(file);
  cleanFile(file);
  minifyFile(file);
}

const args = process.argv.slice(2);
const [file, minFile] = args;

copyFile(file, minFile);

minifyFile(file);
minifyAndCleanFile(minFile);
