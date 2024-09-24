## Create Roblox-TS Script

Builds & bundles TypeScript source files into a Lua script, which you can use on Roblox.

## Prerequisites

Make sure the following are installed:

- [node](https://nodejs.org/en/download)
- [pnpm](https://pnpm.io/installation#using-a-standalone-script) (optional)

It's recommended you also install the following VSCode extensions:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Roblox-TS](https://marketplace.visualstudio.com/items?itemName=roblox-ts.vscode-roblox-ts)

## Instructions

If you installed `pnpm`, use that instead of `npm` for the following steps.

1. **Create Project**

   Run the following in a terminal, and follow the instructions:

   ```
   (p)npm create roblox-ts-script
   ```

2. **Develop**

   Once the script has created your project, open it in an IDE, preferably [VSCode](https://code.visualstudio.com).

   In the VSCode Terminal, you can execute `npm run dev / pnpm dev`. Now you can edit files in `src`, and it will compile to `out` when you save.

3. **Build**

   If you'd like to manually start the build process, instead of running the dev script, run `npm run build / pnpm build` which will build once.

## Credits

- [roblox-ts](https://github.com/roblox-ts/roblox-ts), compiler
- [tape](https://github.com/Belkworks/tape), bundler
- [darklua](https://github.com/seaofvoices/darklua), minifier
- [rbxts-hax](https://github.com/richie0866/rbxts-hax), unc types
