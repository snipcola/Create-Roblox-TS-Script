## Create Roblox-TS Script

Builds & bundles TypeScript source files into a Lua script, which you can use on Roblox.

## Prerequisites

Make sure the following are installed:

- [node](https://nodejs.org/en/download)
- [pnpm](https://pnpm.io/installation#using-a-standalone-script) (optional)

The following are automatically installed; if it fails, install manually:

- [aftman](https://github.com/LPGhatguy/aftman/releases/latest)

## Instructions

1. **Create Project**

   Run the following in a terminal, and follow the instructions:

   ```
   (p)npm create roblox-ts-script
   ```

2. **Develop**

   Once the script has created your project, open it in an IDE, preferably [VSCode](https://code.visualstudio.com).

   In the VSCode Terminal, you can execute `pnpm dev / npm run dev`. Now you can edit files in `src`, and it will compile to `out` when you save.

3. **Build**

   If you'd like to manually start the build process, instead of running the dev script, run `npm run build / pnpm build` which will build once.

4. **Sync** (optional)

   If you want to test your script on Roblox Studio, run the following once: `rojo plugin install`.

   Then, simply run `pnpm dev-sync / npm run dev-sync` and connect on Roblox Studio (look for Rojo in the Plugins section).

5. **Deploy** (optional)

   If you chose to initialize a git repository, and have it connected to a remote GitHub repo, you can run `pnpm release / npm run release` to create a release with the script attached.

   Only do this once you've made changes and pushed them to the `main` branch. Otherwise, it won't do anything.

6. **Packages** (optional)

   You can install roblox-ts packages like usual, through your package manager. An example of a package is `@rbxts/vide`.

   If the package is not under the `@rbxts` scope, use `pnpm scope / npm run scope` to add the scope of the package.

   Here's an example of a package being used:

   ```ts
   import greet from "@snipcola/greet-test";
   greet("world");
   ```

## Credits

- [roblox-ts](https://github.com/roblox-ts/roblox-ts), compiler
- [rojo](https://github.com/rojo-rbx/rojo), synchronization
- [tape](https://github.com/Belkworks/tape), bundler (heavily modified)
- [darklua](https://github.com/seaofvoices/darklua), minifier
- [rbxts-hax](https://github.com/richie0866/rbxts-hax), unc types
