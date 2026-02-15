import inquirer from 'inquirer';
import chalk from 'chalk';
import type { CLIOptions, PackageManager } from './types';
import { PACKAGE_MANAGERS, PLATFORMS } from './constants';
import { createProject } from './creator';
import { toValidPackageName } from './utilts';
import { runConfigWizard } from './wizard';
import { submitTemplate } from './templateSubmitter';

const VERSION = '1.0.0'

async function loadRegistry(): Promise<any[]> {
  const registryFile = Bun.file(new URL('../dist/registry.bifrost', import.meta.url));
  return await registryFile.json();
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

async function promptMainMenu(): Promise<string> {
  drawBox(
    '@a5gard/bifrost',
    [
      'Platform-agnostic project creator with extensible template system.',
      '',
      'Choose an action to get started.',
    ]
  );

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Create a new project', value: 'create' },
        { name: 'config.bifrost wizard', value: 'wizard' },
        { name: 'Submit template to bifrost registry', value: 'submit' }
      ]
    }
  ]);

  return action;
}

async function promptProjectName(): Promise<string> {
  drawBox(
    'PROJECT SETUP',
    [
      'Enter a name for your new project.',
      '',
      'This will be used as the directory name and package name.',
    ]
  );
  
  const { projectName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'What would you like to name your new project?',
      validate: (input: string) => {
        if (!input.trim()) return 'Project name is required';
        return true;
      }
    }
  ]);
  
  return projectName;
}

async function promptPlatform(): Promise<string> {
  drawBox(
    'SELECT PLATFORM',
    [
      'Choose the platform/framework for your new project.',
      '',
      'Available platforms are listed below.',
    ]
  );

  const platformChoices = Object.entries(PLATFORMS).map(([key, platform]) => ({
    name: platform.name,
    value: key
  }));

  const { platform } = await inquirer.prompt([
    {
      type: 'list',
      name: 'platform',
      message: 'Which platform would you like to use?',
      choices: platformChoices
    }
  ]);

  return platform;
}

async function promptTemplateChoice(platform: string): Promise<{ useTemplate: boolean; template?: string }> {
  const platformData = PLATFORMS[platform];
  
  if (!platformData.templates) {
    return { useTemplate: false };
  }

  drawBox(
    'INSTALLATION TYPE',
    [
      'Choose between the platform default or select from available templates.',
      '',
      'Templates provide pre-configured setups for specific use cases.',
    ]
  );

  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Do you prefer to use the platform\'s default install or would you like to opt for a template instead?',
      choices: [
        { name: 'Platform Default', value: 'default' },
        { name: 'Choose Template', value: 'template' }
      ]
    }
  ]);

  if (choice === 'default') {
    const templateKeys = Object.keys(platformData.templates);
    if (templateKeys.length === 1) {
      return { useTemplate: true, template: platformData.templates[templateKeys[0]].repo };
    }

    drawBox(
      `${platformData.name.toUpperCase()} DEFAULT OPTIONS`,
      [
        'This platform offers multiple default starter options.',
        '',
        'Select the one that best fits your needs.',
      ]
    );

    const defaultChoices = Object.entries(platformData.templates).map(([key, tmpl]) => ({
      name: `${tmpl.name} - ${tmpl.description}`,
      value: tmpl.repo,
      short: tmpl.name
    }));

    const { template } = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Which default would you like to use?',
        choices: defaultChoices
      }
    ]);

    return { useTemplate: true, template };
  }

  const registry = await loadRegistry();
  const platformTemplates = registry.filter((t: any) => t.platform === platform);

  if (platformTemplates.length === 0) {
    console.log(chalk.yellow('No community templates available for this platform. Using default.'));
    const templateKeys = Object.keys(platformData.templates);
    return { useTemplate: true, template: platformData.templates[templateKeys[0]].repo };
  }

  drawBox(
    `${platformData.name.toUpperCase()} TEMPLATES`,
    [
      'Select a community template from the available options below.',
      '',
      'Each template includes specific configurations and best practices.',
    ]
  );

  const templateChoices = platformTemplates.map((t: any) => ({
    name: `${t.owner}/${t.repo} - ${t.description}`,
    value: `${t.owner}/${t.repo}`,
    short: `${t.owner}/${t.repo}`
  }));

  const { template } = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Which template would you like to use?',
      choices: templateChoices
    }
  ]);

  return { useTemplate: true, template };
}

async function promptPackageManager(): Promise<PackageManager> {
  drawBox(
    'PACKAGE MANAGER',
    [
      'Select your preferred package manager for dependency installation.',
      '',
      'Supported: npm, pnpm, yarn, bun',
    ]
  );

  const { packageManager } = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: 'Which package manager do you prefer?',
      choices: PACKAGE_MANAGERS.map(pm => ({ name: pm, value: pm }))
    }
  ]);

  return packageManager as PackageManager;
}

async function promptAdditionalOptions(): Promise<{
  tailwindBase: boolean;
  tailwindNgin: boolean;
  midgardr: boolean;
  baldr: boolean;
  install: boolean;
  gitPush: boolean;
}> {
  drawBox(
    'ADDITIONAL OPTIONS',
    [
      'Configure additional features and tools for your project.',
      '',
      'Would you like tailwind and its requirements to be installed and configured:',
    ]
  );

  const { options } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'options',
      message: 'Select the options you would like to include (use spacebar to toggle):',
      choices: [
        { name: 'Using the base tailwind config', value: 'tailwindBase' },
        { name: 'Using the preset ngin', value: 'tailwindNgin' },
        { name: 'Pre-install MIÐGARÐR UI components', value: 'midgardr' },
        { name: 'Pre-install @a5gard/baldr icons', value: 'baldr' },
        { name: 'Auto install the project\'s libraries once the project has initialized', value: 'install', checked: true },
        { name: 'Auto create and push the first commit to GitHub', value: 'gitPush' }
      ]
    }
  ]);

  return {
    tailwindBase: options.includes('tailwindBase'),
    tailwindNgin: options.includes('tailwindNgin'),
    midgardr: options.includes('midgardr'),
    baldr: options.includes('baldr'),
    install: options.includes('install'),
    gitPush: options.includes('gitPush')
  };
}

function showTemplates(registry: any[], platformFilter?: string): void {
  let filteredTemplates = registry;
  
  if (platformFilter) {
    filteredTemplates = registry.filter((t: any) => t.platform === platformFilter);
    if (filteredTemplates.length === 0) {
      console.log(chalk.yellow(`No templates found for platform: ${platformFilter}`));
      return;
    }
  }

  const groupedByPlatform = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.platform]) {
      acc[template.platform] = [];
    }
    acc[template.platform].push(template);
    return acc;
  }, {} as Record<string, typeof filteredTemplates>);

  console.log();
  drawBox(
    'AVAILABLE COMMUNITY TEMPLATES',
    Object.entries(groupedByPlatform).flatMap(([platform, templates]: any) => {
      const lines = [
        '',
        chalk.bold.cyan(platform.toUpperCase()),
        ''
      ];
      
      templates.forEach((template: any) => {
        lines.push(`  ${chalk.green('›')} ${chalk.bold(`${template.owner}/${template.repo}`)}`);
        lines.push(`    ${chalk.gray(template.description)}`);
        lines.push(`    ${chalk.gray(`Tags: ${template.tags.join(', ')}`)}`);
        lines.push('');
      });
      
      return lines;
    })
  );
  
  console.log();
  console.log(chalk.gray('Use any template with: ') + chalk.cyan('bunx @a5gard/bifrost my-app --template owner/repo'));
  console.log();
}

function showHelp(): void {
  drawBox(
    'BIFROST CLI HELP',
    [
chalk.white("BIFRÖST unifies the fragmented landscape of project starters. Instead of learning npx create-remix, npx create-next-app, npx create-vite, and so on—use one CLI for all platforms with community-driven templates and a plugin system."),
chalk.white("Whenever a platform has been selected, you have the option of using the default installer provided by the platform's creators, or you may opt instead to use a configured template that was created by other developers."),
chalk.white("Templates are opinionated variants that will include file scaffolding, configurations in place to meet the needed requirements, route files, pre-installed libraries and more."),
chalk.white("Allowing you to hit the ground running when starting a new project, instead of wasting time or getting bogged down with all the required to-do items whenever a new app is created."),
chalk.white("Currently focusing on React-based platforms. Once the details are ironed out, that focus will be expanded upon however I can."),
'',
chalk.white("BIFRÖST is not only striving to fill a gap where no one else has even really attempted, but also introducing a plugin system that can be used with, alongside, or on its own with the default installer."),
chalk.white("A plugin will contain everything needed to add that feature to your project. For example, one-time password authentication for Remix Run. The plugin will contain and install all required route files, create/update all required configuration files, and will ensure all required libraries are installed within the project."),
chalk.white("Once the plugin's installation process has completed, other than setting up your own personal Resend account, the plugin will be ready to use."),
chalk.white(""),
chalk.white("Another benefit that has come from the plugin system: for developers that can't live with a one-template-fits-all lifestyle. Instead, create a bare-bones essential app where only the libraries, configs, and routes that are absolutely essential, no matter the scenario, are included."),
chalk.white("At which time, instead of configuring several time-consuming full-stack variations, you can create plugins to fill in the needs of whatever use case you can think of. So instead of having several projects that need not only to be taken care of in all the forms that are required, where at times you will be updating the same configs and libraries across all variants."),
chalk.white("Because we don't want to deal with all of the headaches that come along with it, not to mention the time spent going that route. In its place, have one app that will serve as the foundation for all the plugins."),
chalk.white("In the end, there's one app and one plugin to take care of instead of updating the same auth library across 4, 5, or whatever number of applications."),
chalk.white(""),
      '',
      chalk.bold('Usage:'),
      '',
      `  ${chalk.cyan('$ bunx @a5gard/bifrost')} ${chalk.gray('<projectName> <...options>')}`,
      '',
      chalk.bold('Examples:'),
      '',
      `  ${chalk.cyan('$ bunx @a5gard/bifrost')}`,
      `  ${chalk.cyan('$ bunx @a5gard/bifrost my-app')}`,
      `  ${chalk.cyan('$ bunx @a5gard/bifrost my-app --template remix-run/indie-template')}`,
      `  ${chalk.cyan('$ bunx @a5gard/bifrost my-app -t owner/repo -p bun')}`,
      `  ${chalk.cyan('$ bunx @a5gard/bifrost my-app -t owner/repo --no-install')}`,
      `  ${chalk.cyan('$ bunx @a5gard/bifrost --list-templates')}`,
      `  ${chalk.cyan('$ bunx @a5gard/bifrost --list-templates remix')}`,
      `  ${chalk.cyan('$ bunx @a5gard/bifrost --wizard')}`,
      `  ${chalk.cyan('$ bunx @a5gard/bifrost --submit')}`,
      '',
      chalk.bold('Options:'),
      '',
      `  ${chalk.cyan('--help, -h')}          Print this help message`,
      `  ${chalk.cyan('--version, -V')}       Print the CLI version`,
      `  ${chalk.cyan('--template, -t')}      Template to use (format: owner/repo)`,
      `  ${chalk.cyan('--pkg-mgr, -p')}       Package manager (npm, pnpm, yarn, bun)`,
      `  ${chalk.cyan('--no-install')}        Skip dependency installation`,
      `  ${chalk.cyan('--list-templates')}    List all available community templates`,
      `  ${chalk.cyan('--wizard')}            Run config.bifrost wizard`,
      `  ${chalk.cyan('--submit')}            Submit template to bifrost registry`,
      ''
    ]
  );
}

export async function runCLI(argv: string[]): Promise<void> {
  const registry = await loadRegistry();
  
  const args = argv.slice(2);
  const flags: Record<string, string | boolean> = {};
  let projectName: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      flags.help = true;
    } else if (arg === '--version' || arg === '-V') {
      flags.version = true;
    } else if (arg === '--list-templates') {
      flags.listTemplates = true;
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        flags.platform = args[++i];
      }
    } else if (arg === '--wizard') {
      flags.wizard = true;
    } else if (arg === '--submit') {
      flags.submit = true;
    } else if (arg === '--no-install') {
      flags.noInstall = true;
    } else if (arg === '--template' || arg === '-t') {
      flags.template = args[++i];
    } else if (arg === '--pkg-mgr' || arg === '-p') {
      flags.pkgMgr = args[++i];
    } else if (!arg.startsWith('-') && !projectName) {
      projectName = arg;
    }
  }

  if (flags.help) {
    showHelp();
    process.exit(0);
  }

  if (flags.version) {
    console.log(`BIFRÖST V${VERSION}`);
    process.exit(0);
  }

  if (flags.listTemplates) {
    showTemplates(registry, flags.platform as string | undefined);
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
    if (flags.pkgMgr && !PACKAGE_MANAGERS.includes(flags.pkgMgr as PackageManager)) {
      console.error(chalk.red(`Invalid package manager. Must be one of: ${PACKAGE_MANAGERS.join(', ')}`));
      process.exit(1);
    }

    let action = 'create';
    let finalProjectName = projectName;
    let finalTemplate = flags.template as string | undefined;
    let finalPackageManager = flags.pkgMgr as PackageManager | undefined;
    let finalInstall = flags.noInstall ? false : undefined;
    let tailwindBase = false;
    let tailwindNgin = false;
    let midgardr = false;
    let baldr = false;
    let gitPush = false;

    if (!projectName && !flags.template) {
      action = await promptMainMenu();
      
      if (action === 'wizard') {
        await runConfigWizard();
        process.exit(0);
      }
      
      if (action === 'submit') {
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
    finalInstall = finalInstall !== undefined ? finalInstall : additionalOptions.install;
    gitPush = additionalOptions.gitPush;

    const validProjectName = toValidPackageName(finalProjectName);

    await createProject({
      projectName: validProjectName,
      template: finalTemplate!,
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
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
    console.error();
    process.exit(1);
  }
}