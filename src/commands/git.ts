/**
 * Git Commands - 35 commands for Git operations
 */

import { Command, CommandCategory, CommandResult } from './Command'

// Git Basic Commands
export const gitInitCommand: Command = {
  name: 'git-init',
  description: 'Initialize a new Git repository',
  category: CommandCategory.GENERAL,
  aliases: ['git-new', 'init-repo'],
  usage: '/git-init [--bare] [--branch <name>]',
  examples: ['/git-init', '/git-init --branch main', '/git-init --bare'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git init'
      if (args.flags?.bare) cmd += ' --bare'
      if (args.flags?.branch) cmd += ` --initial-branch=${args.flags.branch}`
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output,
        data: { initialized: true },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git init failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitCloneCommand: Command = {
  name: 'git-clone',
  description: 'Clone a Git repository',
  category: CommandCategory.GENERAL,
  aliases: ['clone', 'git-clone-repo'],
  usage: '/git-clone <url> [--branch <name>] [--depth <n>] [--directory <dir>]',
  examples: ['/git-clone https://github.com/user/repo.git', '/git-clone https://github.com/user/repo.git --depth 1'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    const url = args.positional[0]
    
    if (!url) {
      return {
        success: false,
        display: 'Error: Missing repository URL. Usage: /git-clone <url>',
      }
    }
    
    try {
      let cmd = `git clone ${url}`
      if (args.flags?.branch) cmd += ` --branch ${args.flags.branch}`
      if (args.flags?.depth) cmd += ` --depth ${args.flags.depth}`
      if (args.flags?.directory) cmd += ` ${args.flags.directory}`
      
      const output = execSync(cmd, { timeout: 120000 }).toString()
      
      return {
        success: true,
        display: `Repository cloned successfully\n${output}`,
        data: { url, cloned: true },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git clone failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitStatusCommand: Command = {
  name: 'git-status',
  description: 'Show working tree status',
  category: CommandCategory.GENERAL,
  aliases: ['status', 'git-st'],
  usage: '/git-status [--short] [--branch]',
  examples: ['/git-status', '/git-status --short'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git status'
      if (args.flags?.short) cmd += ' --short'
      if (args.flags?.branch) cmd += ' --branch'
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output,
        data: { raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git status failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitLogCommand: Command = {
  name: 'git-log',
  description: 'Show commit history',
  category: CommandCategory.GENERAL,
  aliases: ['log', 'git-history', 'commits'],
  usage: '/git-log [--oneline] [--graph] [--count <n>] [--author <name>] [--since <date>]',
  examples: ['/git-log', '/git-log --oneline --graph --count 10'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git log'
      if (args.flags?.oneline) cmd += ' --oneline'
      if (args.flags?.graph) cmd += ' --graph'
      if (args.flags?.count) cmd += ` -n ${args.flags.count}`
      if (args.flags?.author) cmd += ` --author="${args.flags.author}"`
      if (args.flags?.since) cmd += ` --since="${args.flags.since}"`
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd(), maxBuffer: 1024 * 1024 }).toString()
      
      return {
        success: true,
        display: output.slice(0, 10000),
        data: { raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git log failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitAddCommand: Command = {
  name: 'git-add',
  description: 'Stage changes for commit',
  category: CommandCategory.GENERAL,
  aliases: ['add', 'stage', 'git-stage'],
  usage: '/git-add [<files>] [--all] [--interactive]',
  examples: ['/git-add --all', '/git-add src/', '/git-add package.json'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git add'
      
      if (args.flags?.all) {
        cmd += ' --all'
      } else if (args.positional.length > 0) {
        cmd += ' ' + args.positional.join(' ')
      } else {
        cmd += ' .'
      }
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output || 'Files staged successfully',
        data: { staged: true },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git add failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitCommitCommand: Command = {
  name: 'git-commit',
  description: 'Commit staged changes',
  category: CommandCategory.GENERAL,
  aliases: ['commit', 'git-ci'],
  usage: '/git-commit --message <msg> [--amend] [--no-verify]',
  examples: ['/git-commit --message "Add new feature"', '/git-commit --message "Fix bug" --amend'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    const message = args.flags?.message as string
    
    if (!message) {
      return {
        success: false,
        display: 'Error: Missing commit message. Usage: /git-commit --message <msg>',
      }
    }
    
    try {
      let cmd = `git commit -m "${message}"`
      if (args.flags?.amend) cmd += ' --amend'
      if (args.flags?.['no-verify']) cmd += ' --no-verify'
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output,
        data: { committed: true, message },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git commit failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitPushCommand: Command = {
  name: 'git-push',
  description: 'Push commits to remote',
  category: CommandCategory.GENERAL,
  aliases: ['push', 'git-upload'],
  usage: '/git-push [--remote <name>] [--branch <name>] [--force] [--tags]',
  examples: ['/git-push', '/git-push --force', '/git-push --remote origin --branch main'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git push'
      
      const remote = args.flags?.remote || 'origin'
      const branch = args.flags?.branch
      
      if (args.flags?.force) cmd += ' --force'
      if (args.flags?.tags) cmd += ' --tags'
      if (branch) {
        cmd += ` ${remote} ${branch}`
      }
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd(), timeout: 60000 }).toString()
      
      return {
        success: true,
        display: output || 'Push successful',
        data: { pushed: true },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git push failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitPullCommand: Command = {
  name: 'git-pull',
  description: 'Pull changes from remote',
  category: CommandCategory.GENERAL,
  aliases: ['pull', 'git-fetch-merge'],
  usage: '/git-pull [--remote <name>] [--branch <name>] [--rebase]',
  examples: ['/git-pull', '/git-pull --rebase', '/git-pull --remote upstream'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git pull'
      
      const remote = args.flags?.remote || 'origin'
      const branch = args.flags?.branch
      
      if (args.flags?.rebase) cmd += ' --rebase'
      if (branch) {
        cmd += ` ${remote} ${branch}`
      }
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd(), timeout: 60000 }).toString()
      
      return {
        success: true,
        display: output || 'Pull successful',
        data: { pulled: true },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git pull failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitFetchCommand: Command = {
  name: 'git-fetch',
  description: 'Fetch changes from remote without merging',
  category: CommandCategory.GENERAL,
  aliases: ['fetch', 'git-fetch-remote'],
  usage: '/git-fetch [--remote <name>] [--all] [--prune] [--tags]',
  examples: ['/git-fetch', '/git-fetch --all --prune'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git fetch'
      
      if (args.flags?.all) cmd += ' --all'
      if (args.flags?.prune) cmd += ' --prune'
      if (args.flags?.tags) cmd += ' --tags'
      if (args.flags?.remote) cmd += ` ${args.flags.remote}`
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd(), timeout: 60000 }).toString()
      
      return {
        success: true,
        display: output || 'Fetch successful',
        data: { fetched: true },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git fetch failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitBranchCommand: Command = {
  name: 'git-branch',
  description: 'List, create, or delete branches',
  category: CommandCategory.GENERAL,
  aliases: ['branch', 'branches', 'git-branches'],
  usage: '/git-branch [--create <name>] [--delete <name>] [--list] [--remote] [--current]',
  examples: ['/git-branch', '/git-branch --create feature-xyz', '/git-branch --delete old-feature'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git branch'
      
      if (args.flags?.create) {
        cmd = `git branch ${args.flags.create}`
      } else if (args.flags?.delete) {
        cmd = `git branch -d ${args.flags.delete}`
      } else if (args.flags?.current) {
        cmd = 'git branch --show-current'
      } else {
        if (args.flags?.remote) cmd += ' -r'
        if (args.flags?.list) cmd += ' --list'
        cmd += ' -a'
      }
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output,
        data: { branches: output.split('\n').filter(Boolean) },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git branch failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitCheckoutCommand: Command = {
  name: 'git-checkout',
  description: 'Switch branches or restore files',
  category: CommandCategory.GENERAL,
  aliases: ['checkout', 'git-switch', 'git-co'],
  usage: '/git-checkout <branch> [--create] [--force]',
  examples: ['/git-checkout main', '/git-checkout feature-xyz --create'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    const branch = args.positional[0]
    
    if (!branch) {
      return {
        success: false,
        display: 'Error: Missing branch name. Usage: /git-checkout <branch>',
      }
    }
    
    try {
      let cmd = 'git checkout'
      
      if (args.flags?.create) cmd += ' -b'
      if (args.flags?.force) cmd += ' --force'
      
      cmd += ` ${branch}`
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output || `Switched to branch '${branch}'`,
        data: { branch },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git checkout failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitMergeCommand: Command = {
  name: 'git-merge',
  description: 'Merge branches',
  category: CommandCategory.GENERAL,
  aliases: ['merge', 'git-merge-branch'],
  usage: '/git-merge <branch> [--no-ff] [--squash] [--abort]',
  examples: ['/git-merge feature-xyz', '/git-merge feature-xyz --no-ff'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    const branch = args.positional[0]
    
    if (!branch && !args.flags?.abort) {
      return {
        success: false,
        display: 'Error: Missing branch name. Usage: /git-merge <branch>',
      }
    }
    
    try {
      let cmd = 'git merge'
      
      if (args.flags?.abort) cmd += ' --abort'
      else {
        if (args.flags?.['no-ff']) cmd += ' --no-ff'
        if (args.flags?.squash) cmd += ' --squash'
        cmd += ` ${branch}`
      }
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output || 'Merge successful',
        data: { merged: true, branch },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git merge failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitRebaseCommand: Command = {
  name: 'git-rebase',
  description: 'Rebase current branch',
  category: CommandCategory.GENERAL,
  aliases: ['rebase', 'git-rebase-branch'],
  usage: '/git-rebase [<branch>] [--interactive] [--continue] [--abort] [--skip]',
  examples: ['/git-rebase main', '/git-rebase --interactive', '/git-rebase --continue'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git rebase'
      
      if (args.flags?.interactive) cmd += ' -i'
      else if (args.flags?.continue) cmd += ' --continue'
      else if (args.flags?.abort) cmd += ' --abort'
      else if (args.flags?.skip) cmd += ' --skip'
      else {
        const branch = args.positional[0]
        if (branch) cmd += ` ${branch}`
      }
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output || 'Rebase successful',
        data: { rebased: true },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git rebase failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitStashCommand: Command = {
  name: 'git-stash',
  description: 'Stash changes',
  category: CommandCategory.GENERAL,
  aliases: ['stash', 'git-stash-save'],
  usage: '/git-stash [--save [--message <msg>]] [--pop] [--list] [--drop] [--clear]',
  examples: ['/git-stash --save', '/git-stash --pop', '/git-stash --list'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git stash'
      
      if (args.flags?.list) cmd += ' list'
      else if (args.flags?.pop) cmd += ' pop'
      else if (args.flags?.drop) cmd += ' drop'
      else if (args.flags?.clear) cmd += ' clear'
      else {
        cmd = 'git stash'
        if (args.flags?.message) cmd = `git stash push -m "${args.flags.message}"`
      }
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output || 'Stash successful',
        data: { stashed: true },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git stash failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitDiffCommand: Command = {
  name: 'git-diff',
  description: 'Show changes between commits',
  category: CommandCategory.GENERAL,
  aliases: ['diff', 'git-changes'],
  usage: '/git-diff [--cached] [--stat] [<commit>] [<file>]',
  examples: ['/git-diff', '/git-diff --cached', '/git-diff HEAD~1 --stat'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git diff'
      
      if (args.flags?.cached) cmd += ' --cached'
      if (args.flags?.stat) cmd += ' --stat'
      if (args.positional.length > 0) cmd += ' ' + args.positional.join(' ')
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd(), maxBuffer: 1024 * 1024 }).toString()
      
      return {
        success: true,
        display: output.slice(0, 20000),
        data: { diff: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git diff failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitResetCommand: Command = {
  name: 'git-reset',
  description: 'Reset current HEAD to specified state',
  category: CommandCategory.GENERAL,
  aliases: ['reset', 'git-reset-head'],
  usage: '/git-reset [--hard] [--soft] [--mixed] [<commit>]',
  examples: ['/git-reset', '/git-reset --hard HEAD~1', '/git-reset --soft HEAD~1'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git reset'
      
      if (args.flags?.hard) cmd += ' --hard'
      else if (args.flags?.soft) cmd += ' --soft'
      else if (args.flags?.mixed) cmd += ' --mixed'
      
      const commit = args.positional[0]
      if (commit) cmd += ` ${commit}`
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output || 'Reset successful',
        data: { reset: true },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git reset failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitRevertCommand: Command = {
  name: 'git-revert',
  description: 'Revert a commit',
  category: CommandCategory.GENERAL,
  aliases: ['revert', 'git-revert-commit'],
  usage: '/git-revert <commit> [--no-commit]',
  examples: ['/git-revert HEAD', '/git-revert abc123 --no-commit'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    const commit = args.positional[0]
    
    if (!commit) {
      return {
        success: false,
        display: 'Error: Missing commit. Usage: /git-revert <commit>',
      }
    }
    
    try {
      let cmd = `git revert ${commit}`
      if (args.flags?.['no-commit']) cmd += ' --no-commit'
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output || 'Revert successful',
        data: { reverted: commit },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git revert failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitCherryPickCommand: Command = {
  name: 'git-cherry-pick',
  description: 'Apply changes from a specific commit',
  category: CommandCategory.GENERAL,
  aliases: ['cherry-pick', 'git-apply-commit'],
  usage: '/git-cherry-pick <commit> [--continue] [--abort] [--skip]',
  examples: ['/git-cherry-pick abc123', '/git-cherry-pick --continue'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git cherry-pick'
      
      if (args.flags?.continue) cmd += ' --continue'
      else if (args.flags?.abort) cmd += ' --abort'
      else if (args.flags?.skip) cmd += ' --skip'
      else {
        const commit = args.positional[0]
        if (!commit) {
          return {
            success: false,
            display: 'Error: Missing commit. Usage: /git-cherry-pick <commit>',
          }
        }
        cmd += ` ${commit}`
      }
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output || 'Cherry-pick successful',
        data: { cherryPicked: true },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git cherry-pick failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitTagCommand: Command = {
  name: 'git-tag',
  description: 'Create, list, or delete tags',
  category: CommandCategory.GENERAL,
  aliases: ['tag', 'tags', 'git-tags'],
  usage: '/git-tag [--create <name>] [--delete <name>] [--list] [--annotate <msg>]',
  examples: ['/git-tag', '/git-tag --create v1.0.0', '/git-tag --create v1.0.0 --annotate "Release 1.0"'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git tag'
      
      if (args.flags?.create) {
        cmd = `git tag ${args.flags.create}`
        if (args.flags?.annotate) {
          cmd = `git tag -a ${args.flags.create} -m "${args.flags.annotate}"`
        }
      } else if (args.flags?.delete) {
        cmd = `git tag -d ${args.flags.delete}`
      } else {
        cmd += ' -l'
      }
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output || 'Tag operation successful',
        data: { tags: output.split('\n').filter(Boolean) },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git tag failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitRemoteCommand: Command = {
  name: 'git-remote',
  description: 'Manage remote repositories',
  category: CommandCategory.GENERAL,
  aliases: ['remote', 'git-remotes', 'remotes'],
  usage: '/git-remote [--add <name> <url>] [--remove <name>] [--list] [--verbose]',
  examples: ['/git-remote', '/git-remote --verbose', '/git-remote --add origin https://github.com/user/repo.git'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git remote'
      
      if (args.flags?.add) {
        const name = args.positional[0]
        const url = args.positional[1]
        cmd += ` add ${name} ${url}`
      } else if (args.flags?.remove) {
        cmd += ` remove ${args.flags.remove}`
      } else {
        if (args.flags?.verbose) cmd += ' -v'
        cmd += ' -v'
      }
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output,
        data: { remotes: output.split('\n').filter(Boolean) },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git remote failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitShowCommand: Command = {
  name: 'git-show',
  description: 'Show various types of objects',
  category: CommandCategory.GENERAL,
  aliases: ['show', 'git-show-commit'],
  usage: '/git-show [<commit>] [--stat] [--format <format>]',
  examples: ['/git-show', '/git-show HEAD~1', '/git-show abc123 --stat'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git show'
      
      const commit = args.positional[0]
      if (commit) cmd += ` ${commit}`
      if (args.flags?.stat) cmd += ' --stat'
      if (args.flags?.format) cmd += ` --format="${args.flags.format}"`
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd(), maxBuffer: 1024 * 1024 }).toString()
      
      return {
        success: true,
        display: output.slice(0, 10000),
        data: { show: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git show failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitBlameCommand: Command = {
  name: 'git-blame',
  description: 'Show what revision and author last modified each line',
  category: CommandCategory.GENERAL,
  aliases: ['blame', 'git-annotate'],
  usage: '/git-blame <file> [--line <range>]',
  examples: ['/git-blame src/index.ts', '/git-blame package.json'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    const file = args.positional[0]
    
    if (!file) {
      return {
        success: false,
        display: 'Error: Missing file. Usage: /git-blame <file>',
      }
    }
    
    try {
      let cmd = `git blame ${file}`
      if (args.flags?.line) cmd += ` -L ${args.flags.line}`
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd(), maxBuffer: 1024 * 1024 }).toString()
      
      return {
        success: true,
        display: output.slice(0, 10000),
        data: { blame: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git blame failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitGrepCommand: Command = {
  name: 'git-grep',
  description: 'Search for patterns in tracked files',
  category: CommandCategory.GENERAL,
  aliases: ['git-search', 'search-repo'],
  usage: '/git-grep <pattern> [--files] [--count]',
  examples: ['/git-grep TODO', '/git-grep "function.*test" --files'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    const pattern = args.positional[0]
    
    if (!pattern) {
      return {
        success: false,
        display: 'Error: Missing pattern. Usage: /git-grep <pattern>',
      }
    }
    
    try {
      let cmd = `git grep "${pattern}"`
      if (args.flags?.files) cmd += ' --name-only'
      if (args.flags?.count) cmd += ' --count'
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd(), maxBuffer: 1024 * 1024 }).toString()
      
      return {
        success: true,
        display: output.slice(0, 10000),
        data: { results: output.split('\n').filter(Boolean) },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git grep failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitReflogCommand: Command = {
  name: 'git-reflog',
  description: 'Show reference logs',
  category: CommandCategory.GENERAL,
  aliases: ['reflog', 'git-history-reflog'],
  usage: '/git-reflog [--count <n>]',
  examples: ['/git-reflog', '/git-reflog --count 20'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git reflog'
      if (args.flags?.count) cmd += ` -n ${args.flags.count}`
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output,
        data: { reflog: output.split('\n').filter(Boolean) },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git reflog failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitBisectCommand: Command = {
  name: 'git-bisect',
  description: 'Find the commit that introduced a bug',
  category: CommandCategory.GENERAL,
  aliases: ['bisect', 'git-find-bug'],
  usage: '/git-bisect --start | --good <commit> | --bad <commit> | --reset',
  examples: ['/git-bisect --start', '/git-bisect --good abc123', '/git-bisect --bad def456'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git bisect'
      
      if (args.flags?.start) cmd += ' start'
      else if (args.flags?.good) cmd += ` good ${args.flags.good}`
      else if (args.flags?.bad) cmd += ` bad ${args.flags.bad}`
      else if (args.flags?.reset) cmd += ' reset'
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output,
        data: { bisect: true },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git bisect failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitCleanCommand: Command = {
  name: 'git-clean',
  description: 'Remove untracked files',
  category: CommandCategory.GENERAL,
  aliases: ['clean', 'git-remove-untracked'],
  usage: '/git-clean [--dry-run] [--force] [--directories]',
  examples: ['/git-clean --dry-run', '/git-clean --force'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git clean'
      
      if (!args.flags?.force) cmd += ' --dry-run'
      if (args.flags?.force) cmd += ' -f'
      if (args.flags?.directories) cmd += ' -d'
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output || 'Clean successful',
        data: { cleaned: true },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git clean failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitArchiveCommand: Command = {
  name: 'git-archive',
  description: 'Create an archive from files',
  category: CommandCategory.GENERAL,
  aliases: ['archive', 'git-export'],
  usage: '/git-archive --output <file> [--format <format>] [<tree-ish>]',
  examples: ['/git-archive --output repo.tar', '/git-archive --output repo.zip --format zip'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    const output = args.flags?.output as string
    if (!output) {
      return {
        success: false,
        display: 'Error: Missing output file. Usage: /git-archive --output <file>',
      }
    }
    
    try {
      let cmd = `git archive --output=${output}`
      if (args.flags?.format) cmd += ` --format=${args.flags.format}`
      
      const tree = args.positional[0] || 'HEAD'
      cmd += ` ${tree}`
      
      execSync(cmd, { cwd: context?.cwd || process.cwd() })
      
      return {
        success: true,
        display: `Archive created: ${output}`,
        data: { archive: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git archive failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitConfigCommand: Command = {
  name: 'git-config',
  description: 'Get and set repository or global options',
  category: CommandCategory.GENERAL,
  aliases: ['config', 'git-settings'],
  usage: '/git-config [--list] [--get <key>] [--set <key> <value>] [--global]',
  examples: ['/git-config --list', '/git-config --get user.name', '/git-config --set user.name "John Doe" --global'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git config'
      
      if (args.flags?.list) {
        cmd += ' --list'
      } else if (args.flags?.get) {
        cmd += ` --get ${args.flags.get}`
      } else if (args.flags?.set) {
        const key = args.positional[0]
        const value = args.positional.slice(1).join(' ')
        if (args.flags?.global) cmd += ' --global'
        cmd += ` ${key} "${value}"`
      } else {
        cmd += ' --list'
      }
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output,
        data: { config: output.split('\n').filter(Boolean) },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git config failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitIgnoreCommand: Command = {
  name: 'git-ignore',
  description: 'Manage .gitignore file',
  category: CommandCategory.GENERAL,
  aliases: ['ignore', 'gitignore'],
  usage: '/git-ignore [--add <pattern>] [--list] [--template <language>]',
  examples: ['/git-ignore --list', '/git-ignore --add "*.log"', '/git-ignore --template node'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    const fs = require('fs')
    const path = require('path')
    
    const gitignorePath = path.join(context?.cwd || process.cwd(), '.gitignore')
    
    if (args.flags?.add) {
      const pattern = args.flags.add as string
      try {
        fs.appendFileSync(gitignorePath, pattern + '\n')
        return {
          success: true,
          display: `Added "${pattern}" to .gitignore`,
          data: { added: pattern },
        }
      } catch (error) {
        return {
          success: false,
          display: `Failed to update .gitignore: ${error}`,
          error: error as Error,
        }
      }
    }
    
    if (args.flags?.list) {
      try {
        if (fs.existsSync(gitignorePath)) {
          const content = fs.readFileSync(gitignorePath, 'utf8')
          const patterns = content.split('\n').filter(line => line && !line.startsWith('#'))
          return {
            success: true,
            display: patterns.join('\n'),
            data: { patterns },
          }
        } else {
          return {
            success: false,
            display: 'No .gitignore file found',
          }
        }
      } catch (error) {
        return {
          success: false,
          display: `Failed to read .gitignore: ${error}`,
          error: error as Error,
        }
      }
    }
    
    return {
      success: true,
      display: 'Usage: /git-ignore --add <pattern> | /git-ignore --list',
    }
  },
}

export const gitSubmoduleCommand: Command = {
  name: 'git-submodule',
  description: 'Initialize, update, or inspect submodules',
  category: CommandCategory.GENERAL,
  aliases: ['submodule', 'submodules'],
  usage: '/git-submodule [--add <url>] [--update] [--init] [--status]',
  examples: ['/git-submodule --status', '/git-submodule --update', '/git-submodule --add https://github.com/user/repo.git'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git submodule'
      
      if (args.flags?.add) {
        cmd += ` add ${args.flags.add}`
      } else if (args.flags?.update) {
        cmd += ' update --init --recursive'
      } else if (args.flags?.init) {
        cmd += ' init'
      } else {
        cmd += ' status'
      }
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output || 'Submodule operation successful',
        data: { submodule: true },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git submodule failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const gitLsCommand: Command = {
  name: 'git-ls',
  description: 'List files in a tree',
  category: CommandCategory.GENERAL,
  aliases: ['ls-tree', 'git-files'],
  usage: '/git-ls [--tree <ref>] [--recursive]',
  examples: ['/git-ls', '/git-ls --tree HEAD --recursive'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = 'git ls-tree'
      
      const ref = args.flags?.tree || 'HEAD'
      cmd += ` ${ref}`
      if (args.flags?.recursive) cmd += ' -r'
      
      const output = execSync(cmd, { cwd: context?.cwd || process.cwd() }).toString()
      
      return {
        success: true,
        display: output,
        data: { files: output.split('\n').filter(Boolean) },
      }
    } catch (error) {
      return {
        success: false,
        display: `Git ls-tree failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

// Export all commands
export const gitCommands: Command[] = [
  gitInitCommand,
  gitCloneCommand,
  gitStatusCommand,
  gitLogCommand,
  gitAddCommand,
  gitCommitCommand,
  gitPushCommand,
  gitPullCommand,
  gitFetchCommand,
  gitBranchCommand,
  gitCheckoutCommand,
  gitMergeCommand,
  gitRebaseCommand,
  gitStashCommand,
  gitDiffCommand,
  gitResetCommand,
  gitRevertCommand,
  gitCherryPickCommand,
  gitTagCommand,
  gitRemoteCommand,
  gitShowCommand,
  gitBlameCommand,
  gitGrepCommand,
  gitReflogCommand,
  gitBisectCommand,
  gitCleanCommand,
  gitArchiveCommand,
  gitConfigCommand,
  gitIgnoreCommand,
  gitSubmoduleCommand,
  gitLsCommand,
]
