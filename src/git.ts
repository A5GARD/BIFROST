import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { TEMP_DIR_PREFIX } from './constants';

export async function isGitInstalled(): Promise<boolean> {
  try {
    await execa('git', ['--version']);
    return true;
  } catch {
    return false;
  }
}

export async function cloneRepository(
  owner: string,
  repo: string,
  targetDir: string
): Promise<void> {
  const gitInstalled = await isGitInstalled();
  if (!gitInstalled) {
    throw new Error('Git is not installed. Please install Git and try again.');
  }

  const repoUrl = `https://github.com/${owner}/${repo}.git`;
  const tempDir = path.join(os.tmpdir(), `${TEMP_DIR_PREFIX}${Date.now()}`);

  try {
    await execa('git', ['clone', '--depth', '1', repoUrl, tempDir]);
    await fs.remove(path.join(tempDir, '.git'));
    await fs.copy(tempDir, targetDir, { overwrite: true });
    await fs.remove(tempDir);
  } catch (error) {
    await fs.remove(tempDir).catch(() => {});
    
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('not exist')) {
        throw new Error(`Repository ${owner}/${repo} not found or inaccessible`);
      }
    }
    throw error;
  }
}

export async function initializeGitRepo(projectDir: string): Promise<void> {
  try {
    await execa('git', ['init'], { cwd: projectDir });
    await execa('git', ['add', '.'], { cwd: projectDir });
    await execa('git', ['commit', '-m', 'Initial commit from create-bifrost'], { cwd: projectDir });
  } catch {
    return;
  }
}

export async function pushToGitHub(projectDir: string): Promise<void> {
  try {
    const { stdout: remoteUrl } = await execa('git', ['remote', 'get-url', 'origin'], { cwd: projectDir });
    if (!remoteUrl) {
      throw new Error('No remote origin found');
    }
    await execa('git', ['push', '-u', 'origin', 'main'], { cwd: projectDir });
  } catch (error) {
    const mainExists = await execa('git', ['rev-parse', '--verify', 'main'], { cwd: projectDir, reject: false });
    const masterExists = await execa('git', ['rev-parse', '--verify', 'master'], { cwd: projectDir, reject: false });
    
    const branch = mainExists.exitCode === 0 ? 'main' : masterExists.exitCode === 0 ? 'master' : 'main';
    
    try {
      await execa('git', ['push', '-u', 'origin', branch], { cwd: projectDir });
    } catch {
      throw new Error('Failed to push to GitHub. Ensure you have a remote repository set up and proper permissions.');
    }
  }
}