# create-bifrost

Platform-agnostic project creator with extensible template system inspired by Remix Stacks.

## Features

- 🌈 **Platform Agnostic**: Works with any framework (Remix, Next.js, Vite, etc.)
- 📦 **Multiple Package Managers**: Support for npm, pnpm, yarn, and bun
- 🎯 **Git-based Stacks**: Use any GitHub repository as a template
- 🚀 **Interactive CLI**: Guided setup with smart prompts
- ⚡ **Fast Setup**: Clone, configure, and install in seconds
- 🔄 **Auto Git Push**: Optionally push initial commit to GitHub

## Usage

### Interactive Mode

```bash
bunx create-bifrost
```

In interactive mode, the following prompts will display:
- What would you like to name your new project?
- Which platform would you like to use?
- Which package manager do you prefer?
- Would you like to have the install command run once the project has initialized?
- Would you like to auto create and push the first commit to GitHub?

### With Options

```bash
bunx create-bifrost my-app --template owner/repo --pkg-mgr bun
```

### Full Example

```bash
bunx create-bifrost my-app -s remix-run/indie-template -p bun
```

### Platform Templates

```bash
bunx create-bifrost my-app --list-templates
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--template` | `-s` | Stack to use (format: owner/repo) |
| `--pkg-mgr` | `-p` | Package manager (npm, pnpm, yarn, bun) |
| `--no-install` | | Skip dependency installation |
| `--help` | `-h` | Show help |
| `--version` | `-V` | Show version |

## Creating Your Own Template

Any GitHub repository can be used as a template. To make this process easier whenenver you create a project based off of a platforms base installer, a config file will be created for you in order to create and post your own template. If you want to create your own template based off of another, the original templates config will already be located within the root folder. All you have to do is edit the config in order meet your newly created projects use case needs.

```bash
bunx create-bifrost my-app --template name/repo
```

### Stack Configuration (Optional)

Add a `config.bifrost` to your repository root for enhanced functionality:

```json
{
  "name": "My Stack",
  "description": "A custom template for X platform",
  "platform": "remix",
  "github": "owner/repo",
  "tags": ["react", "typescript", "tailwind"],
  "postInstall": ["setup", "db:generate"],
  "plugins": ["owner/plugin1", "owner/plugin2"]
}
```

## Installing A Plugin

Once your project has completed its installation process, you may now cd into the newly created directory and run

```bash
bunx bifrost-plugin
```

Entering interactive mode it will then obtain the list of available plugins to choose from the bifrost-plugin repo (owner `8an3`) from the file labeled `registry.bifrost`

or you may use the supplied method 

```bash
bunx bifrost-plugin otp-auth-plugin
```

Which will immediatly start the installation process, after scanning your projects config.bifrost to see if the platforms match for compatibility to ensure you are installing the correct plugin.

## Creating your own plugin

Plugins are to be made with their own repo so as it can host all the required files for the plugin. 
The repo is required to include a json config file labeled `plugin.bifrost` and a folder labeled `files` where it will host all the required files.
When installing a plugin it will prompt the user to either confirm the default supplied file location or the use can also edit the location to suite their use cases needs.

### plugin.bifrost

```json
{
  "name": "otp-auth-plugin",
  "description": "A custom one time password auth plugin for the remix platform",
  "platform": "remix",
  "github": "8an3/otp-auth-plugin",
  "tags": ["remix-run", "auth", "one-time-password"],
  "libraries": ["remix-auth-totp","remix-auth","@catalystsoftware/icons","@prisma/client","resend"],
  "files": [
        {
        "name": "email.tsx",
        "location": "app/components/catalyst-ui/utils/email.tsx"
        },
        {
        "name": "client-auth.tsx",
        "location": "app/components/catalyst-ui/utils/client-auth.tsx"
        },
        {
        "name": "auth-session.ts",
        "location": "app/components/catalyst-ui/utils/auth-session.ts"
        },
        {
        "name": "prisma.ts",
        "location": "app/components/catalyst-ui/utils/prisma.ts"
        },
        {
        "name": "login.tsx",
        "location": "app/routes/auth/login.tsx"
        },
        {
        "name": "lougout.tsx",
        "location": "app/routes/auth/lougout.tsx"
        },
        {
        "name": "signup.tsx",
        "location": "app/routes/auth/signup.tsx"
        },
        {
        "name": "magic-link.tsx",
        "location": "app/routes/auth/magic-link.tsx"
        },
             {
        "name": "verify.tsx",
        "location": "app/routes/auth/verify.tsx"
        },
    ],
    "configs":[]
}
```

## Searching / Posting Templates and Plugins

Shortly a site will be available for use where you can search for templates and plugins.

Feature two tabs, both tabs will host a filtering section located to the left of the pages content and a search bar located at the top of each tabs section. Allowing you to filter by platform, tags, etc meanwhile the search bar will allow you to search for individual templates or plugins for you to use.

### Templates

Each template result will display:
- name
- description
- platform
- command line to install the template
- tags
- any plugins that are to be included with the templates installation 

### Plugins

Each plugin result will display
- name
- description
- platform
- command line to install the plugin
- tags
- required libraries
- required files

### Submitting

Whether its a template or plugin, you will have the ability to submit your own to be included with its respective registry, this step is not required or needed but will help in its overall discoverability.
All you have to do in order to submit is supply your templates or plugins config file once you start the submission process. The pages nav bar will host a `submit` button in order to start the process.

Upon submission the website will automatically update the relevant registry file and push the update to github to ensure the process is automated.
