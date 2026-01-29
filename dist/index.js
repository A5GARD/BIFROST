#!/usr/bin/env bun

// src/cli.ts
import { Command } from "commander";
import chalk3 from "chalk";

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

// src/prompts.ts
import prompts from "prompts";

// src/utilts.ts
import fs from "fs-extra";
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
    const stats = await fs.stat(dir);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
async function isDirectoryEmpty(dir) {
  const files = await fs.readdir(dir);
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
async function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent;
  if (!userAgent) return "bun";
  if (userAgent.startsWith("pnpm")) return "pnpm";
  if (userAgent.startsWith("yarn")) return "yarn";
  if (userAgent.startsWith("bun")) return "bun";
  if (userAgent.startsWith("npm")) return "npm";
  return "bun";
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

// src/prompts.ts
async function promptForMissingOptions(projectName, template, packageManager, install) {
  const detectedPM = await detectPackageManager();
  const questions = [];
  if (!projectName) {
    questions.push({
      type: "text",
      name: "projectName",
      message: "What would you like to name your new project?",
      initial: "my-bifrost-app",
      validate: (value) => {
        if (!value) return "Project name is required";
        return true;
      }
    });
  }
  if (!template) {
    questions.push({
      type: "select",
      name: "platform",
      message: "Which platform would you like to use?",
      choices: Object.entries(PLATFORMS).map(([key, platform]) => ({
        title: platform.name,
        value: key,
        description: platform.description || ""
      })),
      initial: 0
    });
    questions.push({
      type: (prev) => {
        const platform = PLATFORMS[prev];
        return platform.templates ? "select" : null;
      },
      name: "template",
      message: "Select a template:",
      choices: (prev) => {
        const platform = PLATFORMS[prev];
        if (!platform.templates) return [];
        return Object.entries(platform.templates).map(([key, template2]) => ({
          title: template2.name,
          value: template2.repo,
          description: template2.description
        }));
      }
    });
    questions.push({
      type: (prev, values) => {
        const platformKey = values.platform;
        return platformKey === "custom" ? "text" : null;
      },
      name: "customStack",
      message: "Enter template (owner/repo):",
      validate: (value) => {
        if (!value || !value.includes("/")) {
          return "Stack must be in format: owner/repo";
        }
        return true;
      }
    });
  }
  if (!packageManager) {
    questions.push({
      type: "select",
      name: "packageManager",
      message: "Which package manager do you prefer?",
      choices: PACKAGE_MANAGERS.map((pm) => ({
        title: pm,
        value: pm,
        selected: pm === detectedPM
      })),
      initial: PACKAGE_MANAGERS.indexOf(detectedPM)
    });
  }
  if (install === void 0) {
    questions.push({
      type: "confirm",
      name: "install",
      message: "Would you like to have the install command run once the project has initialized?",
      initial: true
    });
  }
  questions.push({
    type: "confirm",
    name: "gitPush",
    message: "Would you like to auto create and push the first commit to GitHub?",
    initial: false
  });
  const answers = await prompts(questions, {
    onCancel: () => {
      console.log("\nOperation cancelled");
      process.exit(0);
    }
  });
  let finalStack = template;
  if (!template) {
    if (answers.platform === "custom") {
      finalStack = answers.customStack;
    } else if (answers.template) {
      finalStack = answers.template;
    } else {
      const platform = PLATFORMS[answers.platform];
      if (platform.repo) {
        finalStack = platform.repo;
      }
    }
  }
  return {
    projectName: projectName || answers.projectName,
    template: finalStack,
    packageManager: packageManager || answers.packageManager,
    install: install !== void 0 ? install : answers.install,
    gitPush: answers.gitPush
  };
}

// src/creator.ts
import fs5 from "fs-extra";
import path4 from "path";
import chalk2 from "chalk";
import ora2 from "ora";

// src/git.ts
import { execa } from "execa";
import fs2 from "fs-extra";
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
    await fs2.remove(path.join(tempDir, ".git"));
    await fs2.copy(tempDir, targetDir, { overwrite: true });
    await fs2.remove(tempDir);
  } catch (error) {
    await fs2.remove(tempDir).catch(() => {
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
import prompts2 from "prompts";
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
  const response = await prompts2({
    type: "text",
    name: "location",
    message: `Location for ${chalk.cyan(fileName)}:`,
    initial: suggestedLocation,
    validate: (value) => {
      if (!value) return "Location is required";
      return true;
    }
  });
  if (!response.location) {
    throw new Error("Operation cancelled");
  }
  return response.location;
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
async function createProject(context) {
  const { projectName, template, packageManager, install, gitPush } = context;
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
  console.log(chalk2.bold("Next steps:"));
  console.log();
  console.log(`  ${chalk2.cyan("cd")} ${projectName}`);
  if (!install) {
    console.log(`  ${chalk2.cyan(`${packageManager} install`)}`);
  }
  console.log(`  ${chalk2.cyan(`${packageManager} ${packageManager === "npm" ? "run " : ""}dev`)}`);
  console.log();
}

// src/cli.ts
var registryFile = Bun.file(new URL("../registry.bifrost", import.meta.url));
var DEFAULT_STACKS = await registryFile.json();
async function runCLI(argv) {
  const program = new Command();
  program.name("create-bifrost").description("Create a new project with platform-agnostic templates").version("1.0.0").argument("[projectName]", "The project name").option("-t, --template <owner/repo>", "The template to use (format: owner/repo)").option("-p, --pkg-mgr <pm>", `Package manager to use (${PACKAGE_MANAGERS.join(", ")})`).option("--no-install", "Skip dependency installation").option("--list-templates", "List all available community templates").option("-h, --help", "Show help").action(async (projectName, options) => {
    if (options.help) {
      showHelp();
      process.exit(0);
    }
    if (options.listTemplates) {
      showTemplates();
      process.exit(0);
    }
    try {
      if (options.pkgMgr && !PACKAGE_MANAGERS.includes(options.pkgMgr)) {
        console.error(chalk3.red(`Invalid package manager. Must be one of: ${PACKAGE_MANAGERS.join(", ")}`));
        process.exit(1);
      }
      let finalProjectName = projectName;
      let finalStack = options.template;
      let finalPackageManager = options.pkgMgr;
      let finalInstall = options.noInstall === false;
      const prompted = await promptForMissingOptions(
        finalProjectName,
        finalStack,
        finalPackageManager,
        finalInstall ? void 0 : false
      );
      finalProjectName = prompted.projectName;
      finalStack = prompted.template;
      finalPackageManager = prompted.packageManager;
      finalInstall = prompted.install;
      const gitPush = prompted.gitPush;
      const validProjectName = toValidPackageName(finalProjectName);
      await createProject({
        projectName: validProjectName,
        template: finalStack,
        packageManager: finalPackageManager,
        install: finalInstall,
        gitPush
      });
    } catch (error) {
      console.error();
      console.error(chalk3.red("Error:"), error instanceof Error ? error.message : "Unknown error");
      console.error();
      process.exit(1);
    }
  });
  await program.parseAsync(argv);
}
function showHelp() {
  console.log(`
${chalk3.bold("Usage:")}

  ${chalk3.cyan("$ bunx create-bifrost")} ${chalk3.gray("<projectName> <...options>")}

${chalk3.bold("Examples:")}

  ${chalk3.cyan("$ bunx create-bifrost")}
  ${chalk3.cyan("$ bunx create-bifrost my-app")}
  ${chalk3.cyan("$ bunx create-bifrost my-app --template remix-run/indie-template")}
  ${chalk3.cyan("$ bunx create-bifrost my-app -s owner/repo -p bun")}
  ${chalk3.cyan("$ bunx create-bifrost my-app -s owner/repo --no-install")}
  ${chalk3.cyan("$ bunx create-bifrost --list-templates")}

${chalk3.bold("Options:")}

  ${chalk3.cyan("--help, -h")}          Print this help message
  ${chalk3.cyan("--version, -V")}       Print the CLI version
  ${chalk3.cyan("--template, -s")}         Stack to use (format: owner/repo)
  ${chalk3.cyan("--pkg-mgr, -p")}       Package manager (npm, pnpm, yarn, bun)
  ${chalk3.cyan("--no-install")}        Skip dependency installation
  ${chalk3.cyan("--list-templates")}    List all available community templates
  `);
}
function showTemplates() {
  console.log();
  console.log(chalk3.bold("Available Community Templates"));
  console.log();
  const groupedByPlatform = DEFAULT_STACKS.reduce((acc, template) => {
    if (!acc[template.platform]) {
      acc[template.platform] = [];
    }
    acc[template.platform].push(template);
    return acc;
  }, {});
  Object.entries(groupedByPlatform).forEach(([platform, template]) => {
    console.log(chalk3.bold.cyan(`${platform.toUpperCase()}`));
    console.log();
    template.forEach((template2) => {
      console.log(`  ${chalk3.green("\u203A")} ${chalk3.bold(`${template2.owner}/${template2.repo}`)}`);
      console.log(`    ${chalk3.gray(template2.description)}`);
      console.log(`    ${chalk3.gray(`Tags: ${template2.tags.join(", ")}`)}`);
      console.log();
    });
  });
  console.log(chalk3.gray("Use any template with: ") + chalk3.cyan("bunx create-bifrost my-app --template owner/repo"));
  console.log();
}

// src/index.ts
runCLI(process.argv);
