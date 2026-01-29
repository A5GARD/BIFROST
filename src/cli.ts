// cli.ts
import { Command } from 'commander';
import chalk from 'chalk';
import type { CLIOptions, PackageManager, DefaultStack } from './types';
import { PACKAGE_MANAGERS } from './constants';
import { promptForMissingOptions } from './prompts';
import { createProject } from './creator';
import { toValidPackageName } from './utilts';
import { runConfigWizard } from './wizard';
import { submitTemplate } from './templateSubmitter';

async function loadRegistry(): Promise<DefaultStack[]> {
  const registryFile = Bun.file(new URL('../registry.bifrost', import.meta.url));
  return await registryFile.json();
}

export async function runCLI(argv: string[]): Promise<void> {
  const DEFAULT_STACKS = await loadRegistry();
  const program = new Command();

  program
    .name('@a5gard/bifrost')
    .description('Create a new project with platform-agnostic templates')
    .version('1.0.0')
    .argument('[projectName]', 'The project name')
    .option('-t, --template <owner/repo>', 'The template to use (format: owner/repo)')
    .option('-p, --pkg-mgr <pm>', `Package manager to use (${PACKAGE_MANAGERS.join(', ')})`)
    .option('--no-install', 'Skip dependency installation')
    .option('--list-templates', 'List all available community templates')
    .option('--wizard', 'Run config.bifrost wizard')
    .option('--submit', 'Submit template to bifrost registry')
    .option('-h, --help', 'Show help')
    .action(async (projectName: string | undefined, options: CLIOptions & { listTemplates?: boolean; wizard?: boolean; submit?: boolean }) => {
      if (options.help) {
        showHelp();
        process.exit(0);
      }

      if (options.listTemplates) {
        showTemplates(DEFAULT_STACKS);
        process.exit(0);
      }

      if (options.wizard) {
        await runConfigWizard();
        process.exit(0);
      }

      if (options.submit) {
        await submitTemplate();
        process.exit(0);
      }

      try {
        if (options.pkgMgr && !PACKAGE_MANAGERS.includes(options.pkgMgr as PackageManager)) {
          console.error(chalk.red(`Invalid package manager. Must be one of: ${PACKAGE_MANAGERS.join(', ')}`));
          process.exit(1);
        }

        let finalProjectName = projectName;
        let finalStack = options.template;
        let finalPackageManager = options.pkgMgr as PackageManager | undefined;
        let finalInstall = options.noInstall === false;

        const prompted = await promptForMissingOptions(
          finalProjectName,
          finalStack,
          finalPackageManager,
          finalInstall ? undefined : false
        );
        
        finalProjectName = prompted.projectName;
        finalStack = prompted.template;
        finalPackageManager = prompted.packageManager;
        finalInstall = prompted.install;
        const gitPush = prompted.gitPush;
        const runWizard = prompted.runWizard;
        const submitToRegistry = prompted.submitToRegistry;

        const validProjectName = toValidPackageName(finalProjectName);

        await createProject({
          projectName: validProjectName,
          template: finalStack,
          packageManager: finalPackageManager,
          install: finalInstall,
          gitPush
        });

        if (runWizard) {
          await runConfigWizard();
        }

        if (submitToRegistry) {
          await submitTemplate();
        }

      } catch (error) {
        console.error();
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
        console.error();
        process.exit(1);
      }
    });

  await program.parseAsync(argv);
}

export function showHelp(): void {
  console.log(`
${chalk.bold('Usage:')}

  ${chalk.cyan('$ bunx @a5gard/bifrost')} ${chalk.gray('<projectName> <...options>')}

${chalk.bold('Examples:')}

  ${chalk.cyan('$ bunx @a5gard/bifrost')}
  ${chalk.cyan('$ bunx @a5gard/bifrost my-app')}
  ${chalk.cyan('$ bunx @a5gard/bifrost my-app --template remix-run/indie-template')}
  ${chalk.cyan('$ bunx @a5gard/bifrost my-app -s owner/repo -p bun')}
  ${chalk.cyan('$ bunx @a5gard/bifrost my-app -s owner/repo --no-install')}
  ${chalk.cyan('$ bunx @a5gard/bifrost --list-templates')}
  ${chalk.cyan('$ bunx @a5gard/bifrost --wizard')}
  ${chalk.cyan('$ bunx @a5gard/bifrost --submit')}

${chalk.bold('Options:')}

  ${chalk.cyan('--help, -h')}          Print this help message
  ${chalk.cyan('--version, -V')}       Print the CLI version
  ${chalk.cyan('--template, -s')}         Stack to use (format: owner/repo)
  ${chalk.cyan('--pkg-mgr, -p')}       Package manager (npm, pnpm, yarn, bun)
  ${chalk.cyan('--no-install')}        Skip dependency installation
  ${chalk.cyan('--list-templates')}    List all available community templates
  ${chalk.cyan('--wizard')}            Run config.bifrost wizard
  ${chalk.cyan('--submit')}            Submit template to bifrost registry
  `);
}

export function showTemplates(DEFAULT_STACKS: DefaultStack[]): void {
  console.log();
  console.log(chalk.bold('Available Community Templates'));
  console.log();

  const groupedByPlatform = DEFAULT_STACKS.reduce((acc, template) => {
    if (!acc[template.platform]) {
      acc[template.platform] = [];
    }
    acc[template.platform].push(template);
    return acc;
  }, {} as Record<string, typeof DEFAULT_STACKS>);

  Object.entries(groupedByPlatform).forEach(([platform, template]) => {
    console.log(chalk.bold.cyan(`${platform.toUpperCase()}`));
    console.log();
    
    template.forEach(template => {
      console.log(`  ${chalk.green('›')} ${chalk.bold(`${template.owner}/${template.repo}`)}`);
      console.log(`    ${chalk.gray(template.description)}`);
      console.log(`    ${chalk.gray(`Tags: ${template.tags.join(', ')}`)}`);
      console.log();
    });
  });

  console.log(chalk.gray('Use any template with: ') + chalk.cyan('bunx @a5gard/bifrost my-app --template owner/repo'));
  console.log();
}