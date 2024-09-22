#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const process = require("process");
const { execSync } = require("child_process");

const yargs = require("yargs");
const prompts = require("prompts");

const { lookpath } = require("lookpath");
const { yellow, green, blue } = require("colorette");

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

function executeCommand(command, cwd) {
  execSync(command, {
    cwd,
    stdio: ["ignore", "ignore", "pipe"],
  });
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const template = path.resolve(root, "template");
  const config = {
    filesToForceCopy: [
      path.resolve(template, "assets"),
      path.resolve(template, ".eslintrc"),
      path.resolve(template, "_gitignore"),
      path.resolve(template, "default.project.json"),
      path.resolve(template, "package.json"),
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
    return console.error(`✖ '${pmanager}' not supported.`);
  }

  if (_ide && !config.supportedIDEs.find((i) => i.command === _ide)) {
    return console.error(`✖ '${_ide}' not available.`);
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
    return console.error("✖ Not a directory.");
  }

  const directoryExists = fs.existsSync(directory);

  if (directoryExists) {
    if (!fs.statSync(directory).isDirectory()) {
      return console.error("✖ Not a directory.");
    }

    console.log(yellow("- Directory already exists, attempting anyway."));
  }

  const git = await lookpath("git");

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
    return console.error(`✖ '${pmanager}' not available.`);
  }

  if (_ide && !IDEs.find((i) => path.basename(i.path) === _ide)) {
    return console.error(`✖ '${_ide}' not available.`);
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
          !hasGitDirectory && git && !_git
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
  initializeGit = !hasGitDirectory && git && _git ? _git : initializeGit;

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
    return console.error("✖ File 'package.json' doesn't exist.");
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

  console.log(blue("- Modifying 'default.project.json' values."));

  const projectJSONPath = path.resolve(directory, "default.project.json");
  const projectJSON = readJSONFile(projectJSONPath);

  if (!projectJSON) {
    return console.error("✖ File 'default.project.json' doesn't exist.");
  }

  projectJSON.name = name;
  writeJSONFile(projectJSONPath, projectJSON);

  if (initializeGit) {
    console.log(blue("- Initializing git repository."));
    executeCommand(`${git} init`, directory);
  }

  if (packageManager) {
    console.log(
      blue(`- Installing dependencies using '${packageManager.name}'.`),
    );
    executeCommand(`${packageManager.path} install --silent`, directory);

    console.log(blue(`- Building project using '${packageManager.name}'.`));
    executeCommand(`${packageManager.path} run build`, directory);
  }

  if (IDE) {
    console.log(blue(`- Opening project in '${IDE.name}'.`));
    executeCommand(`${IDE.path} . src/index.ts`, directory);
  }

  console.log(green(`✔ Created '${name}': ${directory}`));
}

main();
