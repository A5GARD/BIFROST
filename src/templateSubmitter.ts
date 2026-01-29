// src/templateSubmitter.ts

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import prompts from 'prompts';
import { execSync } from 'child_process';
import { runConfigWizard } from './wizard';

interface ConfigBifrost {
  name: string;
  description: string;
  platform: string;
  github: string;
  tags: string[];
  postInstall: string[];
  plugins: string[];
}

interface RegistryEntry {
  owner: string;
  repo: string;
  description: string;
  platform: string;
  tags: string[];
}

const REGISTRY_REPO = 'A5GARD/BIFROST';
const REGISTRY_FILE = 'dist/registry.bifrost';

async function verifyPublicRepo(github: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.github.com/repos/${github}`);
    if (!response.ok) return false;
    const data = await response.json();
    return !data.private;
  } catch {
    return false;
  }
}

export async function submitTemplate(): Promise<void> {
  console.log(chalk.blue.bold('\n📤 Submit Template to Registry\n'));
  
  const configPath = path.join(process.cwd(), 'config.bifrost');
  
  let config: ConfigBifrost;
  
  if (!await fs.pathExists(configPath)) {
    console.log(chalk.yellow('⚠ config.bifrost not found\n'));
    
    const { runWizard } = await prompts({
      type: 'confirm',
      name: 'runWizard',
      message: 'Would you like to run the config wizard to create it?',
      initial: true
    });
    
    if (!runWizard) {
      console.log(chalk.red('\nconfig.bifrost is required for submission'));
      process.exit(1);
    }
    
    config = await runConfigWizard();
  } else {
    config = await fs.readJson(configPath);
  }
  
  console.log(chalk.blue('\n🔍 Verifying repository...'));
  
  const isPublic = await verifyPublicRepo(config.github);
  
  if (!isPublic) {
    console.log(chalk.red('\n❌ Repository must be public'));
    console.log(chalk.yellow('Please make your repository public before submitting'));
    
    const { madePublic } = await prompts({
      type: 'confirm',
      name: 'madePublic',
      message: 'Have you made the repository public?',
      initial: false
    });
    
    if (!madePublic) {
      console.log(chalk.red('\nSubmission cancelled'));
      process.exit(1);
    }
    
    const stillNotPublic = await verifyPublicRepo(config.github);
    if (!stillNotPublic) {
      console.log(chalk.red('\n❌ Repository is still not public'));
      process.exit(1);
    }
  }
  
  console.log(chalk.cyan('\nTemplate Information:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`Name: ${chalk.white(config.name)}`);
  console.log(`Description: ${chalk.white(config.description)}`);
  console.log(`Platform: ${chalk.white(config.platform)}`);
  console.log(`GitHub: ${chalk.white(config.github)}`);
  console.log(`Tags: ${chalk.white(config.tags.join(', '))}`);
  if (config.postInstall.length > 0) {
    console.log(`Post-Install: ${chalk.white(config.postInstall.join(', '))}`);
  }
  if (config.plugins.length > 0) {
    console.log(`Plugins: ${chalk.white(config.plugins.join(', '))}`);
  }
  console.log(chalk.gray('─'.repeat(50)));
  
  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: 'Submit this template to the registry?',
    initial: true
  });
  
  if (!confirm) {
    console.log(chalk.yellow('\nSubmission cancelled'));
    process.exit(0);
  }
  
  try {
    const [owner, repo] = config.github.split('/');
    
    const registryEntry: RegistryEntry = {
      owner,
      repo,
      description: config.description,
      platform: config.platform,
      tags: config.tags
    };
    
    console.log(chalk.blue('\n🔄 Forking registry repository...'));
    execSync(`gh repo fork ${REGISTRY_REPO} --clone=false`, { stdio: 'inherit' });
    
    const username = execSync('gh api user -q .login', { encoding: 'utf-8' }).trim();
    const forkRepo = `${username}/BIFROST`;
    
    console.log(chalk.blue('📥 Cloning forked repository...'));
    const tempDir = path.join(process.cwd(), '.bifrost-temp');
    await fs.ensureDir(tempDir);
    
    execSync(`gh repo clone ${forkRepo} ${tempDir}`, { stdio: 'inherit' });
    
    console.log(chalk.blue('📋 Fetching current registry...'));
    const registryUrl = `https://raw.githubusercontent.com/${REGISTRY_REPO}/main/${REGISTRY_FILE}`;
    const registryResponse = await fetch(registryUrl);
    
    let registry: RegistryEntry[] = [];
    
    if (registryResponse.ok) {
      registry = await registryResponse.json();
    }
    
    const registryPath = path.join(tempDir, REGISTRY_FILE);
    await fs.ensureDir(path.dirname(registryPath));
    
    const existingIndex = registry.findIndex(t => t.owner === owner && t.repo === repo);
    
    if (existingIndex !== -1) {
      console.log(chalk.yellow('\n⚠ Template already exists in registry. Updating...'));
      registry[existingIndex] = registryEntry;
    } else {
      registry.push(registryEntry);
    }
    
    await fs.writeJson(registryPath, registry, { spaces: 2 });
    
    console.log(chalk.blue('💾 Committing changes...'));
    process.chdir(tempDir);
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "Add/Update template: ${config.name}"`, { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    
    console.log(chalk.blue('🔀 Creating pull request...'));
    const prUrl = execSync(
      `gh pr create --repo ${REGISTRY_REPO} --title "Add template: ${config.name}" --body "Submitting template ${config.name} to the registry.\n\nPlatform: ${config.platform}\nDescription: ${config.description}"`,
      { encoding: 'utf-8' }
    ).trim();
    
    process.chdir('..');
    await fs.remove(tempDir);
    
    console.log(chalk.green.bold('\n✨ Template submitted successfully!\n'));
    console.log(chalk.cyan('Pull Request:'), chalk.white(prUrl));
    console.log(chalk.gray('\nYour template will be available once the PR is merged.'));
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('gh: command not found')) {
      console.log(chalk.red('\n❌ GitHub CLI (gh) is not installed'));
      console.log(chalk.yellow('\nManual submission steps:'));
      console.log(chalk.gray(`1. Fork the repository: https://github.com/${REGISTRY_REPO}`));
      console.log(chalk.gray(`2. Clone your fork`));
      console.log(chalk.gray(`3. Add your template to ${REGISTRY_FILE}`));
      console.log(chalk.gray(`4. Commit and push changes`));
      console.log(chalk.gray(`5. Create a pull request`));
    } else {
      throw error;
    }
  }
}