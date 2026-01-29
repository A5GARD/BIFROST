// src/wizard.ts

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import prompts from 'prompts';
import { execSync } from 'child_process';

interface ConfigBifrost {
  name: string;
  description: string;
  platform: string;
  github: string;
  tags: string[];
  postInstall: string[];
  plugins: string[];
}

async function detectGitHubRepo(): Promise<string | null> {
  try {
    const remote = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();
    const match = remote.match(/github\.com[:/](.+?)(?:\.git)?$/);
    if (match) {
      return match[1];
    }
  } catch {}
  
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      if (packageJson.repository) {
        const repoUrl = typeof packageJson.repository === 'string' 
          ? packageJson.repository 
          : packageJson.repository.url;
        const match = repoUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
        if (match) {
          return match[1];
        }
      }
    }
  } catch {}
  
  return null;
}

async function promptForGitHubRepo(): Promise<string> {
  console.log(chalk.yellow('\n⚠ No GitHub repository detected'));
  console.log(chalk.gray('Please push your project and create a public repository\n'));
  
  const { hasRepo } = await prompts({
    type: 'confirm',
    name: 'hasRepo',
    message: 'Have you created a public GitHub repository?',
    initial: false
  });
  
  if (!hasRepo) {
    console.log(chalk.red('\nPlease create a public GitHub repository first'));
    process.exit(1);
  }
  
  const { repo } = await prompts({
    type: 'text',
    name: 'repo',
    message: 'Enter your GitHub repository (owner/repo):',
    validate: (value) => {
      const pattern = /^[\w-]+\/[\w-]+$/;
      return pattern.test(value) || 'Invalid format. Use: owner/repo';
    }
  });
  
  if (!repo) {
    console.log(chalk.red('\nRepository is required'));
    process.exit(1);
  }
  
  return repo;
}

export async function runConfigWizard(): Promise<ConfigBifrost> {
  console.log(chalk.blue.bold('\n🧙 Config.bifrost Wizard\n'));
  
  const configPath = path.join(process.cwd(), 'config.bifrost');
  
  if (await fs.pathExists(configPath)) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: 'config.bifrost already exists. Overwrite?',
      initial: false
    });
    
    if (!overwrite) {
      const existingConfig = await fs.readJson(configPath);
      return existingConfig;
    }
  }
  
  const detectedRepo = await detectGitHubRepo();
  
  const responses = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'Template name:',
      validate: (value) => value.trim().length > 0 || 'Name is required'
    },
    {
      type: 'text',
      name: 'description',
      message: 'Description:',
      validate: (value) => value.trim().length > 0 || 'Description is required'
    },
    {
      type: 'text',
      name: 'platform',
      message: 'Platform:',
      initial: 'remix',
      validate: (value) => value.trim().length > 0 || 'Platform is required'
    },
    {
      type: 'text',
      name: 'github',
      message: 'GitHub repository (owner/repo):',
      initial: detectedRepo || '',
      validate: (value) => {
        const pattern = /^[\w-]+\/[\w-]+$/;
        return pattern.test(value) || 'Invalid format. Use: owner/repo';
      }
    },
    {
      type: 'text',
      name: 'tags',
      message: 'Tags (comma-separated):',
      validate: (value) => value.trim().length > 0 || 'At least one tag is required'
    },
    {
      type: 'text',
      name: 'postInstall',
      message: 'Post-install scripts (comma-separated npm script names):',
      initial: ''
    },
    {
      type: 'text',
      name: 'plugins',
      message: 'Plugins to include (comma-separated owner/repo):',
      initial: ''
    }
  ]);
  
  if (!responses.name) {
    console.log(chalk.red('\nWizard cancelled'));
    process.exit(1);
  }
  
  if (!detectedRepo && !responses.github) {
    responses.github = await promptForGitHubRepo();
  }
  
  const config: ConfigBifrost = {
    name: responses.name,
    description: responses.description,
    platform: responses.platform,
    github: responses.github,
    tags: responses.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
    postInstall: responses.postInstall ? responses.postInstall.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    plugins: responses.plugins ? responses.plugins.split(',').map((p: string) => p.trim()).filter(Boolean) : []
  };
  
  await fs.writeJson(configPath, config, { spaces: 2 });
  
  console.log(chalk.green('\n✅ config.bifrost created successfully!\n'));
  console.log(chalk.cyan('Configuration:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.white(JSON.stringify(config, null, 2)));
  console.log(chalk.gray('─'.repeat(50)));
  
  return config;
}