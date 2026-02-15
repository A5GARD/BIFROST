import { execa } from 'execa';
import type { PackageManager } from './types'; 
import { getPackageManagerCommand } from './utilts';

export async function installDependencies(
  projectDir: string,
  packageManager: PackageManager
): Promise<void> {
  const installCommand = getPackageManagerCommand(packageManager, 'install');
  const [cmd, ...args] = installCommand.split(' ');
  
  await execa(cmd, args, {
    cwd: projectDir,
    stdio: 'inherit'
  });
}

export async function runPostInstallScripts(
  projectDir: string,
  packageManager: PackageManager,
  scripts: string[] 
): Promise<void> {
  for (const script of scripts) {
    const runCommand = getPackageManagerCommand(packageManager, 'run');
    const [cmd, ...baseArgs] = runCommand.split(' ');
    const args = [...baseArgs, script];
    
    try {
      await execa(cmd, args, {
        cwd: projectDir,
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn(`Warning: Post-install script "${script}" failed`);
    }
  }
}