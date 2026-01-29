import fs from 'fs-extra';
import path from 'path';

export async function updatePackageJson(
  projectDir: string,
  projectName: string
): Promise<void> {
  const packageJsonPath = path.join(projectDir, 'package.json');
  
  if (!(await fs.pathExists(packageJsonPath))) {
    const defaultPackageJson = {
      name: projectName,
      version: '0.0.1',
      private: true
    };
    await fs.writeJson(packageJsonPath, defaultPackageJson, { spaces: 2 });
    return;
  }

  const packageJson = await fs.readJson(packageJsonPath);
  packageJson.name = projectName;
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

export async function readStackConfig(projectDir: string): Promise<any> {
  const configPath = path.join(projectDir, 'config.bifrost');
  
  if (!(await fs.pathExists(configPath))) {
    return null;
  }

  return await fs.readJson(configPath);
}

export async function createBifrostConfig(
  projectDir: string,
  projectName: string,
  template: string,
  platform?: string,
  tags?: string[],
  existingConfig?: any
): Promise<void> {
  const configPath = path.join(projectDir, 'config.bifrost');
  
  if (await fs.pathExists(configPath)) {
    return;
  }

  const config = {
    name: projectName,
    description: existingConfig?.description || '',
    platform: platform || existingConfig?.platform || 'unknown',
    github: template,
    tags: tags || existingConfig?.tags || [],
    postInstall: existingConfig?.postInstall || [],
    plugins: existingConfig?.plugins || []
  };

  await fs.writeJson(configPath, config, { spaces: 2 });
}