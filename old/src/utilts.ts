import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import validateNpmPackageName from 'validate-npm-package-name';
import type { PackageManager } from './types';

export function isValidPackageName(name: string): boolean {
  const validation = validateNpmPackageName(name);
  return validation.validForNewPackages;
}

export function toValidPackageName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-');
}

export function parseStackReference(template: string): { owner: string; repo: string } {
  const parts = template.split('/');
  if (parts.length !== 2) {
    throw new Error('Stack must be in format: owner/repo');
  }
  return { owner: parts[0], repo: parts[1] };
}

export async function directoryExists(dir: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dir);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export async function isDirectoryEmpty(dir: string): Promise<boolean> {
  const files = await fs.readdir(dir);
  return files.length === 0;
}

export function getPackageManagerCommand(
  pm: PackageManager,
  command: 'install' | 'run'
): string {
  const commands = {
    npm: { install: 'npm install', run: 'npm run' },
    pnpm: { install: 'pnpm install', run: 'pnpm' },
    yarn: { install: 'yarn', run: 'yarn' },
    bun: { install: 'bun install', run: 'bun' }
  };
  return commands[pm][command];
}

export async function detectPackageManager(): Promise<PackageManager> {
  const userAgent = process.env.npm_config_user_agent;
  if (!userAgent) return 'bun';
  
  if (userAgent.startsWith('pnpm')) return 'pnpm';
  if (userAgent.startsWith('yarn')) return 'yarn';
  if (userAgent.startsWith('bun')) return 'bun';
  if (userAgent.startsWith('npm')) return 'npm';
  return 'bun';
}

export function getDirname(importMetaUrl: string): string {
  return path.dirname(fileURLToPath(importMetaUrl));
}

export function detectPlatformFromStack(template: string): string | undefined {
  const lowerStack = template.toLowerCase();
  
  if (lowerStack.includes('remix')) return 'remix';
  if (lowerStack.includes('next')) return 'nextjs';
  if (lowerStack.includes('vite')) return 'vite';
  if (lowerStack.includes('vue')) return 'vue';
  if (lowerStack.includes('svelte')) return 'svelte';
  if (lowerStack.includes('astro')) return 'astro';
  if (lowerStack.includes('solid')) return 'solid';
  if (lowerStack.includes('qwik')) return 'qwik';
  if (lowerStack.includes('react') || lowerStack.includes('cra')) return 'react';
  
  return undefined;
}

export function detectTagsFromStack(template: string): string[] {
  const tags: string[] = [];
  const lowerStack = template.toLowerCase();
  
  if (lowerStack.includes('typescript') || lowerStack.includes('-ts')) tags.push('typescript');
  if (lowerStack.includes('javascript') || lowerStack.includes('-js')) tags.push('javascript');
  if (lowerStack.includes('tailwind')) tags.push('tailwind');
  if (lowerStack.includes('prisma')) tags.push('prisma');
  if (lowerStack.includes('postgres')) tags.push('postgresql');
  if (lowerStack.includes('sqlite')) tags.push('sqlite');
  if (lowerStack.includes('mongo')) tags.push('mongodb');
  if (lowerStack.includes('aws')) tags.push('aws');
  if (lowerStack.includes('cloudflare')) tags.push('cloudflare');
  if (lowerStack.includes('vercel')) tags.push('vercel');
  if (lowerStack.includes('react')) tags.push('react');
  
  return tags;
}