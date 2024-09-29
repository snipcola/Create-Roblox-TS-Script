#!/usr/bin/env node
const os = require("os");
const fs = require("fs/promises");

const path = require("path");
const { randomUUID } = require("crypto");

const { Readable } = require("stream");
const { finished } = require("stream/promises");

const process = require("process");
const { spawn } = require("child_process");

const prompts = require("prompts");
const yargs = require("yargs");

const { lookpath } = require("lookpath");
const { yellow, green, blue, red } = require("colorette");

const unzipper = require("unzipper");

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
    describe: "Package Manager",
    type: "string",
  })
  .option("ide", {
    alias: "i",
    describe: "IDE",
    type: "string",
  })
  .alias("h", "help")
  .describe("help", "Show Commands")
  .alias("v", "version")
  .describe("version", "Show Version")
  .recommendCommands()
  .strict()
  .wrap(yargs.terminalWidth())
  .parseSync();

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
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
        continue;
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
    if (file) await fs.rm(file, { force: true });
    if (folder) await fs.rm(folder, { force: true, recursive: true });
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

async function getAftman() {
  const directory = path.resolve(os.homedir(), ".aftman", "bin");
  return await lookpath("aftman", { include: [directory] });
}

async function main() {
  const { default: temporaryDirectory } = await import("temp-dir");

  const root = path.resolve(__dirname, "..");
  const template = path.resolve(root, "template");
  const config = {
    files: [
      path.resolve(template, "assets"),
      path.resolve(template, ".eslintrc"),
      path.resolve(template, ".prettierrc"),
      path.resolve(template, "aftman.toml"),
      path.resolve(template, "package.json"),
      path.resolve(template, "tsconfig.json"),
    ],
    optionalFiles: [path.resolve(template, "src")],
    gitFiles: [
      path.resolve(template, "_gitignore"),
      path.resolve(template, ".github"),
    ],
    packageJSON: {
      keys: [
        "name",
        "author",
        "version",
        "description",
        "keywords",
        "license",
        "repository",
        "type",
        "main",
        "bin",
        "files",
        "private",
        "scripts",
        "dependencies",
        "devDependencies",
        "optionalDependencies",
        "peerDependencies",
        "engines",
        "config",
      ],
      force: ["type", "scripts", "devDependencies"],
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
        "tsBuildInfoFile",
      ],
    },
    rojoJSON: {
      keys: ["name", "globIgnorePaths", "tree"],
      force: ["globIgnorePaths", "tree"],
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
        name: "VSCode",
        command: "code",
      },
      {
        name: "VSCodium",
        command: "codium",
      },
    ],
  };

  function error(...args) {
    console.error(red(...args));
    process.exit(1);
  }

  if (
    pmanager &&
    !config.supportedPackageManagers.find((p) => p.command === pmanager)
  ) {
    error(`\u2716 '${pmanager}' not supported.`);
  }

  if (_ide && !config.supportedIDEs.find((i) => i.command === _ide)) {
    error(`\u2716 '${_ide}' not supported.`);
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
    error(`\u2716 '${pmanager}' not available.`);
  }

  if (
    _ide &&
    !IDEs.find(
      (i) => path.basename(i.path)?.toLowerCase() === _ide.toLowerCase(),
    )
  ) {
    error(`\u2716 '${_ide}' not available.`);
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
    error("\u2716 Not a directory.");
  }

  let directoryExists = await fileExists(directory);

  if (directoryExists && !pdirectory) {
    if (!(await fs.stat(directory)).isDirectory()) {
      error("\u2716 Not a directory.");
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
        onCancel: function () {
          process.exit(1);
        },
      },
    );

    if (deleteDirectory) {
      await fs.rm(directory, { force: true, recursive: true });
      directoryExists = false;
    }
  }

  const existingPackageJSON =
    directoryExists &&
    (await readJSONFile(path.resolve(directory, "package.json")));

  const existingTSConfigJSON =
    directoryExists &&
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

  if (directoryExists) {
    await Promise.all(
      projectJSONs.map(async (p) => (p.existing = await readJSONFile(p.file))),
    );
  }

  const hasGitDirectory =
    directoryExists &&
    (await fileExists(path.resolve(directory, ".git"))) &&
    (await fs.stat(path.resolve(directory, ".git"))).isDirectory();

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
        console.error(red(`\u2716 ${validation}`));
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

  if (initializeGit) {
    const nameArgs = ["config", "--global", "user.name"];
    const emailArgs = ["config", "--global", "user.email"];

    const { output: name } = await executeCommand(git, nameArgs);
    const { output: email } = await executeCommand(git, emailArgs);

    if (!name) {
      console.log(yellow("- Name not set for 'git'."));

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
          onCancel: function () {
            process.exit(1);
          },
        },
      );

      if (
        !newName ||
        !(await executeCommand(git, [...nameArgs, newName])).success
      ) {
        error("\u2716 Failed to initialize git repository.");
      }
    }

    if (!email) {
      console.log(yellow("- Email not set for 'git'."));

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
          onCancel: function () {
            process.exit(1);
          },
        },
      );

      if (
        !newEmail ||
        !(await executeCommand(git, [...emailArgs, newEmail])).success
      ) {
        error("\u2716 Failed to initialize git repository.");
      }
    }
  }

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
        (i) => path.basename(i.path)?.toLowerCase() === _ide.toLowerCase(),
      )) ||
      IDE ||
      IDEs[0]);

  if (!directoryExists) {
    console.log(blue(`- Creating '${path.basename(directory)}'.`));
    await fs.mkdir(directory, { recursive: true });
  }

  console.log(blue(`- Moving files to '${path.basename(directory)}'.`));

  async function copy(file, folder, force = true) {
    const name = path.basename(file);
    const newFile = path.resolve(
      folder,
      name.startsWith("_") ? name.replace("_", ".") : name,
    );

    if (force || !(await fileExists(newFile))) {
      await fs.cp(file, newFile, { recursive: true, force: true });
    }
  }

  await Promise.all([
    ...config.files.map((f) => copy(f, directory)),
    ...config.optionalFiles.map((f) => copy(f, directory, false)),
    ...(hasGitDirectory || initializeGit
      ? config.gitFiles.map((f) => copy(f, directory))
      : []),
  ]);

  console.log(blue("- Modifying 'package.json' values."));

  const packageJSONPath = path.resolve(directory, "package.json");
  let packageJSON = await readJSONFile(packageJSONPath);

  if (!packageJSON) {
    error("\u2716 File 'package.json' doesn't exist.");
  }

  packageJSON.name = name.toLowerCase();
  packageJSON.author = author;
  packageJSON.version = version;

  if (existingPackageJSON) {
    console.log(blue("- Preserving previous 'package.json' values."));
    packageJSON = preserveObject(
      packageJSON,
      existingPackageJSON,
      config.packageJSON,
    );
  }

  await writeJSONFile(packageJSONPath, packageJSON);

  if (existingTSConfigJSON) {
    const tsConfigJSONPath = path.resolve(directory, "tsconfig.json");
    let tsConfigJSON = await readJSONFile(tsConfigJSONPath);

    if (!tsConfigJSON) {
      error("\u2716 File 'tsconfig.json' doesn't exist.");
    }

    console.log(blue("- Preserving previous 'tsconfig.json' values."));
    tsConfigJSON = preserveObject(
      tsConfigJSON,
      existingTSConfigJSON,
      config.tsConfigJSON,
    );

    await writeJSONFile(tsConfigJSONPath, tsConfigJSON);
  }

  await Promise.all(
    projectJSONs.map(async function ({ file, studio, existing }) {
      const _path = `assets/rojo${studio ? "/studio" : ""}/${rojoName}`;
      console.log(blue(`- Modifying '${_path}' values.`));

      let projectJSON = await readJSONFile(file);

      if (!projectJSON) {
        error(`\u2716 File '${_path}' doesn't exist.`);
      }

      projectJSON.name = pname || existing?.name || name;

      if (existing) {
        console.log(blue(`- Preserving previous '${_path}' values.`));
        projectJSON = preserveObject(projectJSON, existing, config.rojoJSON);
      }

      await writeJSONFile(file, projectJSON);
    }),
  );

  if (initializeGit) {
    console.log(blue("- Initializing git repository."));

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
      error("\u2716 Failed to initialize git repository.");
    }
  }

  if (!aftman) {
    console.log(yellow("- 'aftman' not found, attempting to install."));
    await installAftman(temporaryDirectory);
    aftman = await getAftman();

    if (!aftman) {
      error(
        "\u2716 Failed to install 'aftman': https://github.com/LPGhatguy/aftman/releases/latest",
      );
    }
  }

  console.log(blue(`- Installing dependencies using 'aftman'.`));
  await executeCommand(aftman, ["install", "--no-trust-check"], directory);

  console.log(blue(`- Installing Rojo plugin for Roblox Studio.`));

  if (!(await executeCommand("rojo", ["plugin", "install"]))) {
    console.error(red("\u2716 Failed to install Rojo plugin."));
  }

  if (packageManager) {
    console.log(
      blue(`- Installing dependencies using '${packageManager.name}'.`),
    );

    if (
      !(
        await executeCommand(
          packageManager.path,
          ["install", "--silent"],
          directory,
        )
      ).success
    ) {
      error(
        `"\u2716 Failed to install dependencies using '${packageManager.name}'.`,
      );
    }

    console.log(blue(`- Building project using '${packageManager.name}'.`));

    if (
      !(await executeCommand(packageManager.path, ["run", "build"], directory))
        .success
    ) {
      error(`\u2716 Failed to build project using '${packageManager.name}'.`);
    }
  }

  if (IDE) {
    console.log(blue(`- Opening project in '${IDE.name}'.`));

    if (
      !(await executeCommand(IDE.path, [".", "src/index.ts"], directory))
        .success
    ) {
      console.error(red(`\u2716 Failed to open project in '${IDE.name}'.`));
    }
  }

  console.log(green(`\u2714 Created '${name}': ${directory}`));
}

main();
