import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
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

function drawBox(title: string, content: string[], footer?: string): void {
  const width = 117;
  const horizontalLine = '─'.repeat(width - 2);
  
  console.log(`╭${horizontalLine}╮`);
  console.log(`│${title.padStart(Math.floor((width - 2 + title.length) / 2)).padEnd(width - 2)}│`);
  console.log(`├${horizontalLine}┤`);
  
  content.forEach(line => {
    console.log(`│ ${line.padEnd(width - 4)} │`);
  });
  
  if (footer) {
    console.log(`├${horizontalLine}┤`);
    console.log(`│${footer.padStart(Math.floor((width - 2 + footer.length) / 2)).padEnd(width - 2)}│`);
  }
  
  console.log(`╰${horizontalLine}╯`);
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
  drawBox(
    'GITHUB REPOSITORY REQUIRED',
    [
      chalk.yellow('⚠ No GitHub repository detected'),
      '',
      'Please push your project and create a public repository before continuing.',
    ]
  );
  
  const { hasRepo } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'hasRepo',
      message: 'Have you created a public GitHub repository?',
      default: false
    }
  ]);
  
  if (!hasRepo) {
    console.log(chalk.red('\nPlease create a public GitHub repository first'));
    process.exit(1);
  }
  
  const { repo } = await inquirer.prompt([
    {
      type: 'input',
      name: 'repo',
      message: 'Enter your GitHub repository (owner/repo):',
      validate: (value: string) => {
        const pattern = /^[\w-]+\/[\w-]+$/;
        return pattern.test(value) || 'Invalid format. Use: owner/repo';
      }
    }
  ]);
  
  if (!repo) {
    console.log(chalk.red('\nRepository is required'));
    process.exit(1);
  }
  
  return repo;
}

export async function runConfigWizard(): Promise<ConfigBifrost> {
  drawBox(
    'CONFIG.BIFROST WIZARD',
    [
      'This wizard will guide you through creating a config.bifrost file for your template.',
      '',
      'This configuration enables your template to be shared with the community.',
    ]
  );
  
  const configPath = path.join(process.cwd(), 'config.bifrost');
  
  if (await fs.pathExists(configPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'config.bifrost already exists. Overwrite?',
        default: false
      }
    ]);
    
    if (!overwrite) {
      const existingConfig = await fs.readJson(configPath);
      return existingConfig;
    }
  }
  
  const detectedRepo = await detectGitHubRepo();
  
  drawBox(
    'TEMPLATE INFORMATION',
    [
      'Provide basic information about your template.',
      '',
      'This helps users discover and understand your template.',
    ]
  );
  
  const responses = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Template name:',
      validate: (value: string) => value.trim().length > 0 || 'Name is required'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      validate: (value: string) => value.trim().length > 0 || 'Description is required'
    },
    {
      type: 'input',
      name: 'platform',
      message: 'Platform:',
      default: 'remix',
      validate: (value: string) => value.trim().length > 0 || 'Platform is required'
    },
    {
      type: 'input',
      name: 'github',
      message: 'GitHub repository (owner/repo):',
      default: detectedRepo || '',
      validate: (value: string) => {
        const pattern = /^[\w-]+\/[\w-]+$/;
        return pattern.test(value) || 'Invalid format. Use: owner/repo';
      }
    },
    {
      type: 'input',
      name: 'tags',
      message: 'Tags (comma-separated):',
      validate: (value: string) => value.trim().length > 0 || 'At least one tag is required'
    },
    {
      type: 'input',
      name: 'postInstall',
      message: 'Post-install scripts (comma-separated npm script names):',
      default: ''
    },
    {
      type: 'input',
      name: 'plugins',
      message: 'Plugins to include (comma-separated owner/repo):',
      default: ''
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
  
  drawBox(
    'SUCCESS',
    [
      chalk.green('✅ config.bifrost created successfully!'),
      '',
      'Configuration:',
      '',
      ...JSON.stringify(config, null, 2).split('\n').map(line => chalk.white(line)),
    ]
  );
  
  return config;
}