const fs = require("fs");
const path = require("path");
const process = require("process");

const build = require("roblox-ts/out/CLI/commands/build");
const { measure } = require("../shared/functions");

const bundler = require("./bundler");
const minifier = require("darklua-bin-wrapper");

function clean(folders) {
  for (const folder of folders) {
    fs.rmSync(folder, { recursive: true, force: true });
  }
}

function minify(file) {
  minifier.processFile(
    file,
    null,
    path.resolve(__dirname, "config", `${path.basename(file)}.json`),
  );
}

const root = path.resolve(__dirname, "..", "..", "..");
const outFolder = path.resolve(root, "out");
const assetsFolder = path.resolve(root, "assets");

const config = {
  root,
  folder: outFolder,
  clean: [outFolder],
  input: path.resolve(outFolder, "init.luau"),
  output: path.resolve(outFolder, "script.lua"),
  outputMin: path.resolve(outFolder, "script.min.lua"),
  rojoConfig: path.resolve(assetsFolder, "rojo.json"),
  include: path.resolve(outFolder, "include"),
  nodeModules: path.resolve(root, "node_modules"),
};

async function main() {
  const { default: yocto } = await import("yocto-spinner");
  const spinner = yocto({ text: "Building", color: "blue" }).start();

  const elapsed = measure(function () {
    try {
      clean(config.clean);
      build.handler({
        project: ".",
        rojo: config.rojoConfig,
        includePath: config.include,
      });
    } catch {
      spinner.error("Failed to build");
      process.exit(1);
    }

    try {
      spinner.text = "Bundling";
      spinner.color = "yellow";
      bundler(config);
    } catch {
      spinner.error("Failed to bundle");
      process.exit(1);
    }

    try {
      spinner.text = "Moving Files";
      spinner.color = "magenta";

      clean(config.clean);
      fs.mkdirSync(config.folder, { recursive: true });
      fs.renameSync(path.basename(config.output), config.output);
    } catch {
      spinner.error("Failed to move files");
      process.exit(1);
    }

    try {
      spinner.text = "Minifying";
      spinner.color = "green";

      minify(config.output);
      fs.cpSync(config.output, config.outputMin, { force: true });

      minifier.cleanFile(config.outputMin);
      minify(config.outputMin);
    } catch {
      spinner.error("Failed to minify");
      process.exit(1);
    }
  });

  spinner.success(`Built (took ${elapsed}ms)`);
}

main();
module.exports = main;
