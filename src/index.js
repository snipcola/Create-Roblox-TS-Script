#!/usr/bin/env node
import fs from "fs";
import url from "url";

import path from "path";
import { randomUUID } from "crypto";

import { Readable } from "stream";
import { finished } from "stream/promises";

import process from "process";
import { spawnSync } from "child_process";

import prompts from "prompts";
import _yargs from "yargs";

import { lookpath } from "lookpath";
import { yellow, green, blue } from "colorette";

import temporaryDirectory from "temp-dir";
import unzipper from "unzipper";

const yargs = _yargs();
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const {
  pdirectory,
  pname,
  pauthor,
  pversion,
  git: _git,
  pmanager,
  ide: _ide,
} = yargs
  .usage("Create Roblox-TS Script")
  .alias("pd", "pdirectory")
  .describe("pdirectory", "Project Directory")
  .string("pdirectory")
  .alias("pn", "pname")
  .describe("pname", "Project Name")
  .string("pname")
  .alias("pa", "pauthor")
  .describe("pauthor", "Project Author")
  .string("pauthor")
  .alias("pv", "pversion")
  .describe("pversion", "Project Version")
  .string("pversion")
  .alias("g", "git")
  .describe("git", "Initialize Git Repo")
  .boolean("git")
  .alias("pm", "pmanager")
  .describe("pmanager", "Package Manager")
  .string("pmanager")
  .alias("i", "ide")
  .describe("ide", "IDE")
  .string("ide")
  .help("help")
  .alias("h", "help")
  .describe("help", "Show Commands")
  .alias("v", "version")
  .describe("version", "Show Version")
  .recommendCommands()
  .strict()
  .wrap(yargs.terminalWidth())
  .parseSync();

function readJSONFile(path) {
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch {}
}

function writeJSONFile(path, json) {
  fs.writeFileSync(path, JSON.stringify(json, null, 2), "utf8");
}

function executeCommand(command, args, cwd) {
  const windows = process.platform === "win32";

  const result = spawnSync(
    windows ? "cmd.exe" : command,
    windows ? ["/c", command, ...args] : args,
    {
      cwd,
      stdio: ["ignore", "ignore", "pipe"],
    },
  );

  return result.error === undefined;
}

async function downloadFile(url, folder, name) {
  try {
    const response = await fetch(url);
    if (!response.ok) return false;

    const filePath = path.resolve(folder, name || randomUUID());
    const fileStream = fs.createWriteStream(filePath, { flags: "wx" });

    await finished(Readable.fromWeb(response.body).pipe(fileStream));
    return filePath;
  } catch {
    return false;
  }
}

async function extractZip(file, folder, name) {
  try {
    const zip = await unzipper.Open.file(file);
    const _path = path.resolve(folder, name || randomUUID());

    await zip.extract({ path: _path });
    return _path;
  } catch {
    return false;
  }
}

async function installAftman() {
  const aftman = {
    repo: "LPGhatguy/aftman",
    version: "v0.3.0",
    files: {
      linux: "aftman-0.3.0-linux-x86_64.zip",
      linuxArm: "aftman-0.3.0-linux-aarch64.zip",
      macos: "aftman-0.3.0-macos-x86_64.zip",
      macosArm: "aftman-0.3.0-macos-aarch64.zip",
      windows: "aftman-0.3.0-windows-x86_64.zip",
    },
    file: function () {
      const { platform, arch } = process;
      const arm = arch === "arm64" ? "Arm" : "";
      let file;

      if (platform === "linux") file = this.files[`linux${arm}`];
      else if (platform === "darwin") file = this.files[`macos${arm}`];
      else if (platform === "windows") file = this.files.windows;

      return file
        ? `https://github.com/${this.repo}/releases/download/${this.version}/${file}`
        : undefined;
    },
  };

  function getExecutable(folder) {
    const file = fs.readdirSync(folder).shift();
    if (!file) return false;

    const executable = path.resolve(folder, file);
    const platform = process.platform;

    if (["linux", "darwin"].includes(platform)) {
      executeCommand("chmod", ["+x", executable]);
      if (platform === "darwin") executeCommand("xattr", ["-cr", executable]);
    }

    return executable;
  }

  const file = await downloadFile(aftman.file(), temporaryDirectory);
  if (!file) return false;

  const folder = await extractZip(file, temporaryDirectory);
  if (!folder) return false;

  const executable = getExecutable(folder);
  if (!executable) return false;

  const success = executeCommand(executable, ["self-install"]);
  if (!success) return false;

  fs.rmSync(file, { force: true });
  fs.rmSync(folder, { force: true, recursive: true });
  return true;
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const template = path.resolve(root, "template");
  const config = {
    filesToForceCopy: [
      path.resolve(template, "assets"),
      path.resolve(template, ".eslintrc"),
      path.resolve(template, "_gitignore"),
      path.resolve(template, "package.json"),
      path.resolve(template, "aftman.toml"),
      path.resolve(template, "tsconfig.json"),
    ],
    filesToOptionallyCopy: [path.resolve(template, "src")],
    packageJSONValuesToKeep: ["scripts", "dependencies", "devDependencies"],
    supportedPackageManagers: ["pnpm", "yarn", "npm"],
    supportedIDEs: [
      {
        name: "VSCode",
        command: "code",
      },
      {
        name: "VSCodium",
        command: "codium",
      },
    ],
  };

  if (pmanager && !config.supportedPackageManagers.includes(pmanager)) {
    console.error(`✖ '${pmanager}' not supported.`);
    process.exit(1);
  }

  if (_ide && !config.supportedIDEs.find((i) => i.command === _ide)) {
    console.error(`✖ '${_ide}' not supported.`);
    process.exit(1);
  }

  const git = await lookpath("git");
  let aftman = await lookpath("aftman");

  const packageManagers = (
    await Promise.all(
      config.supportedPackageManagers.map(function (command) {
        return new Promise(async function (res) {
          const _path = await lookpath(command);
          if (_path) return res({ path: _path, name: path.basename(_path) });
          res();
        });
      }),
    )
  ).filter((p) => p !== undefined);

  const IDEs = (
    await Promise.all(
      config.supportedIDEs.map(function ({ name, command }) {
        return new Promise(async function (res) {
          const path = await lookpath(command);
          if (path) return res({ path, name });
          res();
        });
      }),
    )
  ).filter((p) => p !== undefined);

  if (pmanager && !packageManagers.find((n) => n.name === pmanager)) {
    console.error(`✖ '${pmanager}' not available.`);
    process.exit(1);
  }

  if (_ide && !IDEs.find((i) => path.basename(i.path) === _ide)) {
    console.error(`✖ '${_ide}' not available.`);
    process.exit(1);
  }

  let { directory } = pdirectory
    ? { directory: pdirectory }
    : await prompts(
        [
          {
            type: "text",
            name: "directory",
            message: "Project Directory",
            initial: "./roblox-ts-script",
          },
        ],
        {
          onCancel: function () {
            process.exit(1);
          },
        },
      );

  directory = path.resolve(directory);

  if (path.extname(directory) !== "") {
    console.error("✖ Not a directory.");
    process.exit(1);
  }

  const directoryExists = fs.existsSync(directory);

  if (directoryExists) {
    if (!fs.statSync(directory).isDirectory()) {
      console.error("✖ Not a directory.");
      process.exit(1);
    }

    console.log(yellow("- Directory already exists, attempting anyway."));
  }

  const existingPackageJSON =
    directoryExists && readJSONFile(path.resolve(directory, "package.json"));

  const hasGitDirectory =
    directoryExists &&
    fs.existsSync(path.resolve(directory, ".git")) &&
    fs.statSync(path.resolve(directory, ".git")).isDirectory();

  function nameValidation(value) {
    if (!value) return "Name cannot be empty.";
    if (!/^[a-zA-Z0-9-_]+$/.test(value))
      return "Name is formatted incorrectly.";
    return true;
  }

  function authorValidation(value) {
    if (!value) return "Author cannot be empty.";
    if (!/^[a-zA-Z0-9-_@.]+$/.test(value))
      return "Author is formatted incorrectly.";
    return true;
  }

  function versionValidation(value) {
    if (!value) return "Version cannot be empty.";
    if (
      !/^\d+(\.\d+){0,2}(\.\d+)?(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/.test(
        value,
      )
    )
      return "Version is formatted incorrectly (x.y.z).";
    return true;
  }

  function checkValidation(value, func) {
    if (value) {
      const validation = func(value);

      if (validation !== true) {
        console.error(`✖ ${validation}`);
        return validation;
      }
    }
  }

  const validations = [
    checkValidation(pname, nameValidation),
    checkValidation(pauthor, authorValidation),
    checkValidation(pversion, versionValidation),
  ];

  if (validations.some((v) => v !== undefined)) {
    return;
  }

  let { name, author, version, initializeGit, packageManager, IDE } =
    await prompts(
      [
        ...[
          !(pname || existingPackageJSON?.name)
            ? {
                type: "text",
                name: "name",
                message: "Project Name",
                initial: "Project",
                validate: nameValidation,
              }
            : {},
        ],
        ...[
          !(pauthor || existingPackageJSON?.author)
            ? {
                type: "text",
                name: "author",
                message: "Project Author",
                initial: "Author",
                validate: authorValidation,
              }
            : {},
        ],
        ...[
          !(pversion || existingPackageJSON?.version)
            ? {
                type: "text",
                name: "version",
                message: "Project Version",
                initial: "0.0.1",
                validate: versionValidation,
              }
            : {},
        ],
        ...[
          !hasGitDirectory && git && _git === undefined
            ? {
                type: "confirm",
                name: "initializeGit",
                message: "Initialize Git Repo",
                initial: false,
              }
            : {},
        ],
        ...[
          !pmanager && packageManagers.length > 1
            ? {
                type: "select",
                name: "packageManager",
                message: "Package Manager",
                choices: packageManagers.map((p) => ({
                  title: p.name,
                  value: p,
                })),
              }
            : {},
        ],
        ...[
          !_ide && IDEs.length > 1
            ? {
                type: "select",
                name: "IDE",
                message: "IDE",
                choices: IDEs.map((i) => ({
                  title: i.name,
                  value: i,
                })),
              }
            : {},
        ],
      ],
      {
        onCancel: function () {
          process.exit(1);
        },
      },
    );

  name = pname || existingPackageJSON?.name || name;
  author = pauthor || existingPackageJSON?.author || author;
  version = pversion || existingPackageJSON?.version || version;
  initializeGit =
    !hasGitDirectory && git && _git !== undefined ? _git : initializeGit;

  packageManager =
    packageManagers.length > 0 &&
    (packageManagers.find((p) => p.name === pmanager) ||
      packageManager ||
      packageManagers[0]);

  IDE =
    IDEs.length > 0 &&
    (IDEs.find((i) => path.basename(i.path) === _ide) || IDE || IDEs[0]);

  if (!directoryExists) {
    console.log(blue(`- Creating '${path.basename(directory)}'.`));
    fs.mkdirSync(directory, { recursive: true });
  }

  console.log(blue(`- Moving files to '${path.basename(directory)}'.`));

  for (const file of config.filesToForceCopy) {
    const name = path.basename(file);

    if (!initializeGit && ["_gitignore"].includes(name)) {
      continue;
    }

    const newFile = path.resolve(
      directory,
      name === "_gitignore" ? ".gitignore" : name,
    );

    fs.cpSync(file, newFile, { recursive: true, force: true });
  }

  for (const file of config.filesToOptionallyCopy) {
    const name = path.basename(file);
    const newFile = path.resolve(directory, name);

    if (!fs.existsSync(newFile)) {
      fs.cpSync(file, newFile, { recursive: true, force: true });
    }
  }

  console.log(blue("- Modifying 'package.json' values."));

  const packageJSONPath = path.resolve(directory, "package.json");
  const packageJSON = readJSONFile(packageJSONPath);

  if (!packageJSON) {
    console.error("✖ File 'package.json' doesn't exist.");
    process.exit(1);
  }

  packageJSON.name = name.toLowerCase();
  packageJSON.author = author;
  packageJSON.version = version;

  if (existingPackageJSON) {
    console.log(blue("- Preserving previous 'package.json' values."));

    for (const value of config.packageJSONValuesToKeep) {
      if (existingPackageJSON[value]) {
        if (!packageJSON[value]) packageJSON[value] = {};

        for (const key in existingPackageJSON[value]) {
          if (!packageJSON[value].hasOwnProperty(key)) {
            packageJSON[value][key] = existingPackageJSON[value][key];
          }
        }
      }
    }
  }

  writeJSONFile(packageJSONPath, packageJSON);

  console.log(blue("- Modifying 'assets/rojo.json' values."));

  const projectJSONPath = path.resolve(directory, "assets", "rojo.json");
  const projectJSON = readJSONFile(projectJSONPath);

  if (!projectJSON) {
    console.error("✖ File 'assets/rojo.json' doesn't exist.");
    process.exit(1);
  }

  projectJSON.name = name;
  writeJSONFile(projectJSONPath, projectJSON);

  if (initializeGit) {
    console.log(blue("- Initializing git repository."));

    if (!executeCommand(git, ["init"], directory)) {
      console.error("✖ Failed to initialize git repository.");
    }
  }

  if (!aftman) {
    console.log(yellow("- 'aftman' not found, attempting to install."));
    await installAftman();
    aftman = await lookpath("aftman");

    if (!aftman) {
      console.error(
        "✖ Failed to install 'aftman': https://github.com/LPGhatguy/aftman/releases/latest",
      );
      process.exit(1);
    }
  }

  console.log(blue(`- Installing dependencies using 'aftman'.`));
  executeCommand(aftman, ["install", "--no-trust-check"], directory);

  if (packageManager) {
    console.log(
      blue(`- Installing dependencies using '${packageManager.name}'.`),
    );

    if (
      !executeCommand(packageManager.path, ["install", "--silent"], directory)
    ) {
      console.error(
        `"✖ Failed to install dependencies using '${packageManager.name}'.`,
      );
      process.exit(1);
    }

    console.log(blue(`- Building project using '${packageManager.name}'.`));

    if (!executeCommand(packageManager.path, ["run", "build"], directory)) {
      console.error(
        `✖ Failed to build project using '${packageManager.name}'.`,
      );
      process.exit(1);
    }
  }

  if (IDE) {
    console.log(blue(`- Opening project in '${IDE.name}'.`));

    if (!executeCommand(IDE.path, [".", "src/index.ts"], directory)) {
      console.error(`✖ Failed to open project in '${IDE.name}'.`);
    }
  }

  console.log(green(`✔ Created '${name}': ${directory}`));
}

main();
