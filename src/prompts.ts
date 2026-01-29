// src/prompts.ts
import prompts from 'prompts';
import { PLATFORMS, PACKAGE_MANAGERS } from './constants';
import type { PackageManager } from './types'; 
import { detectPackageManager } from './utilts';

export async function promptForMissingOptions(
  projectName?: string,
  template?: string,
  packageManager?: PackageManager,
  install?: boolean
): Promise<{
  projectName: string;
  template: string;
  packageManager: PackageManager;
  install: boolean;
  gitPush: boolean;
  runWizard: boolean;
  submitToRegistry: boolean;
}> {
  const detectedPM = await detectPackageManager();
  const questions: prompts.PromptObject[] = [];

  if (!projectName) {
    questions.push({
      type: 'text',
      name: 'projectName',
      message: 'What would you like to name your new project?',
      initial: 'my-bifrost-app',
      validate: (value: string) => {
        if (!value) return 'Project name is required';
        return true;
      }
    });
  }

  if (!template) {
    questions.push({
      type: 'select',
      name: 'platform',
      message: 'Which platform would you like to use?',
      choices: Object.entries(PLATFORMS).map(([key, platform]) => ({
        title: platform.name,
        value: key,
        description: platform.description || ''
      })),
      initial: 0
    });

    questions.push({
      type: (prev: string) => {
        const platform = PLATFORMS[prev];
        return platform.templates ? 'select' : null;
      },
      name: 'template',
      message: 'Select a template:',
      choices: (prev: string) => {
        const platform = PLATFORMS[prev];
        if (!platform.templates) return [];
        
        return Object.entries(platform.templates).map(([key, template]) => ({
          title: template.name,
          value: template.repo,
          description: template.description
        }));
      }
    });

    questions.push({
      type: (prev: string, values: any) => {
        const platformKey = values.platform;
        return platformKey === 'custom' ? 'text' : null;
      },
      name: 'customStack',
      message: 'Enter template (owner/repo):',
      validate: (value: string) => {
        if (!value || !value.includes('/')) {
          return 'Stack must be in format: owner/repo';
        }
        return true;
      }
    });
  }

  if (!packageManager) {
    questions.push({
      type: 'select',
      name: 'packageManager',
      message: 'Which package manager do you prefer?',
      choices: PACKAGE_MANAGERS.map(pm => ({
        title: pm,
        value: pm,
        selected: pm === detectedPM
      })),
      initial: PACKAGE_MANAGERS.indexOf(detectedPM)
    });
  }

  if (install === undefined) {
    questions.push({
      type: 'confirm',
      name: 'install',
      message: 'Would you like to have the install command run once the project has initialized?',
      initial: true
    });
  }

  questions.push({
    type: 'confirm',
    name: 'gitPush',
    message: 'Would you like to auto create and push the first commit to GitHub?',
    initial: false
  });

  questions.push({
    type: 'confirm',
    name: 'runWizard',
    message: 'Would you like to run the config.bifrost wizard?',
    initial: false
  });

  questions.push({
    type: 'confirm',
    name: 'submitToRegistry',
    message: 'Would you like to submit your template to the bifrost registry?',
    initial: false
  });

  const answers = await prompts(questions, {
    onCancel: () => {
      console.log('\nOperation cancelled');
      process.exit(0);
    }
  });

  let finalStack = template;
  
  if (!template) {
    if (answers.platform === 'custom') {
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
    template: finalStack!,
    packageManager: packageManager || answers.packageManager,
    install: install !== undefined ? install : answers.install,
    gitPush: answers.gitPush,
    runWizard: answers.runWizard,
    submitToRegistry: answers.submitToRegistry
  };
}