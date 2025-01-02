#!/usr/bin/env node

import os from "os";
import fs from "fs/promises";
import { createWriteStream } from "fs";

import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

import { Readable } from "stream";
import { finished } from "stream/promises";

import process from "process";
import { spawn } from "child_process";

import prompts from "prompts";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { lookpath } from "lookpath";
import { blue, green, yellow, red } from "colorette";

import unzipper from "unzipper";

const __dirname = dirname(fileURLToPath(import.meta.url));

const {
  package: __package,
  template: _template,
  pdirectory,
  pname,
  pauthor,
  pversion,
  git: _git,
  pmanager,
  ide: _ide,
  openide,
} = yargs(hideBin(process.argv))
  .usage("Create Roblox-TS Script")
  .option("package", {
    alias: "p",
    describe: "Create Package",
    type: "boolean",
  })
  .option("template", {
    alias: "t",
    describe: "Template Name (e.g. hello-world)",
    type: "string",
  })
  .option("pdirectory", {
    alias: "pd",
    describe: "Project Directory",
    type: "string",
  })
  .option("pname", {
    alias: "pn",
    describe: "Project Name",
    type: "string",
  })
  .option("pauthor", {
    alias: "pa",
    describe: "Project Author",
    type: "string",
  })
  .option("pversion", {
    alias: "pv",
    describe: "Project Version",
    type: "string",
  })
  .option("git", {
    alias: "g",
    describe: "Initialize Git Repo",
    type: "boolean",
  })
  .option("pmanager", {
    alias: "pm",
    describe: "Package Manager (e.g. pnpm)",
    type: "string",
  })
  .option("ide", {
    alias: "i",
    describe: "IDE (e.g. codium)",
    type: "string",
  })
  .option("openide", {
    alias: "oi",
    describe: "Open Project In IDE",
    type: "boolean",
  })
  .alias("h", "help")
  .describe("help", "Show Commands")
  .alias("v", "version")
  .describe("version", "Show Version")
  .recommendCommands()
  .strict()
  .wrap(yargs().terminalWidth())
  .parseSync();

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(dirPath) {
  try {
    return (await fs.stat(dirPath)).isDirectory();
  } catch {
    return false;
  }
}

async function directoryExists(dirPath) {
  return (await fileExists(dirPath)) && (await isDirectory(dirPath));
}

async function copy(file, folder, force = true) {
  const name = path.basename(file);
  const newFile = path.resolve(
    folder,
    name.startsWith("_") ? name.replace("_", ".") : name,
  );

  if (force || !(await fileExists(newFile))) {
    await fs.cp(file, newFile, { force: true, recursive: true });
    return newFile;
  }
}

async function remove(path, directory) {
  if (await (directory ? directoryExists : fileExists)(path)) {
    const args = { force: true };
    if (directory) args.recursive = true;
    await fs.rm(path, args);
  }
}

async function readJSONFile(path) {
  try {
    const contents = await fs.readFile(path, "utf8");
    return JSON.parse(contents);
  } catch {}
}

async function writeJSONFile(path, json) {
  json = `${JSON.stringify(json, null, 2)}\n`;
  await fs.writeFile(path, json, "utf8");
}

function preserveObject(object, existingObject, { entrypoint, keys, force }) {
  function isValid(values, any) {
    return !values[any ? "every" : "some"]((v) =>
      [undefined, null].includes(v),
    );
  }

  function isObject(object) {
    return typeof object === "object" && isValid([object]);
  }

  function getObject(object) {
    return isObject(object) && (object[entrypoint] || object || {});
  }

  function getObjectValue(object, key) {
    if (object.hasOwnProperty(key)) {
      const value = object[key];
      return isValid([value]) ? value : undefined;
    }
  }

  function traverse(object, existingObject, keys, force) {
    let newObject = {};

    const allKeys = new Set([
      ...(keys ? Object.values(keys) : []),
      ...Object.keys(object),
      ...Object.keys(existingObject),
    ]);

    for (const key of allKeys) {
      const objectValue = getObjectValue(object, key);
      const existingValue = getObjectValue(existingObject, key);

      const oneValueExists = isValid([objectValue, existingValue], true);
      const bothValuesExist = isValid([objectValue, existingValue]);

      const forceValue = bothValuesExist && force?.includes(key);

      if (!oneValueExists) {
        continue;
      } else if (
        !existingValue ||
        (bothValuesExist && typeof objectValue !== typeof existingValue)
      ) {
        newObject[key] = objectValue;
      } else if (Array.isArray(objectValue) && Array.isArray(existingValue)) {
        newObject[key] = Array.from(
          new Set(
            forceValue
              ? [...existingValue, ...objectValue]
              : [...objectValue, ...existingValue],
          ),
        );
      } else if (isObject(objectValue)) {
        newObject[key] = forceValue
          ? traverse(existingValue, objectValue)
          : traverse(objectValue, existingValue);
      } else {
        newObject[key] = forceValue ? objectValue : existingValue;
      }
    }

    return newObject;
  }

  const _object = getObject(object);
  const _existingObject = getObject(existingObject);

  const newObject = traverse(_object, _existingObject, keys, force);
  if (entrypoint) object[entrypoint] = newObject;

  return entrypoint ? object : newObject;
}

function executeCommand(command, args, cwd) {
  return new Promise(async function (resolve) {
    const useCMD =
      process.platform === "win32" && !command?.toLowerCase()?.endsWith(".exe");
    const result = await spawn(
      useCMD ? "cmd.exe" : command,
      useCMD ? ["/c", command, ...args] : args,
      {
        cwd,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let output = "";
    let error = "";

    result.stdout.on("data", function (data) {
      output += data;
    });

    result.stderr.on("data", function (data) {
      error += data;
    });

    result.on("close", function (code) {
      resolve({
        success: code === 0,
        output,
        error,
      });
    });
  });
}

async function downloadFile(url, folder, name) {
  try {
    const response = await fetch(url);
    if (!response.ok) return false;

    const filePath = path.resolve(folder, name || randomUUID());
    const fileStream = createWriteStream(filePath, { flags: "wx" });

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

async function installAftman(temporaryDirectory) {
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
      else if (platform === "win32") file = this.files.windows;

      return file
        ? `https://github.com/${this.repo}/releases/download/${this.version}/${file}`
        : undefined;
    },
  };

  async function getExecutable(folder) {
    const file = (await fs.readdir(folder)).shift();
    if (!file) return false;

    const executable = path.resolve(folder, file);
    const platform = process.platform;

    if (["linux", "darwin"].includes(platform)) {
      await executeCommand("chmod", ["+x", executable]);

      if (platform === "darwin") {
        await executeCommand("xattr", ["-cr", executable]);
      }
    }

    return executable;
  }

  let file;
  let folder;

  async function clean() {
    if (file) await remove(file);
    if (folder) await remove(folder, true);
    return true;
  }

  file = await downloadFile(aftman.file(), temporaryDirectory);
  if (!file) return !(await clean());

  folder = await extractZip(file, temporaryDirectory);
  if (!folder) return !(await clean());

  const executable = await getExecutable(folder);
  if (!executable) return !(await clean());

  const { success } = await executeCommand(executable, ["self-install"]);
  if (!success) return !(await clean());

  return await clean();
}

async function getAftman(bin) {
  const directory = path.resolve(os.homedir(), ".aftman", "bin");
  return await lookpath(bin || "aftman", { include: [directory] });
}

async function main() {
  const temporaryDirectory = await fs.realpath(os.tmpdir());

  const root = path.resolve(__dirname, "..");
  const template = path.resolve(root, "template");
  const config = {
    files: [
      path.resolve(template, "assets"),
      path.resolve(template, "eslint.config.js"),
      path.resolve(template, ".prettierrc.toml"),
      path.resolve(template, "aftman.toml"),
      path.resolve(template, "package.json"),
      path.resolve(template, "tsconfig.json"),
    ],
    templates: [
      {
        name: "Hello World",
        directory: path.resolve(template, "src", "hello-world"),
        entrypoint: (dir) => path.resolve(dir, "src", "index.ts"),
      },
      {
        name: "Hello World UI",
        directory: path.resolve(template, "src", "hello-world-ui"),
        entrypoint: (dir) => path.resolve(dir, "src", "app.tsx"),
        dependencies: {
          "@rbxts/vide": "0.5.3",
        },
      },
    ],
    gitFiles: [path.resolve(template, "_gitignore")],
    vsCodeFiles: [path.resolve(template, ".vscode")],
    packageJSON: {
      keys: [
        "name",
        "author",
        "description",
        "version",
        "keywords",
        "license",
        "repository",
        "type",
        "main",
        "bin",
        "types",
        "files",
        "publishConfig",
        "private",
        "scripts",
        "dependencies",
        "devDependencies",
        "optionalDependencies",
        "peerDependencies",
        "engines",
        "config",
      ],
      force: [
        "name",
        "author",
        "version",
        "type",
        "files",
        "publishConfig",
        "scripts",
        "devDependencies",
      ],
    },
    tsConfigJSON: {
      entrypoint: "compilerOptions",
      keys: [
        "allowSyntheticDefaultImports",
        "downlevelIteration",
        "jsx",
        "jsxFactory",
        "jsxFragmentFactory",
        "module",
        "moduleResolution",
        "moduleDetection",
        "noLib",
        "resolveJsonModule",
        "strict",
        "target",
        "typeRoots",
        "rootDir",
        "outDir",
        "baseUrl",
        "incremental",
        "tsBuildInfoFile",
        "declaration",
      ],
      force: [
        "module",
        "moduleResolution",
        "moduleDetection",
        "noLib",
        "target",
        "typeRoots",
        "rootDir",
        "outDir",
        "baseUrl",
      ],
    },
    rojoJSON: {
      keys: ["name", "globIgnorePaths", "tree"],
      force: ["name", "globIgnorePaths", "tree"],
    },
    supportedPackageManagers: [
      {
        name: "PNPM",
        command: "pnpm",
      },
      {
        name: "Yarn",
        command: "yarn",
      },
      {
        name: "NPM",
        command: "npm",
      },
    ],
    supportedIDEs: [
      {
        name: "VSCodium",
        command: "codium",
      },
      {
        name: "VSCode",
        command: "code",
      },
    ],
  };

  let directory;
  let createdDirectory = false;

  function info(message) {
    console.log(blue(`i ${message}`));
  }

  function success(message) {
    console.log(green(`√ ${message}`));
  }

  function warn(message) {
    console.log(yellow(`! ${message}`));
  }

  async function error(exit, deleteDirectory, message) {
    if (message) {
      console.error(red(`× ${message}`));
    }

    if (deleteDirectory && directory && createdDirectory) {
      await remove(directory, true);
    }

    if (exit) {
      process.exit(1);
    }
  }

  function directoryValidation(value) {
    if (!value) return "Directory cannot be empty.";
    if (!/^(\/?(\.{1,2}(\/|$)|[a-zA-Z0-9\-_ ]+\/?)+)$/.test(value))
      return "Directory is formatted incorrectly.";
    return true;
  }

  const npmRegex = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

  function processArg(value) {
    return (value || "").trim().toLowerCase();
  }

  function nameValidation(value) {
    if (!value) return "Name cannot be empty.";
    if (!npmRegex.test(processArg(value)))
      return "Name is formatted incorrectly.";
    return true;
  }

  function authorValidation(value) {
    if (!value) return "Author cannot be empty.";
    if (!npmRegex.test(processArg(value)))
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

  async function checkValidation(value, func) {
    if (value) {
      const validation = func(value);

      if (validation !== true) {
        await error(true, false, validation);
      }
    }
  }

  if (
    _template &&
    !config.templates.find(
      ({ directory }) => path.parse(directory).name === _template,
    )
  ) {
    await error(true, false, `'${_template}' isn't a template.`);
  }

  await checkValidation(pdirectory, directoryValidation);
  await checkValidation(pname, nameValidation);
  await checkValidation(pauthor, authorValidation);
  await checkValidation(pversion, versionValidation);

  if (
    pmanager &&
    !config.supportedPackageManagers.find((p) => p.command === pmanager)
  ) {
    await error(true, false, `'${pmanager}' not supported.`);
  }

  if (_ide && !config.supportedIDEs.find((i) => i.command === _ide)) {
    await error(true, false, `'${_ide}' not supported.`);
  }

  const git = await lookpath("git");
  let aftman = await getAftman();

  const packageManagers = (
    await Promise.all(
      config.supportedPackageManagers.map(function ({ name, command }) {
        return new Promise(async function (resolve) {
          const path = await lookpath(command);
          if (path) return resolve({ path, name });
          resolve();
        });
      }),
    )
  ).filter((p) => p !== undefined);

  const IDEs = (
    await Promise.all(
      config.supportedIDEs.map(function ({ name, command }) {
        return new Promise(async function (resolve) {
          const path = await lookpath(command);
          if (path) return resolve({ path, name });
          resolve();
        });
      }),
    )
  ).filter((p) => p !== undefined);

  if (
    pmanager &&
    !packageManagers.find(
      (n) => n.name?.toLowerCase() === pmanager.toLowerCase(),
    )
  ) {
    await error(true, false, `'${pmanager}' not available.`);
  }

  if (
    _ide &&
    !IDEs.find(
      (i) => path.parse(i.path)?.name?.toLowerCase() === _ide.toLowerCase(),
    )
  ) {
    await error(true, false, `'${_ide}' not available.`);
  }

  const _directory = pdirectory
    ? { directory: pdirectory }
    : await prompts(
        [
          {
            type: "text",
            name: "directory",
            message: "Project Directory",
            initial: "roblox-ts-script",
            validate: directoryValidation,
          },
        ],
        {
          onCancel: async () => await error(true, false),
        },
      );

  directory = path.resolve(_directory.directory);

  if (path.extname(directory) !== "") {
    await error(true, false, "Not a directory.");
  }

  let _directoryExists = await fileExists(directory);

  if (_directoryExists && !pdirectory) {
    if (!(await isDirectory(directory))) {
      await error(true, false, "Not a directory.");
    }

    const { deleteDirectory } = await prompts(
      [
        {
          type: "confirm",
          name: "deleteDirectory",
          message: "Directory already exists, delete it?",
          initial: false,
        },
      ],
      {
        onCancel: async () => await error(true, false),
      },
    );

    if (deleteDirectory) {
      await remove(directory, true);
      _directoryExists = false;
    }
  }

  const srcDirectory = path.resolve(directory, "src");
  const srcExists = await directoryExists(srcDirectory);

  const existingPackageJSON =
    _directoryExists &&
    (await readJSONFile(path.resolve(directory, "package.json")));

  const existingTSConfigJSON =
    _directoryExists &&
    (await readJSONFile(path.resolve(directory, "tsconfig.json")));

  const rojoName = "default.project.json";
  const projectJSONs = [
    {
      file: path.resolve(directory, "assets", "rojo", rojoName),
      studio: false,
    },
    {
      file: path.resolve(directory, "assets", "rojo", "studio", rojoName),
      studio: true,
    },
  ];

  if (_directoryExists) {
    await Promise.all(
      projectJSONs.map(async (p) => (p.existing = await readJSONFile(p.file))),
    );
  }

  const hasGitDirectory =
    _directoryExists &&
    (await directoryExists(path.resolve(directory, ".git")));

  let {
    package: _package,
    srcTemplate,
    name,
    author,
    version,
    initializeGit,
    packageManager,
    IDE,
  } = await prompts(
    [
      ...[
        __package === undefined
          ? {
              type: "confirm",
              name: "package",
              message: "Create Package",
              initial: false,
            }
          : {},
      ],
      ...[
        !(_template || srcExists)
          ? {
              type: "select",
              name: "srcTemplate",
              message: "Template",
              choices: config.templates.map((t) => ({
                title: t.name,
                value: t,
              })),
            }
          : {},
      ],
      ...[
        !(pname || existingPackageJSON?.name)
          ? {
              type: "text",
              name: "name",
              message: "Project Name",
              initial: "project",
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
              initial: "author",
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
        !(hasGitDirectory || !git || _git !== undefined)
          ? {
              type: "confirm",
              name: "initializeGit",
              message: "Initialize Git Repo",
              initial: false,
            }
          : {},
      ],
      ...[
        !(pmanager || packageManagers.length <= 1)
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
        !(_ide || IDEs.length <= 1)
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
      onCancel: async () => await error(true, true),
    },
  );

  _package = __package !== undefined ? __package : _package;

  srcTemplate =
    (_template &&
      config.templates.find(
        ({ directory }) => path.parse(directory).name === _template,
      )) ||
    srcTemplate;

  name = processArg(pname || existingPackageJSON?.name || name);
  author = processArg(pauthor || existingPackageJSON?.author || author);
  version = processArg(pversion || existingPackageJSON?.version || version);
  initializeGit =
    !hasGitDirectory && git && _git !== undefined ? _git : initializeGit;

  packageManager =
    packageManagers.length > 0 &&
    ((pmanager &&
      packageManagers.find(
        (p) => p.name?.toLowerCase() === pmanager.toLowerCase(),
      )) ||
      packageManager ||
      packageManagers[0]);

  IDE =
    IDEs.length > 0 &&
    ((_ide &&
      IDEs.find(
        (i) => path.parse(i.path)?.name?.toLowerCase() === _ide.toLowerCase(),
      )) ||
      IDE ||
      IDEs[0]);

  const { openInIDE } =
    openide === undefined && IDE
      ? await prompts(
          [
            {
              type: "confirm",
              name: "openInIDE",
              message: "Open in IDE?",
              initial: "true",
            },
          ],
          {
            onCancel: async () => await error(true, true),
          },
        )
      : { openInIDE: false };

  const actionDirectories = [
    path.resolve(directory, ".github"),
    path.resolve(directory, ".gitea"),
  ];

  const actionDirectory = (
    await Promise.all(actionDirectories.map(directoryExists))
  ).includes(true);

  if (!_package && !actionDirectory) {
    config.gitFiles.push(path.resolve(template, ".github"));
  } else if (_package) {
    await Promise.all(actionDirectories.map((d) => remove(d, true)));
  }

  if (initializeGit) {
    const nameArgs = ["config", "--global", "user.name"];
    const emailArgs = ["config", "--global", "user.email"];

    const { output: name } = await executeCommand(git, nameArgs);
    const { output: email } = await executeCommand(git, emailArgs);

    if (!name) {
      warn("Name not set for 'git'.");

      const { newName } = await prompts(
        [
          {
            type: "text",
            name: "newName",
            message: "Git Name",
            initial: "John Doe",
          },
        ],
        {
          onCancel: async () => await error(true, true),
        },
      );

      if (
        !newName ||
        !(await executeCommand(git, [...nameArgs, newName])).success
      ) {
        await error(true, true, "Failed to set git name.");
      }
    }

    if (!email) {
      warn("Email not set for 'git'.");

      const { newEmail } = await prompts(
        [
          {
            type: "text",
            name: "newEmail",
            message: "Git Email",
            initial: "john.doe@gmail.com",
          },
        ],
        {
          onCancel: async () => await error(true, true),
        },
      );

      if (
        !newEmail ||
        !(await executeCommand(git, [...emailArgs, newEmail])).success
      ) {
        await error(true, true, "Failed to set git email.");
      }
    }
  }

  if (!_directoryExists) {
    info(`Creating '${path.basename(directory)}'.`);
    await fs.mkdir(directory, { recursive: true });
    createdDirectory = true;
  }

  info(`Moving files to '${path.basename(directory)}'.`);

  await Promise.all([
    ...config.files.map((f) => copy(f, directory)),
    ...(hasGitDirectory || initializeGit
      ? config.gitFiles.map((f) => copy(f, directory))
      : []),
  ]);

  if (srcTemplate) {
    info(`Moving template files to '${path.basename(directory)}'.`);

    if (srcExists) {
      await remove(srcDirectory, true);
    }

    const newDirectory = await copy(srcTemplate.directory, directory);
    await fs.rename(newDirectory, srcDirectory);
  }

  info("Modifying 'package.json' values.");

  const packageJSONPath = path.resolve(directory, "package.json");
  let packageJSON = await readJSONFile(packageJSONPath);

  if (!packageJSON) {
    await error(true, true, "File 'package.json' doesn't exist.");
  }

  packageJSON.name =
    !name.startsWith("@") && _package ? `@${author}/${name}` : name;
  packageJSON.author = author;
  packageJSON.version = version;

  if (_package) {
    packageJSON.main = "out/init.luau";
    packageJSON.types = "out/index.d.ts";
  }

  if (srcTemplate?.dependencies) {
    packageJSON.dependencies = {
      ...(packageJSON.dependencies || {}),
      ...srcTemplate.dependencies,
    };
  }

  if (existingPackageJSON) {
    info("Preserving previous 'package.json' values.");
  }

  packageJSON = preserveObject(
    packageJSON,
    existingPackageJSON || packageJSON,
    config.packageJSON,
  );

  if (!_package) {
    packageJSON.main = undefined;
    packageJSON.types = undefined;
  }

  if (packageJSON.scripts) {
    if (_package) {
      packageJSON.scripts.build += ` --package`;
      packageJSON.scripts.prepublishOnly += ` --package`;
      packageJSON.scripts.dev += ` --package`;
      packageJSON.scripts["dev-sync"] = undefined;
    }

    if (_package || !(hasGitDirectory || initializeGit)) {
      packageJSON.scripts.release = undefined;
    }
  }

  await writeJSONFile(packageJSONPath, packageJSON);

  const tsConfigJSONPath = path.resolve(directory, "tsconfig.json");
  let tsConfigJSON = await readJSONFile(tsConfigJSONPath);

  if (!tsConfigJSON) {
    await error(true, true, "File 'tsconfig.json' doesn't exist.");
  }

  if (tsConfigJSON.compilerOptions && _package) {
    info("Modifying 'tsconfig.json' values.");
    tsConfigJSON.compilerOptions.declaration = true;
  }

  if (existingTSConfigJSON) {
    info("Preserving previous 'tsconfig.json' values.");
  }

  tsConfigJSON = preserveObject(
    tsConfigJSON,
    existingTSConfigJSON || tsConfigJSON,
    config.tsConfigJSON,
  );

  if (tsConfigJSON.compilerOptions && !_package) {
    tsConfigJSON.compilerOptions.declaration = undefined;
  }

  await writeJSONFile(tsConfigJSONPath, tsConfigJSON);

  await Promise.all(
    projectJSONs.map(async function ({ file, studio, existing }) {
      const _path = `assets/rojo${studio ? "/studio" : ""}/${rojoName}`;
      info(`Modifying '${_path}' values.`);

      let projectJSON = await readJSONFile(file);

      if (!projectJSON) {
        await error(true, true, `File '${_path}' doesn't exist.`);
      }

      projectJSON.name = pname || existing?.name || name;

      if (existing) {
        info(`Preserving previous '${_path}' values.`);
      }

      projectJSON = preserveObject(
        projectJSON,
        existing || projectJSON,
        config.rojoJSON,
      );

      if (!studio && projectJSON.tree?.include && _package) {
        projectJSON.tree.include = undefined;
      }

      await writeJSONFile(file, projectJSON);
    }),
  );

  if (IDE || initializeGit) {
    await Promise.all(config.vsCodeFiles.map((f) => copy(f, directory)));
  }

  const launchJSONPath = path.resolve(directory, ".vscode", "launch.json");
  const launchJSON = await readJSONFile(launchJSONPath);

  if (launchJSON?.configurations) {
    info("Modifying '.vscode/launch.json' values.");

    launchJSON.configurations = launchJSON.configurations.filter(
      function (configuration) {
        const args = configuration?.runtimeArgs;

        if (packageManager?.name) {
          configuration.runtimeExecutable = packageManager.name.toLowerCase();
        }

        if (args && _package) {
          configuration.runtimeArgs = [...(args || []), "--package"];
          return !args.includes("dev-sync");
        }

        return true;
      },
    );

    await writeJSONFile(launchJSONPath, launchJSON);
  }

  if (initializeGit) {
    info("Initializing git repository.");

    const commands = [
      await executeCommand(git, ["init"], directory),
      await executeCommand(git, ["add", "."], directory),
      await executeCommand(
        git,
        ["commit", "-m", "\u{1F680} Initialize Repository"],
        directory,
      ),
      await executeCommand(git, ["branch", "-M", "main"], directory),
      await executeCommand(git, ["branch", "release"], directory),
    ];

    if (commands.some(({ success }) => !success)) {
      await error(true, true, "Failed to initialize git repository.");
    }
  }

  if (!aftman) {
    warn("'aftman' not found, attempting to install.");
    await installAftman(temporaryDirectory);
    aftman = await getAftman();

    if (!aftman) {
      await error(
        true,
        true,
        "Failed to install 'aftman': https://github.com/LPGhatguy/aftman/releases/latest",
      );
    }
  }

  info("Installing dependencies using 'aftman'.");
  await executeCommand(aftman, ["install", "--no-trust-check"], directory);

  const rojo = await getAftman("rojo");

  if (!rojo) {
    await error(true, true, "'rojo' not found.");
  }

  info("Installing Rojo plugin for Roblox Studio.");

  if (!(await executeCommand(rojo, ["plugin", "install"], directory))) {
    await error(false, false, "Failed to install Rojo plugin.");
  }

  if (packageManager) {
    info(`Installing dependencies using '${packageManager.name}'.`);

    if (
      !(
        await executeCommand(
          packageManager.path,
          ["install", "--silent"],
          directory,
        )
      ).success
    ) {
      await error(
        true,
        true,
        `Failed to install dependencies using '${packageManager.name}'.`,
      );
    }

    info(`Building project using '${packageManager.name}'.`);

    if (
      !(await executeCommand(packageManager.path, ["run", "build"], directory))
        .success
    ) {
      await error(
        true,
        true,
        `Failed to build project using '${packageManager.name}'.`,
      );
    }
  }

  if (IDE && (openide || openInIDE)) {
    info(`Opening project in '${IDE.name}'.`);

    if (
      !(
        await executeCommand(
          IDE.path,
          [".", ...(srcTemplate ? [srcTemplate.entrypoint(directory)] : [])],
          directory,
        )
      ).success
    ) {
      await error(false, false, `Failed to open project in '${IDE.name}'.`);
    }
  }

  success(`Created '${name}': ${directory}`);
}

main();
