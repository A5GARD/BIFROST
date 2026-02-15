import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import type { ProjectContext } from './types';
import { cloneRepository, initializeGitRepo, pushToGitHub } from './git';
import { installDependencies, runPostInstallScripts } from './install';
import { installPlugins } from './plugin';
import { parseStackReference, directoryExists, isDirectoryEmpty, detectPlatformFromStack, detectTagsFromStack } from './utilts';
import { updatePackageJson, readStackConfig, createBifrostConfig } from './packge-json';
import { execSync } from 'child_process';

async function installTailwind(absolutePath: string, packageManager: string, useNgin: boolean): Promise<void> {
  const spinner = ora(`Installing Tailwind CSS with ${useNgin ? 'preset ngin' : 'base config'}...`).start();

  try {
    const installCmd = packageManager === 'npm'
      ? 'npm install -D tailwindcss postcss autoprefixer'
      : `${packageManager} add -D tailwindcss postcss autoprefixer`;

    execSync(installCmd, { cwd: absolutePath, stdio: 'ignore' });

    execSync('npx tailwindcss init -p', { cwd: absolutePath, stdio: 'ignore' });

    if (useNgin) {
      const tailwindConfig = `import type { Config } from 'tailwindcss';
import ngin from '@a5gard/ngin';

export default {
  presets: [ngin],
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
} satisfies Config;`;

      await fs.writeFile(path.join(absolutePath, 'tailwind.config.ts'), tailwindConfig);
    }

    const appCssPath = path.join(absolutePath, 'app', 'tailwind.css');
    const rootCssPath = path.join(absolutePath, 'app', 'root.css');
    const cssPath = await fs.pathExists(appCssPath) ? appCssPath : rootCssPath;

    const tailwindDirectives = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

    if (await fs.pathExists(cssPath)) {
      const existingCss = await fs.readFile(cssPath, 'utf-8');
      if (!existingCss.includes('@tailwind')) {
        await fs.writeFile(cssPath, tailwindDirectives + existingCss);
      }
    } else {
      await fs.ensureDir(path.dirname(cssPath));
      await fs.writeFile(cssPath, tailwindDirectives);
    }

    spinner.succeed(`Installed Tailwind CSS with ${useNgin ? 'preset ngin' : 'base config'}`);
  } catch (error) {
    spinner.fail('Failed to install Tailwind CSS');
    throw error;
  }
}

async function installMidgardr(absolutePath: string, packageManager: string, withNgin: boolean): Promise<void> {
  const spinner = ora('Installing MIÐGARÐR UI components...').start();

  try {
    const command = withNgin ? 'full-w-ngin' : 'full-install';
    execSync(`bunx @a5gard/midgardr ${command}`, { cwd: absolutePath, stdio: 'inherit' });
    spinner.succeed('Installed MIÐGARÐR UI components');
  } catch (error) {
    spinner.fail('Failed to install MIÐGARÐR UI components');
    throw error;
  }
}

async function installBaldr(absolutePath: string, packageManager: string): Promise<void> {
  const spinner = ora('Installing @a5gard/baldr icons...').start();

  try {
    const installCmd = packageManager === 'npm'
      ? 'npm install @a5gard/baldr'
      : `${packageManager} add @a5gard/baldr`;

    execSync(installCmd, { cwd: absolutePath, stdio: 'ignore' });
    spinner.succeed('Installed @a5gard/baldr icons');
  } catch (error) {
    spinner.fail('Failed to install @a5gard/baldr icons');
    throw error;
  }
}

export async function createProject(context: ProjectContext): Promise<void> {
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

  const absolutePath = path.resolve(projectName);

  console.log();
  console.log(chalk.bold('Creating your Bifrost project...'));
  console.log();

  if (await directoryExists(absolutePath)) {
    const isEmpty = await isDirectoryEmpty(absolutePath);
    if (!isEmpty) {
      throw new Error(`Directory ${projectName} already exists and is not empty`);
    }
  } else {
    await fs.ensureDir(absolutePath);
  }

  const { owner, repo } = parseStackReference(template);

  const cloneSpinner = ora(`Cloning ${chalk.cyan(template)}...`).start();
  try {
    await cloneRepository(owner, repo, absolutePath);
    cloneSpinner.succeed(`Cloned ${chalk.cyan(template)}`);
  } catch (error) {
    cloneSpinner.fail(`Failed to clone ${chalk.cyan(template)}`);
    throw error;
  }

  const updateSpinner = ora('Updating package.json...').start();
  try {
    await updatePackageJson(absolutePath, projectName);
    updateSpinner.succeed('Updated package.json');
  } catch (error) {
    updateSpinner.fail('Failed to update package.json');
    throw error;
  }

  const stackConfig = await readStackConfig(absolutePath);

  if (install) {
    const installSpinner = ora(`Installing dependencies with ${chalk.cyan(packageManager)}...`).start();
    try {
      await installDependencies(absolutePath, packageManager);
      installSpinner.succeed(`Installed dependencies with ${chalk.cyan(packageManager)}`);
    } catch (error) {
      installSpinner.fail('Failed to install dependencies');
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
      const postInstallSpinner = ora('Running post-install scripts...').start();
      try {
        await runPostInstallScripts(absolutePath, packageManager, stackConfig.postInstall);
        postInstallSpinner.succeed('Completed post-install scripts');
      } catch (error) {
        postInstallSpinner.warn('Some post-install scripts failed');
      }
    }

    if (stackConfig?.plugins && Array.isArray(stackConfig.plugins) && stackConfig.plugins.length > 0) {
      try {
        await installPlugins(absolutePath, packageManager, stackConfig.plugins);
      } catch (error) {
        console.error(chalk.red('Some plugins failed to install'));
      }
    }
  }

  const gitSpinner = ora('Initializing git repository...').start();
  try {
    await initializeGitRepo(absolutePath);
    gitSpinner.succeed('Initialized git repository');
  } catch {
    gitSpinner.info('Skipped git initialization');
  }

  const configSpinner = ora('Creating config.bifrost...').start();
  try {
    const platform = detectPlatformFromStack(template);
    const tags = detectTagsFromStack(template);
    await createBifrostConfig(absolutePath, projectName, template, platform, tags, stackConfig);
    configSpinner.succeed('Created config.bifrost');
  } catch (error) {
    configSpinner.warn('Failed to create config.bifrost');
  }

  if (gitPush) {
    const pushSpinner = ora('Pushing to GitHub...').start();
    try {
      await pushToGitHub(absolutePath);
      pushSpinner.succeed('Pushed to GitHub');
    } catch (error) {
      pushSpinner.warn('Failed to push to GitHub - you may need to set up a remote repository first');
    }
  }

  console.log();
  console.log(chalk.bold.green('✓ Project created successfully!'));
  console.log();
  console.log();

  if (!install) {
    console.log(chalk.bold('Next steps:'));
    console.log(`  ${chalk.cyan('cd')} ${projectName}`);
    console.log(`  ${chalk.cyan(`${packageManager} install`)}`);
    console.log(`  ${chalk.cyan(`${packageManager} ${packageManager === 'npm' ? 'run ' : ''}dev`)}`);
  } else {
    console.log(chalk.bold.green('changing directories and starting the first dev server...'));
    execSync(`cd ${projectName}`, { cwd: absolutePath, stdio: 'inherit' });
    execSync(`${packageManager} ${packageManager === 'npm' ? 'run ' : ''}dev`, { cwd: absolutePath, stdio: 'inherit' });
  }

  console.log();
}