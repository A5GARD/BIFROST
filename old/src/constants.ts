// constants.ts
import { DefaultStack } from './types';

export interface PlatformTemplate {
  name: string;
  repo: string;
  description: string;
}

export interface Platform {
  name: string;
  templates?: Record<string, PlatformTemplate>;
  repo?: string;
  description?: string;
}

export const PLATFORMS: Record<string, Platform> = {
  'remix': {
    name: 'Remix',
    templates: {
      'remix-tutorial': {
        name: 'Tutorial',
        repo: '8an3/remixv2/templates/remix-tutorial',
        description: 'Great for learning Remix'
      },
      'remix': {
        name: 'Default (TypeScript)',
        repo: '8an3/remixv2/templates/remix',
        description: 'Standard Remix template'
      },
      'remix-javascript': {
        name: 'JavaScript',
        repo: '8an3/remixv2/templates/remix-javascript',
        description: 'Remix w/ plain JavaScript'
      },
      'express': {
        name: 'Express Server',
        repo: '8an3/remixv2/templates/express',
        description: 'Configure w/ Express.js'
      },
      'cloudflare-workers': {
        name: 'Cloudflare Workers',
        repo: '8an3/remixv2/templates/cloudflare-workers',
        description: 'Optimized Remix app'
      },
      'cloudflare': {
        name: 'Cloudflare Pages',
        repo: '8an3/remixv2/templates/cloudflare',
        description: 'Optimized for Cloudflare'
      },
      'spa': {
        name: 'Single Page App',
        repo: '8an3/remixv2/templates/spa',
        description: 'Remix in SPA mode'
      },
      'classic-remix-compiler-remix': {
        name: 'Classic Remix Compiler',
        repo: '8an3/remixv2/templates/classic-remix-compiler/remix',
        description: 'Original Remix compiler setup'
      },
      'classic-remix-compiler-arc': {
        name: 'Classic Remix Compiler Arc',
        repo: '8an3/remixv2/templates/classic-remix-compiler/arc',
        description: 'Original Remix compiler setup'
      },
      'classic-remix-compiler-cloudflare-pages': {
        name: 'Classic Remix Compiler Cloudflare Pages',
        repo: '8an3/remixv2/templates/classic-remix-compiler/cloudflare-pages',
        description: 'Original Remix compiler setup'
      },
      'classic-remix-compiler-cloudflare-workers': {
        name: 'Classic Remix Compiler Cloudflare Workers',
        repo: '8an3/remixv2/templates/classic-remix-compiler/cloudflare-workers',
        description: 'Original Remix compiler setup'
      },
      'classic-remix-compiler-deno': {
        name: 'Classic Remix Compiler Deno',
        repo: '8an3/remixv2/templates/classic-remix-compiler/deno',
        description: 'Original Remix compiler setup'
      },
      'classic-remix-compiler-fly': {
        name: 'Classic Remix Compiler Fly',
        repo: '8an3/remixv2/templates/classic-remix-compiler/fly',
        description: 'Original Remix compiler setup'
      },
      'classic-remix-compiler-remix-javascript': {
        name: 'Classic Remix Compiler Remix Javascript',
        repo: '8an3/remixv2/templates/classic-remix-compiler/remix-javascript',
        description: 'Original Remix compiler setup'
      }
    }
  },
  'cra': {
    name: 'Create React App',
    repo: 'facebook/create-react-app',
    description: 'Standard React application'
  },
  'vite-react': {
    name: 'Vite + React',
    repo: 'vitejs/vite/packages/create-vite/template-react-ts',
    description: 'Fast React development with Vite'
  },
  'nextjs': {
    name: 'Next.js',
    repo: 'vercel/next.js/examples/blog-starter',
    description: 'The React Framework for Production'
  },
  'vue': {
    name: 'Vue',
    repo: 'vuejs/create-vue',
    description: 'Progressive JavaScript Framework'
  },
  'svelte': {
    name: 'SvelteKit',
    repo: 'sveltejs/kit',
    description: 'Cybernetically enhanced web apps'
  },
  'astro': {
    name: 'Astro',
    repo: 'withastro/astro/examples/basics',
    description: 'Build faster websites'
  },
  'solid': {
    name: 'SolidStart',
    repo: 'solidjs/solid-start',
    description: 'Fine-grained reactive JavaScript'
  },
  'qwik': {
    name: 'Qwik',
    repo: 'BuilderIO/qwik',
    description: 'Instant-loading web apps'
  }
};


export const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const;

export const TEMP_DIR_PREFIX = 'bifrost-temp-';