// src/index.ts
import inquirer3 from "inquirer";
import chalk5 from "chalk";

// src/constants.ts
var PLATFORMS = {
  "remix": {
    name: "Remix",
    templates: {
      "remix-tutorial": {
        name: "Tutorial",
        repo: "8an3/remixv2/templates/remix-tutorial",
        description: "Great for learning Remix"
      },
      "remix": {
        name: "Default (TypeScript)",
        repo: "8an3/remixv2/templates/remix",
        description: "Standard Remix template"
      },
      "remix-javascript": {
        name: "JavaScript",
        repo: "8an3/remixv2/templates/remix-javascript",
        description: "Remix w/ plain JavaScript"
      },
      "express": {
        name: "Express Server",
        repo: "8an3/remixv2/templates/express",
        description: "Configure w/ Express.js"
      },
      "cloudflare-workers": {
        name: "Cloudflare Workers",
        repo: "8an3/remixv2/templates/cloudflare-workers",
        description: "Optimized Remix app"
      },
      "cloudflare": {
        name: "Cloudflare Pages",
        repo: "8an3/remixv2/templates/cloudflare",
        description: "Optimized for Cloudflare"
      },
      "spa": {
        name: "Single Page App",
        repo: "8an3/remixv2/templates/spa",
        description: "Remix in SPA mode"
      },
      "classic-remix-compiler-remix": {
        name: "Classic Remix Compiler",
        repo: "8an3/remixv2/templates/classic-remix-compiler/remix",
        description: "Original Remix compiler setup"
      },
      "classic-remix-compiler-arc": {
        name: "Classic Remix Compiler Arc",
        repo: "8an3/remixv2/templates/classic-remix-compiler/arc",
        description: "Original Remix compiler setup"
      },
      "classic-remix-compiler-cloudflare-pages": {
        name: "Classic Remix Compiler Cloudflare Pages",
        repo: "8an3/remixv2/templates/classic-remix-compiler/cloudflare-pages",
        description: "Original Remix compiler setup"
      },
      "classic-remix-compiler-cloudflare-workers": {
        name: "Classic Remix Compiler Cloudflare Workers",
        repo: "8an3/remixv2/templates/classic-remix-compiler/cloudflare-workers",
        description: "Original Remix compiler setup"
      },
      "classic-remix-compiler-deno": {
        name: "Classic Remix Compiler Deno",
        repo: "8an3/remixv2/templates/classic-remix-compiler/deno",
        description: "Original Remix compiler setup"
      },
      "classic-remix-compiler-fly": {
        name: "Classic Remix Compiler Fly",
        repo: "8an3/remixv2/templates/classic-remix-compiler/fly",
        description: "Original Remix compiler setup"
      },
      "classic-remix-compiler-remix-javascript": {
        name: "Classic Remix Compiler Remix Javascript",
        repo: "8an3/remixv2/templates/classic-remix-compiler/remix-javascript",
        description: "Original Remix compiler setup"
      }
    }
  },
  "cra": {
    name: "Create React App",
    repo: "facebook/create-react-app",
    description: "Standard React application"
  },
  "vite-react": {
    name: "Vite + React",
    repo: "vitejs/vite/packages/create-vite/template-react-ts",
    description: "Fast React development with Vite"
  },
  "nextjs": {
    name: "Next.js",
    repo: "vercel/next.js/examples/blog-starter",
    description: "The React Framework for Production"
  },
  "vue": {
    name: "Vue",
    repo: "vuejs/create-vue",
    description: "Progressive JavaScript Framework"
  },
  "svelte": {
    name: "SvelteKit",
    repo: "sveltejs/kit",
    description: "Cybernetically enhanced web apps"
  },
  "astro": {
    name: "Astro",
    repo: "withastro/astro/examples/basics",
    description: "Build faster websites"
  },
  "solid": {
    name: "SolidStart",
    repo: "solidjs/solid-start",
    description: "Fine-grained reactive JavaScript"
  },
  "qwik": {
    name: "Qwik",
    repo: "BuilderIO/qwik",
    description: "Instant-loading web apps"
  }
};
var PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"];
var TEMP_DIR_PREFIX = "bifrost-temp-";

// src/creator.ts
import fs5 from "fs-extra";
import path4 from "path";
import chalk2 from "chalk";
import ora2 from "ora";

// src/git.ts
import { execa } from "execa";
import fs from "fs-extra";
import path from "path";
import os from "os";
async function isGitInstalled() {
  try {
    await execa("git", ["--version"]);
    return true;
  } catch {
    return false;
  }
}
async function cloneRepository(owner, repo, targetDir) {
  const gitInstalled = await isGitInstalled();
  if (!gitInstalled) {
    throw new Error("Git is not installed. Please install Git and try again.");
  }
  const repoUrl = `https://github.com/${owner}/${repo}.git`;
  const tempDir = path.join(os.tmpdir(), `${TEMP_DIR_PREFIX}${Date.now()}`);
  try {
    await execa("git", ["clone", "--depth", "1", repoUrl, tempDir]);
    await fs.remove(path.join(tempDir, ".git"));
    await fs.copy(tempDir, targetDir, { overwrite: true });
    await fs.remove(tempDir);
  } catch (error) {
    await fs.remove(tempDir).catch(() => {
    });
    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("not exist")) {
        throw new Error(`Repository ${owner}/${repo} not found or inaccessible`);
      }
    }
    throw error;
  }
}
async function initializeGitRepo(projectDir) {
  try {
    await execa("git", ["init"], { cwd: projectDir });
    await execa("git", ["add", "."], { cwd: projectDir });
    await execa("git", ["commit", "-m", "Initial commit from create-bifrost"], { cwd: projectDir });
  } catch {
    return;
  }
}
async function pushToGitHub(projectDir) {
  try {
    const { stdout: remoteUrl } = await execa("git", ["remote", "get-url", "origin"], { cwd: projectDir });
    if (!remoteUrl) {
      throw new Error("No remote origin found");
    }
    await execa("git", ["push", "-u", "origin", "main"], { cwd: projectDir });
  } catch (error) {
    const mainExists = await execa("git", ["rev-parse", "--verify", "main"], { cwd: projectDir, reject: false });
    const masterExists = await execa("git", ["rev-parse", "--verify", "master"], { cwd: projectDir, reject: false });
    const branch = mainExists.exitCode === 0 ? "main" : masterExists.exitCode === 0 ? "master" : "main";
    try {
      await execa("git", ["push", "-u", "origin", branch], { cwd: projectDir });
    } catch {
      throw new Error("Failed to push to GitHub. Ensure you have a remote repository set up and proper permissions.");
    }
  }
}

// src/install.ts
import { execa as execa2 } from "execa";

// src/utilts.ts
import fs2 from "fs-extra";
import validateNpmPackageName from "validate-npm-package-name";
function toValidPackageName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/^[._]/, "").replace(/[^a-z0-9-~]+/g, "-");
}
function parseStackReference(template) {
  const parts = template.split("/");
  if (parts.length !== 2) {
    throw new Error("Stack must be in format: owner/repo");
  }
  return { owner: parts[0], repo: parts[1] };
}
async function directoryExists(dir) {
  try {
    const stats = await fs2.stat(dir);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
async function isDirectoryEmpty(dir) {
  const files = await fs2.readdir(dir);
  return files.length === 0;
}
function getPackageManagerCommand(pm, command) {
  const commands = {
    npm: { install: "npm install", run: "npm run" },
    pnpm: { install: "pnpm install", run: "pnpm" },
    yarn: { install: "yarn", run: "yarn" },
    bun: { install: "bun install", run: "bun" }
  };
  return commands[pm][command];
}
function detectPlatformFromStack(template) {
  const lowerStack = template.toLowerCase();
  if (lowerStack.includes("remix")) return "remix";
  if (lowerStack.includes("next")) return "nextjs";
  if (lowerStack.includes("vite")) return "vite";
  if (lowerStack.includes("vue")) return "vue";
  if (lowerStack.includes("svelte")) return "svelte";
  if (lowerStack.includes("astro")) return "astro";
  if (lowerStack.includes("solid")) return "solid";
  if (lowerStack.includes("qwik")) return "qwik";
  if (lowerStack.includes("react") || lowerStack.includes("cra")) return "react";
  return void 0;
}
function detectTagsFromStack(template) {
  const tags = [];
  const lowerStack = template.toLowerCase();
  if (lowerStack.includes("typescript") || lowerStack.includes("-ts")) tags.push("typescript");
  if (lowerStack.includes("javascript") || lowerStack.includes("-js")) tags.push("javascript");
  if (lowerStack.includes("tailwind")) tags.push("tailwind");
  if (lowerStack.includes("prisma")) tags.push("prisma");
  if (lowerStack.includes("postgres")) tags.push("postgresql");
  if (lowerStack.includes("sqlite")) tags.push("sqlite");
  if (lowerStack.includes("mongo")) tags.push("mongodb");
  if (lowerStack.includes("aws")) tags.push("aws");
  if (lowerStack.includes("cloudflare")) tags.push("cloudflare");
  if (lowerStack.includes("vercel")) tags.push("vercel");
  if (lowerStack.includes("react")) tags.push("react");
  return tags;
}

// src/install.ts
async function installDependencies(projectDir, packageManager) {
  const installCommand = getPackageManagerCommand(packageManager, "install");
  const [cmd, ...args] = installCommand.split(" ");
  await execa2(cmd, args, {
    cwd: projectDir,
    stdio: "inherit"
  });
}
async function runPostInstallScripts(projectDir, packageManager, scripts) {
  for (const script of scripts) {
    const runCommand = getPackageManagerCommand(packageManager, "run");
    const [cmd, ...baseArgs] = runCommand.split(" ");
    const args = [...baseArgs, script];
    try {
      await execa2(cmd, args, {
        cwd: projectDir,
        stdio: "inherit"
      });
    } catch (error) {
      console.warn(`Warning: Post-install script "${script}" failed`);
    }
  }
}

// src/plugin.ts
import fs3 from "fs-extra";
import path2 from "path";
import os2 from "os";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import { execa as execa3 } from "execa";
async function fetchPluginConfig(owner, repo) {
  const tempDir = path2.join(os2.tmpdir(), `${TEMP_DIR_PREFIX}plugin-${Date.now()}`);
  try {
    await cloneRepository(owner, repo, tempDir);
    const configPath = path2.join(tempDir, "plugin.bifrost");
    if (!await fs3.pathExists(configPath)) {
      throw new Error(`Plugin ${owner}/${repo} is missing plugin.bifrost configuration file`);
    }
    const config = await fs3.readJson(configPath);
    await fs3.remove(tempDir);
    return config;
  } catch (error) {
    await fs3.remove(tempDir).catch(() => {
    });
    throw error;
  }
}
async function installPluginLibraries(projectDir, packageManager, libraries) {
  if (libraries.length === 0) return;
  const installCommand = getPackageManagerCommand(packageManager, "install");
  const [cmd, ...baseArgs] = installCommand.split(" ");
  const args = [...baseArgs, ...libraries];
  await execa3(cmd, args, {
    cwd: projectDir,
    stdio: "inherit"
  });
}
async function promptForFileLocation(fileName, suggestedLocation) {
  const { location } = await inquirer.prompt([
    {
      type: "input",
      name: "location",
      message: `Location for ${chalk.cyan(fileName)}:`,
      default: suggestedLocation,
      validate: (value) => {
        if (!value) return "Location is required";
        return true;
      }
    }
  ]);
  if (!location) {
    throw new Error("Operation cancelled");
  }
  return location;
}
async function copyPluginFiles(projectDir, pluginTempDir, files) {
  for (const file of files) {
    const confirmedLocation = await promptForFileLocation(file.name, file.location);
    const sourcePath = path2.join(pluginTempDir, "files", file.name);
    const destPath = path2.join(projectDir, confirmedLocation);
    if (!await fs3.pathExists(sourcePath)) {
      console.warn(chalk.yellow(`Warning: File ${file.name} not found in plugin, skipping...`));
      continue;
    }
    await fs3.ensureDir(path2.dirname(destPath));
    await fs3.copy(sourcePath, destPath);
    console.log(chalk.green(`\u2713 Copied ${file.name} to ${confirmedLocation}`));
  }
}
async function installPlugin(projectDir, packageManager, pluginReference) {
  const { owner, repo } = parseStackReference(pluginReference);
  console.log();
  console.log(chalk.bold(`Installing plugin: ${chalk.cyan(pluginReference)}`));
  console.log();
  const configSpinner = ora("Fetching plugin configuration...").start();
  let pluginConfig;
  try {
    pluginConfig = await fetchPluginConfig(owner, repo);
    configSpinner.succeed(`Fetched configuration for ${chalk.cyan(pluginConfig.name)}`);
  } catch (error) {
    configSpinner.fail("Failed to fetch plugin configuration");
    throw error;
  }
  console.log(chalk.gray(`Description: ${pluginConfig.description}`));
  console.log(chalk.gray(`Platform: ${pluginConfig.platform}`));
  console.log(chalk.gray(`Tags: ${pluginConfig.tags.join(", ")}`));
  console.log();
  if (pluginConfig.libraries && pluginConfig.libraries.length > 0) {
    const libSpinner = ora("Installing plugin libraries...").start();
    try {
      await installPluginLibraries(projectDir, packageManager, pluginConfig.libraries);
      libSpinner.succeed("Installed plugin libraries");
    } catch (error) {
      libSpinner.fail("Failed to install plugin libraries");
      throw error;
    }
  }
  if (pluginConfig.files && pluginConfig.files.length > 0) {
    console.log();
    console.log(chalk.bold("Plugin files:"));
    console.log();
    const tempDir = path2.join(os2.tmpdir(), `${TEMP_DIR_PREFIX}plugin-${Date.now()}`);
    try {
      await cloneRepository(owner, repo, tempDir);
      await copyPluginFiles(projectDir, tempDir, pluginConfig.files);
      await fs3.remove(tempDir);
    } catch (error) {
      await fs3.remove(tempDir).catch(() => {
      });
      throw error;
    }
  }
  console.log();
  console.log(chalk.bold.green(`\u2713 Plugin ${pluginConfig.name} installed successfully!`));
  console.log();
}
async function installPlugins(projectDir, packageManager, plugins) {
  if (plugins.length === 0) return;
  console.log();
  console.log(chalk.bold(`Found ${plugins.length} plugin(s) to install`));
  for (const plugin of plugins) {
    try {
      await installPlugin(projectDir, packageManager, plugin);
    } catch (error) {
      console.error(chalk.red(`Failed to install plugin ${plugin}:`), error instanceof Error ? error.message : "Unknown error");
      console.log();
    }
  }
}

// src/packge-json.ts
import fs4 from "fs-extra";
import path3 from "path";
async function updatePackageJson(projectDir, projectName) {
  const packageJsonPath = path3.join(projectDir, "package.json");
  if (!await fs4.pathExists(packageJsonPath)) {
    const defaultPackageJson = {
      name: projectName,
      version: "0.0.1",
      private: true
    };
    await fs4.writeJson(packageJsonPath, defaultPackageJson, { spaces: 2 });
    return;
  }
  const packageJson = await fs4.readJson(packageJsonPath);
  packageJson.name = projectName;
  await fs4.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}
async function readStackConfig(projectDir) {
  const configPath = path3.join(projectDir, "config.bifrost");
  if (!await fs4.pathExists(configPath)) {
    return null;
  }
  return await fs4.readJson(configPath);
}
async function createBifrostConfig(projectDir, projectName, template, platform, tags, existingConfig) {
  const configPath = path3.join(projectDir, "config.bifrost");
  if (await fs4.pathExists(configPath)) {
    return;
  }
  const config = {
    name: projectName,
    description: existingConfig?.description || "",
    platform: platform || existingConfig?.platform || "unknown",
    github: template,
    tags: tags || existingConfig?.tags || [],
    postInstall: existingConfig?.postInstall || [],
    plugins: existingConfig?.plugins || []
  };
  await fs4.writeJson(configPath, config, { spaces: 2 });
}

// src/creator.ts
import { execSync } from "child_process";
async function installTailwind(absolutePath, packageManager, useNgin) {
  const spinner = ora2(`Installing Tailwind CSS with ${useNgin ? "preset ngin" : "base config"}...`).start();
  try {
    const installCmd = packageManager === "npm" ? "npm install -D tailwindcss postcss autoprefixer" : `${packageManager} add -D tailwindcss postcss autoprefixer`;
    execSync(installCmd, { cwd: absolutePath, stdio: "ignore" });
    execSync("npx tailwindcss init -p", { cwd: absolutePath, stdio: "ignore" });
    if (useNgin) {
      const tailwindConfig = `import type { Config } from 'tailwindcss';
import ngin from '@a5gard/ngin';

export default {
  presets: [ngin],
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
} satisfies Config;`;
      await fs5.writeFile(path4.join(absolutePath, "tailwind.config.ts"), tailwindConfig);
    }
    const appCssPath = path4.join(absolutePath, "app", "tailwind.css");
    const rootCssPath = path4.join(absolutePath, "app", "root.css");
    const cssPath = await fs5.pathExists(appCssPath) ? appCssPath : rootCssPath;
    const tailwindDirectives = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
    if (await fs5.pathExists(cssPath)) {
      const existingCss = await fs5.readFile(cssPath, "utf-8");
      if (!existingCss.includes("@tailwind")) {
        await fs5.writeFile(cssPath, tailwindDirectives + existingCss);
      }
    } else {
      await fs5.ensureDir(path4.dirname(cssPath));
      await fs5.writeFile(cssPath, tailwindDirectives);
    }
    spinner.succeed(`Installed Tailwind CSS with ${useNgin ? "preset ngin" : "base config"}`);
  } catch (error) {
    spinner.fail("Failed to install Tailwind CSS");
    throw error;
  }
}
async function installMidgardr(absolutePath, packageManager, withNgin) {
  const spinner = ora2("Installing MI\xD0GAR\xD0R UI components...").start();
  try {
    const command = withNgin ? "full-w-ngin" : "full-install";
    execSync(`bunx @a5gard/midgardr ${command}`, { cwd: absolutePath, stdio: "inherit" });
    spinner.succeed("Installed MI\xD0GAR\xD0R UI components");
  } catch (error) {
    spinner.fail("Failed to install MI\xD0GAR\xD0R UI components");
    throw error;
  }
}
async function installBaldr(absolutePath, packageManager) {
  const spinner = ora2("Installing @a5gard/baldr icons...").start();
  try {
    const installCmd = packageManager === "npm" ? "npm install @a5gard/baldr" : `${packageManager} add @a5gard/baldr`;
    execSync(installCmd, { cwd: absolutePath, stdio: "ignore" });
    spinner.succeed("Installed @a5gard/baldr icons");
  } catch (error) {
    spinner.fail("Failed to install @a5gard/baldr icons");
    throw error;
  }
}
async function createProject(context) {
  const {
    projectName,
    template,
    packageManager,
    install,
    gitPush,
    tailwindBase,
    tailwindNgin,
    midgardr,
    baldr
  } = context;
  const absolutePath = path4.resolve(projectName);
  console.log();
  console.log(chalk2.bold("Creating your Bifrost project..."));
  console.log();
  if (await directoryExists(absolutePath)) {
    const isEmpty = await isDirectoryEmpty(absolutePath);
    if (!isEmpty) {
      throw new Error(`Directory ${projectName} already exists and is not empty`);
    }
  } else {
    await fs5.ensureDir(absolutePath);
  }
  const { owner, repo } = parseStackReference(template);
  const cloneSpinner = ora2(`Cloning ${chalk2.cyan(template)}...`).start();
  try {
    await cloneRepository(owner, repo, absolutePath);
    cloneSpinner.succeed(`Cloned ${chalk2.cyan(template)}`);
  } catch (error) {
    cloneSpinner.fail(`Failed to clone ${chalk2.cyan(template)}`);
    throw error;
  }
  const updateSpinner = ora2("Updating package.json...").start();
  try {
    await updatePackageJson(absolutePath, projectName);
    updateSpinner.succeed("Updated package.json");
  } catch (error) {
    updateSpinner.fail("Failed to update package.json");
    throw error;
  }
  const stackConfig = await readStackConfig(absolutePath);
  if (install) {
    const installSpinner = ora2(`Installing dependencies with ${chalk2.cyan(packageManager)}...`).start();
    try {
      await installDependencies(absolutePath, packageManager);
      installSpinner.succeed(`Installed dependencies with ${chalk2.cyan(packageManager)}`);
    } catch (error) {
      installSpinner.fail("Failed to install dependencies");
      throw error;
    }
    if (midgardr) {
      await installMidgardr(absolutePath, packageManager, tailwindNgin || false);
    } else {
      if (tailwindBase) {
        await installTailwind(absolutePath, packageManager, false);
      }
      if (tailwindNgin) {
        await installTailwind(absolutePath, packageManager, true);
      }
    }
    if (baldr) {
      await installBaldr(absolutePath, packageManager);
    }
    if (stackConfig?.postInstall && Array.isArray(stackConfig.postInstall)) {
      const postInstallSpinner = ora2("Running post-install scripts...").start();
      try {
        await runPostInstallScripts(absolutePath, packageManager, stackConfig.postInstall);
        postInstallSpinner.succeed("Completed post-install scripts");
      } catch (error) {
        postInstallSpinner.warn("Some post-install scripts failed");
      }
    }
    if (stackConfig?.plugins && Array.isArray(stackConfig.plugins) && stackConfig.plugins.length > 0) {
      try {
        await installPlugins(absolutePath, packageManager, stackConfig.plugins);
      } catch (error) {
        console.error(chalk2.red("Some plugins failed to install"));
      }
    }
  }
  const gitSpinner = ora2("Initializing git repository...").start();
  try {
    await initializeGitRepo(absolutePath);
    gitSpinner.succeed("Initialized git repository");
  } catch {
    gitSpinner.info("Skipped git initialization");
  }
  const configSpinner = ora2("Creating config.bifrost...").start();
  try {
    const platform = detectPlatformFromStack(template);
    const tags = detectTagsFromStack(template);
    await createBifrostConfig(absolutePath, projectName, template, platform, tags, stackConfig);
    configSpinner.succeed("Created config.bifrost");
  } catch (error) {
    configSpinner.warn("Failed to create config.bifrost");
  }
  if (gitPush) {
    const pushSpinner = ora2("Pushing to GitHub...").start();
    try {
      await pushToGitHub(absolutePath);
      pushSpinner.succeed("Pushed to GitHub");
    } catch (error) {
      pushSpinner.warn("Failed to push to GitHub - you may need to set up a remote repository first");
    }
  }
  console.log();
  console.log(chalk2.bold.green("\u2713 Project created successfully!"));
  console.log();
  console.log();
  if (!install) {
    console.log(chalk2.bold("Next steps:"));
    console.log(`  ${chalk2.cyan("cd")} ${projectName}`);
    console.log(`  ${chalk2.cyan(`${packageManager} install`)}`);
    console.log(`  ${chalk2.cyan(`${packageManager} ${packageManager === "npm" ? "run " : ""}dev`)}`);
  } else {
    console.log(chalk2.bold.green("changing directories and starting the first dev server..."));
    execSync(`cd ${projectName}`, { cwd: absolutePath, stdio: "inherit" });
    execSync(`${packageManager} ${packageManager === "npm" ? "run " : ""}dev`, { cwd: absolutePath, stdio: "inherit" });
  }
  console.log();
}

// src/wizard.ts
import fs6 from "fs-extra";
import path5 from "path";
import chalk3 from "chalk";
import inquirer2 from "inquirer";
import { execSync as execSync2 } from "child_process";
function drawBox(title, content, footer) {
  const width = 117;
  const horizontalLine = "\u2500".repeat(width - 2);
  console.log(`\u256D${horizontalLine}\u256E`);
  console.log(`\u2502${title.padStart(Math.floor((width - 2 + title.length) / 2)).padEnd(width - 2)}\u2502`);
  console.log(`\u251C${horizontalLine}\u2524`);
  content.forEach((line) => {
    console.log(`\u2502 ${line.padEnd(width - 4)} \u2502`);
  });
  if (footer) {
    console.log(`\u251C${horizontalLine}\u2524`);
    console.log(`\u2502${footer.padStart(Math.floor((width - 2 + footer.length) / 2)).padEnd(width - 2)}\u2502`);
  }
  console.log(`\u2570${horizontalLine}\u256F`);
}
async function detectGitHubRepo() {
  try {
    const remote = execSync2("git config --get remote.origin.url", { encoding: "utf-8" }).trim();
    const match = remote.match(/github\.com[:/](.+?)(?:\.git)?$/);
    if (match) {
      return match[1];
    }
  } catch {
  }
  try {
    const packageJsonPath = path5.join(process.cwd(), "package.json");
    if (await fs6.pathExists(packageJsonPath)) {
      const packageJson = await fs6.readJson(packageJsonPath);
      if (packageJson.repository) {
        const repoUrl = typeof packageJson.repository === "string" ? packageJson.repository : packageJson.repository.url;
        const match = repoUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
        if (match) {
          return match[1];
        }
      }
    }
  } catch {
  }
  return null;
}
async function promptForGitHubRepo() {
  drawBox(
    "GITHUB REPOSITORY REQUIRED",
    [
      chalk3.yellow("\u26A0 No GitHub repository detected"),
      "",
      "Please push your project and create a public repository before continuing."
    ]
  );
  const { hasRepo } = await inquirer2.prompt([
    {
      type: "confirm",
      name: "hasRepo",
      message: "Have you created a public GitHub repository?",
      default: false
    }
  ]);
  if (!hasRepo) {
    console.log(chalk3.red("\nPlease create a public GitHub repository first"));
    process.exit(1);
  }
  const { repo } = await inquirer2.prompt([
    {
      type: "input",
      name: "repo",
      message: "Enter your GitHub repository (owner/repo):",
      validate: (value) => {
        const pattern = /^[\w-]+\/[\w-]+$/;
        return pattern.test(value) || "Invalid format. Use: owner/repo";
      }
    }
  ]);
  if (!repo) {
    console.log(chalk3.red("\nRepository is required"));
    process.exit(1);
  }
  return repo;
}
async function runConfigWizard() {
  drawBox(
    "CONFIG.BIFROST WIZARD",
    [
      "This wizard will guide you through creating a config.bifrost file for your template.",
      "",
      "This configuration enables your template to be shared with the community."
    ]
  );
  const configPath = path5.join(process.cwd(), "config.bifrost");
  if (await fs6.pathExists(configPath)) {
    const { overwrite } = await inquirer2.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: "config.bifrost already exists. Overwrite?",
        default: false
      }
    ]);
    if (!overwrite) {
      const existingConfig = await fs6.readJson(configPath);
      return existingConfig;
    }
  }
  const detectedRepo = await detectGitHubRepo();
  drawBox(
    "TEMPLATE INFORMATION",
    [
      "Provide basic information about your template.",
      "",
      "This helps users discover and understand your template."
    ]
  );
  const responses = await inquirer2.prompt([
    {
      type: "input",
      name: "name",
      message: "Template name:",
      validate: (value) => value.trim().length > 0 || "Name is required"
    },
    {
      type: "input",
      name: "description",
      message: "Description:",
      validate: (value) => value.trim().length > 0 || "Description is required"
    },
    {
      type: "input",
      name: "platform",
      message: "Platform:",
      default: "remix",
      validate: (value) => value.trim().length > 0 || "Platform is required"
    },
    {
      type: "input",
      name: "github",
      message: "GitHub repository (owner/repo):",
      default: detectedRepo || "",
      validate: (value) => {
        const pattern = /^[\w-]+\/[\w-]+$/;
        return pattern.test(value) || "Invalid format. Use: owner/repo";
      }
    },
    {
      type: "input",
      name: "tags",
      message: "Tags (comma-separated):",
      validate: (value) => value.trim().length > 0 || "At least one tag is required"
    },
    {
      type: "input",
      name: "postInstall",
      message: "Post-install scripts (comma-separated npm script names):",
      default: ""
    },
    {
      type: "input",
      name: "plugins",
      message: "Plugins to include (comma-separated owner/repo):",
      default: ""
    }
  ]);
  if (!responses.name) {
    console.log(chalk3.red("\nWizard cancelled"));
    process.exit(1);
  }
  if (!detectedRepo && !responses.github) {
    responses.github = await promptForGitHubRepo();
  }
  const config = {
    name: responses.name,
    description: responses.description,
    platform: responses.platform,
    github: responses.github,
    tags: responses.tags.split(",").map((t) => t.trim()).filter(Boolean),
    postInstall: responses.postInstall ? responses.postInstall.split(",").map((s) => s.trim()).filter(Boolean) : [],
    plugins: responses.plugins ? responses.plugins.split(",").map((p) => p.trim()).filter(Boolean) : []
  };
  await fs6.writeJson(configPath, config, { spaces: 2 });
  drawBox(
    "SUCCESS",
    [
      chalk3.green("\u2705 config.bifrost created successfully!"),
      "",
      "Configuration:",
      "",
      ...JSON.stringify(config, null, 2).split("\n").map((line) => chalk3.white(line))
    ]
  );
  return config;
}

// src/templateSubmitter.ts
import fs7 from "fs-extra";
import path6 from "path";
import chalk4 from "chalk";
import prompts from "prompts";
import { execSync as execSync3 } from "child_process";
var REGISTRY_REPO = "A5GARD/BIFROST";
var REGISTRY_FILE = "registry.bifrost";
async function verifyPublicRepo(github) {
  try {
    const response = await fetch(`https://api.github.com/repos/${github}`);
    if (!response.ok) return false;
    const data = await response.json();
    return !data.private;
  } catch {
    return false;
  }
}
async function submitTemplate() {
  console.log(chalk4.blue.bold("\n\u{1F4E4} Submit Template to Registry\n"));
  const configPath = path6.join(process.cwd(), "config.bifrost");
  let config;
  if (!await fs7.pathExists(configPath)) {
    console.log(chalk4.yellow("\u26A0 config.bifrost not found\n"));
    const { runWizard } = await prompts({
      type: "confirm",
      name: "runWizard",
      message: "Would you like to run the config wizard to create it?",
      initial: true
    });
    if (!runWizard) {
      console.log(chalk4.red("\nconfig.bifrost is required for submission"));
      process.exit(1);
    }
    config = await runConfigWizard();
  } else {
    config = await fs7.readJson(configPath);
  }
  console.log(chalk4.blue("\n\u{1F50D} Verifying repository..."));
  const isPublic = await verifyPublicRepo(config.github);
  if (!isPublic) {
    console.log(chalk4.red("\n\u274C Repository must be public"));
    console.log(chalk4.yellow("Please make your repository public before submitting"));
    const { madePublic } = await prompts({
      type: "confirm",
      name: "madePublic",
      message: "Have you made the repository public?",
      initial: false
    });
    if (!madePublic) {
      console.log(chalk4.red("\nSubmission cancelled"));
      process.exit(1);
    }
    const stillNotPublic = await verifyPublicRepo(config.github);
    if (!stillNotPublic) {
      console.log(chalk4.red("\n\u274C Repository is still not public"));
      process.exit(1);
    }
  }
  console.log(chalk4.cyan("\nTemplate Information:"));
  console.log(chalk4.gray("\u2500".repeat(50)));
  console.log(`Name: ${chalk4.white(config.name)}`);
  console.log(`Description: ${chalk4.white(config.description)}`);
  console.log(`Platform: ${chalk4.white(config.platform)}`);
  console.log(`GitHub: ${chalk4.white(config.github)}`);
  console.log(`Tags: ${chalk4.white(config.tags.join(", "))}`);
  if (config.postInstall.length > 0) {
    console.log(`Post-Install: ${chalk4.white(config.postInstall.join(", "))}`);
  }
  if (config.plugins.length > 0) {
    console.log(`Plugins: ${chalk4.white(config.plugins.join(", "))}`);
  }
  console.log(chalk4.gray("\u2500".repeat(50)));
  const { confirm } = await prompts({
    type: "confirm",
    name: "confirm",
    message: "Submit this template to the registry?",
    initial: true
  });
  if (!confirm) {
    console.log(chalk4.yellow("\nSubmission cancelled"));
    process.exit(0);
  }
  try {
    const [owner, repo] = config.github.split("/");
    const registryEntry = {
      owner,
      repo,
      description: config.description,
      platform: config.platform,
      tags: config.tags
    };
    console.log(chalk4.blue("\n\u{1F504} Forking registry repository..."));
    execSync3(`gh repo fork ${REGISTRY_REPO} --clone=false`, { stdio: "inherit" });
    const username = execSync3("gh api user -q .login", { encoding: "utf-8" }).trim();
    const forkRepo = `${username}/BIFROST`;
    console.log(chalk4.blue("\u{1F4E5} Cloning forked repository..."));
    const tempDir = path6.join(process.cwd(), ".bifrost-temp");
    await fs7.ensureDir(tempDir);
    execSync3(`gh repo clone ${forkRepo} ${tempDir}`, { stdio: "inherit" });
    console.log(chalk4.blue("\u{1F4CB} Fetching current registry..."));
    const registryUrl = `https://raw.githubusercontent.com/${REGISTRY_REPO}/main/${REGISTRY_FILE}`;
    const registryResponse = await fetch(registryUrl);
    let registry = [];
    if (registryResponse.ok) {
      registry = await registryResponse.json();
    }
    const registryPath = path6.join(tempDir, REGISTRY_FILE);
    await fs7.ensureDir(path6.dirname(registryPath));
    const existingIndex = registry.findIndex((t) => t.owner === owner && t.repo === repo);
    if (existingIndex !== -1) {
      console.log(chalk4.yellow("\n\u26A0 Template already exists in registry. Updating..."));
      registry[existingIndex] = registryEntry;
    } else {
      registry.push(registryEntry);
    }
    await fs7.writeJson(registryPath, registry, { spaces: 2 });
    console.log(chalk4.blue("\u{1F4BE} Committing changes..."));
    process.chdir(tempDir);
    execSync3("git add .", { stdio: "inherit" });
    execSync3(`git commit -m "Add/Update template: ${config.name}"`, { stdio: "inherit" });
    execSync3("git push", { stdio: "inherit" });
    console.log(chalk4.blue("\u{1F500} Creating pull request..."));
    const prUrl = execSync3(
      `gh pr create --repo ${REGISTRY_REPO} --title "Add template: ${config.name}" --body "Submitting template ${config.name} to the registry.

Platform: ${config.platform}
Description: ${config.description}"`,
      { encoding: "utf-8" }
    ).trim();
    process.chdir("..");
    await fs7.remove(tempDir);
    console.log(chalk4.green.bold("\n\u2728 Template submitted successfully!\n"));
    console.log(chalk4.cyan("Pull Request:"), chalk4.white(prUrl));
    console.log(chalk4.gray("\nYour template will be available once the PR is merged."));
  } catch (error) {
    if (error instanceof Error && error.message.includes("gh: command not found")) {
      console.log(chalk4.red("\n\u274C GitHub CLI (gh) is not installed"));
      console.log(chalk4.yellow("\nManual submission steps:"));
      console.log(chalk4.gray(`1. Fork the repository: https://github.com/${REGISTRY_REPO}`));
      console.log(chalk4.gray(`2. Clone your fork`));
      console.log(chalk4.gray(`3. Add your template to ${REGISTRY_FILE}`));
      console.log(chalk4.gray(`4. Commit and push changes`));
      console.log(chalk4.gray(`5. Create a pull request`));
    } else {
      throw error;
    }
  }
}

// src/index.ts
var VERSION = "1.0.0";
async function loadRegistry() {
  const registryFile = Bun.file(new URL("../dist/registry.bifrost", import.meta.url));
  return await registryFile.json();
}
function drawBox2(title, content, footer) {
  const width = 117;
  const horizontalLine = "\u2500".repeat(width - 2);
  console.log(`\u256D${horizontalLine}\u256E`);
  console.log(`\u2502${title.padStart(Math.floor((width - 2 + title.length) / 2)).padEnd(width - 2)}\u2502`);
  console.log(`\u251C${horizontalLine}\u2524`);
  content.forEach((line) => {
    console.log(`\u2502 ${line.padEnd(width - 4)} \u2502`);
  });
  if (footer) {
    console.log(`\u251C${horizontalLine}\u2524`);
    console.log(`\u2502${footer.padStart(Math.floor((width - 2 + footer.length) / 2)).padEnd(width - 2)}\u2502`);
  }
  console.log(`\u2570${horizontalLine}\u256F`);
}
async function promptMainMenu() {
  drawBox2(
    "@a5gard/bifrost",
    [
      "Platform-agnostic project creator with extensible template system.",
      "",
      "Choose an action to get started."
    ]
  );
  const { action } = await inquirer3.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        { name: "Create a new project", value: "create" },
        { name: "config.bifrost wizard", value: "wizard" },
        { name: "Submit template to bifrost registry", value: "submit" }
      ]
    }
  ]);
  return action;
}
async function promptProjectName() {
  drawBox2(
    "PROJECT SETUP",
    [
      "Enter a name for your new project.",
      "",
      "This will be used as the directory name and package name."
    ]
  );
  const { projectName } = await inquirer3.prompt([
    {
      type: "input",
      name: "projectName",
      message: "What would you like to name your new project?",
      validate: (input) => {
        if (!input.trim()) return "Project name is required";
        return true;
      }
    }
  ]);
  return projectName;
}
async function promptPlatform() {
  drawBox2(
    "SELECT PLATFORM",
    [
      "Choose the platform/framework for your new project.",
      "",
      "Available platforms are listed below."
    ]
  );
  const platformChoices = Object.entries(PLATFORMS).map(([key, platform2]) => ({
    name: platform2.name,
    value: key
  }));
  const { platform } = await inquirer3.prompt([
    {
      type: "list",
      name: "platform",
      message: "Which platform would you like to use?",
      choices: platformChoices
    }
  ]);
  return platform;
}
async function promptTemplateChoice(platform) {
  const platformData = PLATFORMS[platform];
  if (!platformData.templates) {
    return { useTemplate: false };
  }
  drawBox2(
    "INSTALLATION TYPE",
    [
      "Choose between the platform default or select from available templates.",
      "",
      "Templates provide pre-configured setups for specific use cases."
    ]
  );
  const { choice } = await inquirer3.prompt([
    {
      type: "list",
      name: "choice",
      message: "Do you prefer to use the platform's default install or would you like to opt for a template instead?",
      choices: [
        { name: "Platform Default", value: "default" },
        { name: "Choose Template", value: "template" }
      ]
    }
  ]);
  if (choice === "default") {
    const templateKeys = Object.keys(platformData.templates);
    if (templateKeys.length === 1) {
      return { useTemplate: true, template: platformData.templates[templateKeys[0]].repo };
    }
    drawBox2(
      `${platformData.name.toUpperCase()} DEFAULT OPTIONS`,
      [
        "This platform offers multiple default starter options.",
        "",
        "Select the one that best fits your needs."
      ]
    );
    const defaultChoices = Object.entries(platformData.templates).map(([key, tmpl]) => ({
      name: `${tmpl.name} - ${tmpl.description}`,
      value: tmpl.repo,
      short: tmpl.name
    }));
    const { template: template2 } = await inquirer3.prompt([
      {
        type: "list",
        name: "template",
        message: "Which default would you like to use?",
        choices: defaultChoices
      }
    ]);
    return { useTemplate: true, template: template2 };
  }
  const registry = await loadRegistry();
  const platformTemplates = registry.filter((t) => t.platform === platform);
  if (platformTemplates.length === 0) {
    console.log(chalk5.yellow("No community templates available for this platform. Using default."));
    const templateKeys = Object.keys(platformData.templates);
    return { useTemplate: true, template: platformData.templates[templateKeys[0]].repo };
  }
  drawBox2(
    `${platformData.name.toUpperCase()} TEMPLATES`,
    [
      "Select a community template from the available options below.",
      "",
      "Each template includes specific configurations and best practices."
    ]
  );
  const templateChoices = platformTemplates.map((t) => ({
    name: `${t.owner}/${t.repo} - ${t.description}`,
    value: `${t.owner}/${t.repo}`,
    short: `${t.owner}/${t.repo}`
  }));
  const { template } = await inquirer3.prompt([
    {
      type: "list",
      name: "template",
      message: "Which template would you like to use?",
      choices: templateChoices
    }
  ]);
  return { useTemplate: true, template };
}
async function promptPackageManager() {
  drawBox2(
    "PACKAGE MANAGER",
    [
      "Select your preferred package manager for dependency installation.",
      "",
      "Supported: npm, pnpm, yarn, bun"
    ]
  );
  const { packageManager } = await inquirer3.prompt([
    {
      type: "list",
      name: "packageManager",
      message: "Which package manager do you prefer?",
      choices: PACKAGE_MANAGERS.map((pm) => ({ name: pm, value: pm }))
    }
  ]);
  return packageManager;
}
async function promptAdditionalOptions() {
  drawBox2(
    "ADDITIONAL OPTIONS",
    [
      "Configure additional features and tools for your project.",
      "",
      "Would you like tailwind and its requirements to be installed and configured:"
    ]
  );
  const { options } = await inquirer3.prompt([
    {
      type: "checkbox",
      name: "options",
      message: "Select the options you would like to include (use spacebar to toggle):",
      choices: [
        { name: "Using the base tailwind config", value: "tailwindBase" },
        { name: "Using the preset ngin", value: "tailwindNgin" },
        { name: "Pre-install MI\xD0GAR\xD0R UI components", value: "midgardr" },
        { name: "Pre-install @a5gard/baldr icons", value: "baldr" },
        { name: "Auto install the project's libraries once the project has initialized", value: "install", checked: true },
        { name: "Auto create and push the first commit to GitHub", value: "gitPush" }
      ]
    }
  ]);
  return {
    tailwindBase: options.includes("tailwindBase"),
    tailwindNgin: options.includes("tailwindNgin"),
    midgardr: options.includes("midgardr"),
    baldr: options.includes("baldr"),
    install: options.includes("install"),
    gitPush: options.includes("gitPush")
  };
}
function showTemplates(registry, platformFilter) {
  let filteredTemplates = registry;
  if (platformFilter) {
    filteredTemplates = registry.filter((t) => t.platform === platformFilter);
    if (filteredTemplates.length === 0) {
      console.log(chalk5.yellow(`No templates found for platform: ${platformFilter}`));
      return;
    }
  }
  const groupedByPlatform = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.platform]) {
      acc[template.platform] = [];
    }
    acc[template.platform].push(template);
    return acc;
  }, {});
  console.log();
  drawBox2(
    "AVAILABLE COMMUNITY TEMPLATES",
    Object.entries(groupedByPlatform).flatMap(([platform, templates]) => {
      const lines = [
        "",
        chalk5.bold.cyan(platform.toUpperCase()),
        ""
      ];
      templates.forEach((template) => {
        lines.push(`  ${chalk5.green("\u203A")} ${chalk5.bold(`${template.owner}/${template.repo}`)}`);
        lines.push(`    ${chalk5.gray(template.description)}`);
        lines.push(`    ${chalk5.gray(`Tags: ${template.tags.join(", ")}`)}`);
        lines.push("");
      });
      return lines;
    })
  );
  console.log();
  console.log(chalk5.gray("Use any template with: ") + chalk5.cyan("bunx @a5gard/bifrost my-app --template owner/repo"));
  console.log();
}
function showHelp() {
  drawBox2(
    "BIFROST CLI HELP",
    [
      chalk5.white("BIFR\xD6ST unifies the fragmented landscape of project starters. Instead of learning npx create-remix, npx create-next-app, npx create-vite, and so on\u2014use one CLI for all platforms with community-driven templates and a plugin system."),
      chalk5.white("Whenever a platform has been selected, you have the option of using the default installer provided by the platform's creators, or you may opt instead to use a configured template that was created by other developers."),
      chalk5.white("Templates are opinionated variants that will include file scaffolding, configurations in place to meet the needed requirements, route files, pre-installed libraries and more."),
      chalk5.white("Allowing you to hit the ground running when starting a new project, instead of wasting time or getting bogged down with all the required to-do items whenever a new app is created."),
      chalk5.white("Currently focusing on React-based platforms. Once the details are ironed out, that focus will be expanded upon however I can."),
      "",
      chalk5.white("BIFR\xD6ST is not only striving to fill a gap where no one else has even really attempted, but also introducing a plugin system that can be used with, alongside, or on its own with the default installer."),
      chalk5.white("A plugin will contain everything needed to add that feature to your project. For example, one-time password authentication for Remix Run. The plugin will contain and install all required route files, create/update all required configuration files, and will ensure all required libraries are installed within the project."),
      chalk5.white("Once the plugin's installation process has completed, other than setting up your own personal Resend account, the plugin will be ready to use."),
      chalk5.white(""),
      chalk5.white("Another benefit that has come from the plugin system: for developers that can't live with a one-template-fits-all lifestyle. Instead, create a bare-bones essential app where only the libraries, configs, and routes that are absolutely essential, no matter the scenario, are included."),
      chalk5.white("At which time, instead of configuring several time-consuming full-stack variations, you can create plugins to fill in the needs of whatever use case you can think of. So instead of having several projects that need not only to be taken care of in all the forms that are required, where at times you will be updating the same configs and libraries across all variants."),
      chalk5.white("Because we don't want to deal with all of the headaches that come along with it, not to mention the time spent going that route. In its place, have one app that will serve as the foundation for all the plugins."),
      chalk5.white("In the end, there's one app and one plugin to take care of instead of updating the same auth library across 4, 5, or whatever number of applications."),
      chalk5.white(""),
      "",
      chalk5.bold("Usage:"),
      "",
      `  ${chalk5.cyan("$ bunx @a5gard/bifrost")} ${chalk5.gray("<projectName> <...options>")}`,
      "",
      chalk5.bold("Examples:"),
      "",
      `  ${chalk5.cyan("$ bunx @a5gard/bifrost")}`,
      `  ${chalk5.cyan("$ bunx @a5gard/bifrost my-app")}`,
      `  ${chalk5.cyan("$ bunx @a5gard/bifrost my-app --template remix-run/indie-template")}`,
      `  ${chalk5.cyan("$ bunx @a5gard/bifrost my-app -t owner/repo -p bun")}`,
      `  ${chalk5.cyan("$ bunx @a5gard/bifrost my-app -t owner/repo --no-install")}`,
      `  ${chalk5.cyan("$ bunx @a5gard/bifrost --list-templates")}`,
      `  ${chalk5.cyan("$ bunx @a5gard/bifrost --list-templates remix")}`,
      `  ${chalk5.cyan("$ bunx @a5gard/bifrost --wizard")}`,
      `  ${chalk5.cyan("$ bunx @a5gard/bifrost --submit")}`,
      "",
      chalk5.bold("Options:"),
      "",
      `  ${chalk5.cyan("--help, -h")}          Print this help message`,
      `  ${chalk5.cyan("--version, -V")}       Print the CLI version`,
      `  ${chalk5.cyan("--template, -t")}      Template to use (format: owner/repo)`,
      `  ${chalk5.cyan("--pkg-mgr, -p")}       Package manager (npm, pnpm, yarn, bun)`,
      `  ${chalk5.cyan("--no-install")}        Skip dependency installation`,
      `  ${chalk5.cyan("--list-templates")}    List all available community templates`,
      `  ${chalk5.cyan("--wizard")}            Run config.bifrost wizard`,
      `  ${chalk5.cyan("--submit")}            Submit template to bifrost registry`,
      ""
    ]
  );
}
async function runCLI(argv) {
  const registry = await loadRegistry();
  const args = argv.slice(2);
  const flags = {};
  let projectName;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      flags.help = true;
    } else if (arg === "--version" || arg === "-V") {
      flags.version = true;
    } else if (arg === "--list-templates") {
      flags.listTemplates = true;
      if (args[i + 1] && !args[i + 1].startsWith("-")) {
        flags.platform = args[++i];
      }
    } else if (arg === "--wizard") {
      flags.wizard = true;
    } else if (arg === "--submit") {
      flags.submit = true;
    } else if (arg === "--no-install") {
      flags.noInstall = true;
    } else if (arg === "--template" || arg === "-t") {
      flags.template = args[++i];
    } else if (arg === "--pkg-mgr" || arg === "-p") {
      flags.pkgMgr = args[++i];
    } else if (!arg.startsWith("-") && !projectName) {
      projectName = arg;
    }
  }
  if (flags.help) {
    showHelp();
    process.exit(0);
  }
  if (flags.version) {
    console.log(`BIFR\xD6ST V${VERSION}`);
    process.exit(0);
  }
  if (flags.listTemplates) {
    showTemplates(registry, flags.platform);
    process.exit(0);
  }
  if (flags.wizard) {
    await runConfigWizard();
    process.exit(0);
  }
  if (flags.submit) {
    await submitTemplate();
    process.exit(0);
  }
  try {
    if (flags.pkgMgr && !PACKAGE_MANAGERS.includes(flags.pkgMgr)) {
      console.error(chalk5.red(`Invalid package manager. Must be one of: ${PACKAGE_MANAGERS.join(", ")}`));
      process.exit(1);
    }
    let action = "create";
    let finalProjectName = projectName;
    let finalTemplate = flags.template;
    let finalPackageManager = flags.pkgMgr;
    let finalInstall = flags.noInstall ? false : void 0;
    let tailwindBase = false;
    let tailwindNgin = false;
    let midgardr = false;
    let baldr = false;
    let gitPush = false;
    if (!projectName && !flags.template) {
      action = await promptMainMenu();
      if (action === "wizard") {
        await runConfigWizard();
        process.exit(0);
      }
      if (action === "submit") {
        await submitTemplate();
        process.exit(0);
      }
    }
    if (!finalProjectName) {
      finalProjectName = await promptProjectName();
    }
    if (!finalTemplate) {
      const platform = await promptPlatform();
      const templateChoice = await promptTemplateChoice(platform);
      finalTemplate = templateChoice.template;
    }
    if (!finalPackageManager) {
      finalPackageManager = await promptPackageManager();
    }
    const additionalOptions = await promptAdditionalOptions();
    tailwindBase = additionalOptions.tailwindBase;
    tailwindNgin = additionalOptions.tailwindNgin;
    midgardr = additionalOptions.midgardr;
    baldr = additionalOptions.baldr;
    finalInstall = finalInstall !== void 0 ? finalInstall : additionalOptions.install;
    gitPush = additionalOptions.gitPush;
    const validProjectName = toValidPackageName(finalProjectName);
    await createProject({
      projectName: validProjectName,
      template: finalTemplate,
      packageManager: finalPackageManager,
      install: finalInstall,
      gitPush,
      tailwindBase,
      tailwindNgin,
      midgardr,
      baldr
    });
  } catch (error) {
    console.error();
    console.error(chalk5.red("Error:"), error instanceof Error ? error.message : "Unknown error");
    console.error();
    process.exit(1);
  }
}
export {
  runCLI
};
