// src/types.ts
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export interface PluginFile {
  name: string;
  location: string;
}

export interface PluginConfig {
  name: string;
  description: string;
  platform: string;
  github: string;
  tags: string[];
  libraries: string[];
  files: PluginFile[];
}

export interface StackConfig {
  name: string;
  description: string;
  platform: string;
  github: string;
  tags: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  postInstall?: string[];
  plugins?: string[];
}

export interface CLIOptions {
  template?: string;
  pkgMgr?: PackageManager;
  noInstall?: boolean;
  help?: string
}

export interface ProjectContext {
  projectName: string;
  template: string;
  packageManager: PackageManager;
  install: boolean;
  gitPush: boolean;
}

export interface DefaultStack {
  owner: string;
  repo: string;
  description: string;
  platform: string;
  tags: string[];
}