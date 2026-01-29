import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';
import type { PackageManager, PluginConfig, PluginFile } from './types'; 
import { TEMP_DIR_PREFIX } from './constants';
import { cloneRepository } from './git';
import { parseStackReference, getPackageManagerCommand } from './utilts';

export async function fetchPluginConfig(owner: string, repo: string): Promise<PluginConfig> {
  const tempDir = path.join(os.tmpdir(), `${TEMP_DIR_PREFIX}plugin-${Date.now()}`);
  
  try {
    await cloneRepository(owner, repo, tempDir);
    
    const configPath = path.join(tempDir, 'plugin.bifrost');
    
    if (!(await fs.pathExists(configPath))) {
      throw new Error(`Plugin ${owner}/${repo} is missing plugin.bifrost configuration file`);
    }
    
    const config = await fs.readJson(configPath);
    
    await fs.remove(tempDir);
    
    return config;
  } catch (error) {
    await fs.remove(tempDir).catch(() => {});
    throw error;
  }
}

export async function installPluginLibraries(
  projectDir: string,
  packageManager: PackageManager,
  libraries: string[]
): Promise<void> {
  if (libraries.length === 0) return;
  
  const installCommand = getPackageManagerCommand(packageManager, 'install');
  const [cmd, ...baseArgs] = installCommand.split(' ');
  
  const args = [...baseArgs, ...libraries];
  
  await execa(cmd, args, {
    cwd: projectDir,
    stdio: 'inherit'
  });
}

export async function promptForFileLocation(
  fileName: string,
  suggestedLocation: string
): Promise<string> {
  const response = await prompts({
    type: 'text',
    name: 'location',
    message: `Location for ${chalk.cyan(fileName)}:`,
    initial: suggestedLocation,
    validate: (value: string) => {
      if (!value) return 'Location is required';
      return true;
    }
  });
  
  if (!response.location) {
    throw new Error('Operation cancelled');
  }
  
  return response.location;
}

export async function copyPluginFiles(
  projectDir: string,
  pluginTempDir: string,
  files: PluginFile[]
): Promise<void> {
  for (const file of files) {
    const confirmedLocation = await promptForFileLocation(file.name, file.location);
    
    const sourcePath = path.join(pluginTempDir, 'files', file.name);
    const destPath = path.join(projectDir, confirmedLocation);
    
    if (!(await fs.pathExists(sourcePath))) {
      console.warn(chalk.yellow(`Warning: File ${file.name} not found in plugin, skipping...`));
      continue;
    }
    
    await fs.ensureDir(path.dirname(destPath));
    await fs.copy(sourcePath, destPath);
    
    console.log(chalk.green(`✓ Copied ${file.name} to ${confirmedLocation}`));
  }
}

export async function installPlugin(
  projectDir: string,
  packageManager: PackageManager,
  pluginReference: string
): Promise<void> {
  const { owner, repo } = parseStackReference(pluginReference);
  
  console.log();
  console.log(chalk.bold(`Installing plugin: ${chalk.cyan(pluginReference)}`));
  console.log();
  
  const configSpinner = ora('Fetching plugin configuration...').start();
  let pluginConfig: PluginConfig;
  
  try {
    pluginConfig = await fetchPluginConfig(owner, repo);
    configSpinner.succeed(`Fetched configuration for ${chalk.cyan(pluginConfig.name)}`);
  } catch (error) {
    configSpinner.fail('Failed to fetch plugin configuration');
    throw error;
  }
  
  console.log(chalk.gray(`Description: ${pluginConfig.description}`));
  console.log(chalk.gray(`Platform: ${pluginConfig.platform}`));
  console.log(chalk.gray(`Tags: ${pluginConfig.tags.join(', ')}`));
  console.log();
  
  if (pluginConfig.libraries && pluginConfig.libraries.length > 0) {
    const libSpinner = ora('Installing plugin libraries...').start();
    try {
      await installPluginLibraries(projectDir, packageManager, pluginConfig.libraries);
      libSpinner.succeed('Installed plugin libraries');
    } catch (error) {
      libSpinner.fail('Failed to install plugin libraries');
      throw error;
    }
  }
  
  if (pluginConfig.files && pluginConfig.files.length > 0) {
    console.log();
    console.log(chalk.bold('Plugin files:'));
    console.log();
    
    const tempDir = path.join(os.tmpdir(), `${TEMP_DIR_PREFIX}plugin-${Date.now()}`);
    
    try {
      await cloneRepository(owner, repo, tempDir);
      await copyPluginFiles(projectDir, tempDir, pluginConfig.files);
      await fs.remove(tempDir);
    } catch (error) {
      await fs.remove(tempDir).catch(() => {});
      throw error;
    }
  }
  
  console.log();
  console.log(chalk.bold.green(`✓ Plugin ${pluginConfig.name} installed successfully!`));
  console.log();
}

export async function installPlugins(
  projectDir: string,
  packageManager: PackageManager,
  plugins: string[]
): Promise<void> {
  if (plugins.length === 0) return;
  
  console.log();
  console.log(chalk.bold(`Found ${plugins.length} plugin(s) to install`));
  
  for (const plugin of plugins) {
    try {
      await installPlugin(projectDir, packageManager, plugin);
    } catch (error) {
      console.error(chalk.red(`Failed to install plugin ${plugin}:`), error instanceof Error ? error.message : 'Unknown error');
      console.log();
    }
  }
}