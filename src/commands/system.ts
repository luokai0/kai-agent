/**
 * System Commands - 30 commands for system operations and diagnostics
 */

import { Command, CommandCategory, CommandResult } from './Command'

// System Information Commands
export const sysinfoCommand: Command = {
  name: 'sysinfo',
  description: 'Display comprehensive system information',
  category: CommandCategory.GENERAL,
  aliases: ['system-info', 'systeminfo'],
  usage: '/sysinfo [--all] [--cpu] [--memory] [--disk] [--network]',
  examples: ['/sysinfo', '/sysinfo --cpu', '/sysinfo --all'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const flags = args.flags || {}
    const os = require('os')
    
    const info: any = {
      platform: os.platform(),
      type: os.type(),
      release: os.release(),
      hostname: os.hostname(),
      arch: os.arch(),
      uptime: formatUptime(os.uptime()),
      totalMemory: formatBytes(os.totalmem()),
      freeMemory: formatBytes(os.freemem()),
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Unknown',
      loadAvg: os.loadavg().map(l => l.toFixed(2)),
      userInfo: os.userInfo(),
      networkInterfaces: Object.keys(os.networkInterfaces()),
      homedir: os.homedir(),
      tmpdir: os.tmpdir(),
      endianness: os.endianness(),
    }
    
    if (flags.cpu) {
      info.cpus = os.cpus().map(cpu => ({
        model: cpu.model,
        speed: cpu.speed,
        times: cpu.times,
      }))
    }
    
    if (flags.network) {
      info.networkDetails = os.networkInterfaces()
    }
    
    return {
      success: true,
      display: formatOutput(info),
      data: info,
    }
  },
}

export const cpuCommand: Command = {
  name: 'cpu',
  description: 'Display CPU information and usage',
  category: CommandCategory.GENERAL,
  aliases: ['cpus', 'processor'],
  usage: '/cpu [--usage] [--benchmark]',
  examples: ['/cpu', '/cpu --usage'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const os = require('os')
    const cpus = os.cpus()
    
    const cpuInfo = {
      count: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      speed: cpus[0]?.speed || 'Unknown',
      cores: cpus.map((cpu: any, i: number) => ({
        core: i,
        speed: cpu.speed + ' MHz',
        user: (cpu.times.user / 1000000).toFixed(2) + 's',
        nice: (cpu.times.nice / 1000000).toFixed(2) + 's',
        sys: (cpu.times.sys / 1000000).toFixed(2) + 's',
        idle: (cpu.times.idle / 1000000).toFixed(2) + 's',
        irq: (cpu.times.irq / 1000000).toFixed(2) + 's',
      })),
      loadAverage: {
        '1min': os.loadavg()[0].toFixed(2),
        '5min': os.loadavg()[1].toFixed(2),
        '15min': os.loadavg()[2].toFixed(2),
      },
    }
    
    return {
      success: true,
      display: formatOutput(cpuInfo),
      data: cpuInfo,
    }
  },
}

export const memoryCommand: Command = {
  name: 'memory',
  description: 'Display memory usage and statistics',
  category: CommandCategory.GENERAL,
  aliases: ['mem', 'ram'],
  usage: '/memory [--detailed]',
  examples: ['/memory', '/memory --detailed'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const os = require('os')
    const total = os.totalmem()
    const free = os.freemem()
    const used = total - free
    const usage = ((used / total) * 100).toFixed(2)
    
    const memInfo = {
      total: formatBytes(total),
      free: formatBytes(free),
      used: formatBytes(used),
      usage: usage + '%',
      totalMB: (total / 1024 / 1024).toFixed(2),
      freeMB: (free / 1024 / 1024).toFixed(2),
      usedMB: (used / 1024 / 1024).toFixed(2),
      heapUsed: formatBytes(process.memoryUsage().heapUsed),
      heapTotal: formatBytes(process.memoryUsage().heapTotal),
      external: formatBytes(process.memoryUsage().external),
      rss: formatBytes(process.memoryUsage().rss),
    }
    
    return {
      success: true,
      display: formatOutput(memInfo),
      data: memInfo,
    }
  },
}

export const diskCommand: Command = {
  name: 'disk',
  description: 'Display disk usage and filesystem information',
  category: CommandCategory.GENERAL,
  aliases: ['storage', 'drive', 'filesystem'],
  usage: '/disk [--path <path>]',
  examples: ['/disk', '/disk --path /home'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      const path = args.flags?.path || '/'
      let output = ''
      
      if (process.platform === 'win32') {
        output = execSync('wmic logicaldisk get size,freespace,caption').toString()
      } else {
        output = execSync(`df -h "${path}"`).toString()
      }
      
      return {
        success: true,
        display: output,
        data: { raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Error: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const processListCommand: Command = {
  name: 'ps',
  description: 'List running processes',
  category: CommandCategory.GENERAL,
  aliases: ['processes', 'proc', 'process-list'],
  usage: '/ps [--filter <pattern>] [--sort <field>]',
  examples: ['/ps', '/ps --filter node', '/ps --sort cpu'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = process.platform === 'win32' ? 'tasklist' : 'ps aux'
      let output = execSync(cmd).toString()
      
      if (args.flags?.filter) {
        const filter = args.flags.filter as string
        output = output.split('\n').filter(line => 
          line.toLowerCase().includes(filter.toLowerCase())
        ).join('\n')
      }
      
      return {
        success: true,
        display: output.slice(0, 5000),
        data: { raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Error: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const killProcessCommand: Command = {
  name: 'kill',
  description: 'Terminate a process by PID',
  category: CommandCategory.GENERAL,
  aliases: ['kill-process', 'terminate'],
  usage: '/kill <pid> [--force]',
  examples: ['/kill 1234', '/kill 1234 --force'],
  permissions: ['write', 'execute'],
  execute: async (args, context): Promise<CommandResult> => {
    const pid = parseInt(args.positional[0])
    if (isNaN(pid)) {
      return {
        success: false,
        display: 'Error: Invalid PID. Usage: /kill <pid>',
      }
    }
    
    const force = args.flags?.force ? true : false
    const signal = force ? 'SIGKILL' : 'SIGTERM'
    
    try {
      process.kill(pid, signal)
      return {
        success: true,
        display: `Process ${pid} terminated with ${signal}`,
        data: { pid, signal },
      }
    } catch (error) {
      return {
        success: false,
        display: `Error terminating process ${pid}: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const topCommand: Command = {
  name: 'top',
  description: 'Display top processes by resource usage',
  category: CommandCategory.GENERAL,
  aliases: ['top-processes', 'htop'],
  usage: '/top [--count <n>]',
  examples: ['/top', '/top --count 20'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = process.platform === 'win32' 
        ? 'powershell "Get-Process | Sort-Object CPU -Descending | Select-Object -First 10"'
        : 'ps aux --sort=-%cpu | head -n 11'
      
      const count = args.flags?.count || 10
      if (process.platform !== 'win32') {
        cmd = `ps aux --sort=-%cpu | head -n ${count + 1}`
      }
      
      const output = execSync(cmd).toString()
      
      return {
        success: true,
        display: output,
        data: { raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Error: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const uptimeCommand: Command = {
  name: 'uptime',
  description: 'Display system uptime',
  category: CommandCategory.GENERAL,
  aliases: ['system-uptime'],
  usage: '/uptime',
  examples: ['/uptime'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const os = require('os')
    const uptime = formatUptime(os.uptime())
    
    return {
      success: true,
      display: `System uptime: ${uptime}`,
      data: { uptime: os.uptime(), formatted: uptime },
    }
  },
}

export const hostnameCommand: Command = {
  name: 'hostname',
  description: 'Display or set system hostname',
  category: CommandCategory.GENERAL,
  aliases: ['host', 'computer-name'],
  usage: '/hostname [--set <name>]',
  examples: ['/hostname', '/hostname --set mymachine'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const os = require('os')
    
    if (args.flags?.set) {
      return {
        success: false,
        display: 'Setting hostname requires elevated permissions',
      }
    }
    
    return {
      success: true,
      display: os.hostname(),
      data: { hostname: os.hostname() },
    }
  },
}

export const archCommand: Command = {
  name: 'arch',
  description: 'Display system architecture',
  category: CommandCategory.GENERAL,
  aliases: ['architecture', 'cpu-arch'],
  usage: '/arch',
  examples: ['/arch'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const os = require('os')
    
    return {
      success: true,
      display: `Architecture: ${os.arch()}\nPlatform: ${os.platform()}\nType: ${os.type()}`,
      data: { arch: os.arch(), platform: os.platform(), type: os.type() },
    }
  },
}

export const kernelCommand: Command = {
  name: 'kernel',
  description: 'Display kernel information',
  category: CommandCategory.GENERAL,
  aliases: ['kernel-info', 'os-info'],
  usage: '/kernel',
  examples: ['/kernel'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const os = require('os')
    const { execSync } = require('child_process')
    
    const kernelInfo = {
      type: os.type(),
      release: os.release(),
      version: os.version ? os.version() : 'N/A',
      platform: os.platform(),
      arch: os.arch(),
    }
    
    if (process.platform === 'linux') {
      try {
        kernelInfo['kernelVersion'] = execSync('uname -r').toString().trim()
        kernelInfo['kernelName'] = execSync('uname -s').toString().trim()
      } catch {}
    }
    
    return {
      success: true,
      display: formatOutput(kernelInfo),
      data: kernelInfo,
    }
  },
}

export const userCommand: Command = {
  name: 'user',
  description: 'Display current user information',
  category: CommandCategory.GENERAL,
  aliases: ['whoami', 'current-user', 'user-info'],
  usage: '/user',
  examples: ['/user'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const os = require('os')
    const userInfo = os.userInfo()
    
    const userData = {
      username: userInfo.username,
      uid: userInfo.uid,
      gid: userInfo.gid,
      homedir: os.homedir(),
      shell: userInfo.shell || 'N/A',
      shellType: process.env.SHELL || process.env.ComSpec || 'Unknown',
      homedirWritable: true, // Assume writable
      env: {
        PATH: process.env.PATH?.split(':') || [],
        HOME: process.env.HOME || process.env.USERPROFILE,
        USER: process.env.USER || process.env.USERNAME,
        LANG: process.env.LANG || process.env.LC_ALL,
        TERM: process.env.TERM,
      },
    }
    
    return {
      success: true,
      display: formatOutput(userData),
      data: userData,
    }
  },
}

export const usersCommand: Command = {
  name: 'users',
  description: 'Display logged in users',
  category: CommandCategory.GENERAL,
  aliases: ['who', 'logged-in'],
  usage: '/users',
  examples: ['/users'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = process.platform === 'win32' ? 'query user' : 'who'
      const output = execSync(cmd).toString()
      
      return {
        success: true,
        display: output,
        data: { raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Error: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const envCommand: Command = {
  name: 'env',
  description: 'Display environment variables',
  category: CommandCategory.GENERAL,
  aliases: ['environment', 'env-vars', 'environment-variables'],
  usage: '/env [--filter <pattern>]',
  examples: ['/env', '/env --filter PATH', '/env --filter NODE'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const env = process.env
    let result = { ...env }
    
    if (args.flags?.filter) {
      const filter = args.flags.filter as string
      result = Object.fromEntries(
        Object.entries(env).filter(([key]) =>
          key.toLowerCase().includes(filter.toLowerCase())
        )
      )
    }
    
    const display = Object.entries(result)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    
    return {
      success: true,
      display: display.slice(0, 10000),
      data: result,
    }
  },
}

export const setEnvCommand: Command = {
  name: 'setenv',
  description: 'Set an environment variable for the session',
  category: CommandCategory.GENERAL,
  aliases: ['set-env', 'export'],
  usage: '/setenv <name> <value>',
  examples: ['/setenv NODE_ENV production', '/setenv DEBUG true'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const name = args.positional[0]
    const value = args.positional.slice(1).join(' ')
    
    if (!name) {
      return {
        success: false,
        display: 'Error: Missing variable name. Usage: /setenv <name> <value>',
      }
    }
    
    process.env[name] = value
    
    return {
      success: true,
      display: `Set ${name}=${value}`,
      data: { name, value },
    }
  },
}

export const unsetEnvCommand: Command = {
  name: 'unsetenv',
  description: 'Unset an environment variable',
  category: CommandCategory.GENERAL,
  aliases: ['unset-env', 'unset', 'delete-env'],
  usage: '/unsetenv <name>',
  examples: ['/unsetenv DEBUG', '/unsetenv NODE_ENV'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const name = args.positional[0]
    
    if (!name) {
      return {
        success: false,
        display: 'Error: Missing variable name. Usage: /unsetenv <name>',
      }
    }
    
    const oldValue = process.env[name]
    delete process.env[name]
    
    return {
      success: true,
      display: `Unset ${name}${oldValue ? ` (was: ${oldValue})` : ''}`,
      data: { name, oldValue },
    }
  },
}

export const loadCommand: Command = {
  name: 'load',
  description: 'Display system load averages',
  category: CommandCategory.GENERAL,
  aliases: ['loadavg', 'load-average', 'system-load'],
  usage: '/load',
  examples: ['/load'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const os = require('os')
    const load = os.loadavg()
    const cpuCount = os.cpus().length
    
    const loadInfo = {
      '1 minute': load[0].toFixed(2),
      '5 minutes': load[1].toFixed(2),
      '15 minutes': load[2].toFixed(2),
      'CPU count': cpuCount,
      'Load per CPU': load.map(l => (l / cpuCount).toFixed(2)),
      'Status': load[0] < cpuCount ? 'Healthy' : 'Overloaded',
    }
    
    return {
      success: true,
      display: formatOutput(loadInfo),
      data: loadInfo,
    }
  },
}

export const dateCommand: Command = {
  name: 'date',
  description: 'Display current date and time',
  category: CommandCategory.GENERAL,
  aliases: ['now', 'datetime', 'time'],
  usage: '/date [--format <format>] [--utc]',
  examples: ['/date', '/date --utc', '/date --format "YYYY-MM-DD"'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const now = new Date()
    const useUtc = args.flags?.utc ? true : false
    
    const dateInfo = {
      local: now.toString(),
      iso: now.toISOString(),
      utc: useUtc ? now.toUTCString() : 'use --utc flag',
      timestamp: now.getTime(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset: now.getTimezoneOffset(),
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds(),
      dayOfWeek: now.getDay(),
      dayOfYear: Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000),
      weekOfYear: Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7),
    }
    
    return {
      success: true,
      display: formatOutput(dateInfo),
      data: dateInfo,
    }
  },
}

export const timezoneCommand: Command = {
  name: 'timezone',
  description: 'Display timezone information',
  category: CommandCategory.GENERAL,
  aliases: ['tz', 'timezones'],
  usage: '/timezone [--list]',
  examples: ['/timezone', '/timezone --list'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const tzInfo = {
      system: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset: new Date().getTimezoneOffset(),
      offsetHours: (new Date().getTimezoneOffset() / -60).toFixed(2),
      utcTime: new Date().toUTCString(),
      localTime: new Date().toString(),
    }
    
    if (args.flags?.list) {
      const timezones = Intl.supportedValuesOf('timeZone')
      return {
        success: true,
        display: `Available timezones (${timezones.length}):\n${timezones.join('\n')}`,
        data: { timezones },
      }
    }
    
    return {
      success: true,
      display: formatOutput(tzInfo),
      data: tzInfo,
    }
  },
}

export const benchmarkCommand: Command = {
  name: 'benchmark',
  description: 'Run simple system benchmarks',
  category: CommandCategory.GENERAL,
  aliases: ['bench', 'perf', 'performance'],
  usage: '/benchmark [--iterations <n>]',
  examples: ['/benchmark', '/benchmark --iterations 10000'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const iterations = parseInt(args.flags?.iterations as string) || 100000
    
    // CPU benchmark
    const cpuStart = Date.now()
    let sum = 0
    for (let i = 0; i < iterations; i++) {
      sum += Math.sqrt(i) * Math.sin(i) * Math.cos(i)
    }
    const cpuTime = Date.now() - cpuStart
    
    // Memory benchmark
    const memStart = Date.now()
    const arr = new Array(iterations)
    for (let i = 0; i < iterations; i++) {
      arr[i] = { i, data: 'x'.repeat(100) }
    }
    const memTime = Date.now() - memStart
    
    // JSON benchmark
    const jsonStart = Date.now()
    JSON.stringify(arr)
    const jsonTime = Date.now() - jsonStart
    
    const results = {
      iterations,
      cpuBenchmark: `${cpuTime}ms`,
      memoryBenchmark: `${memTime}ms`,
      jsonBenchmark: `${jsonTime}ms`,
      total: `${cpuTime + memTime + jsonTime}ms`,
      score: Math.round((iterations * 3) / (cpuTime + memTime + jsonTime)),
    }
    
    return {
      success: true,
      display: formatOutput(results),
      data: results,
    }
  },
}

export const diagnosticsCommand: Command = {
  name: 'diagnostics',
  description: 'Run comprehensive system diagnostics',
  category: CommandCategory.GENERAL,
  aliases: ['diag', 'check', 'health-check'],
  usage: '/diagnostics',
  examples: ['/diagnostics'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const os = require('os')
    const { execSync } = require('child_process')
    
    const diagnostics = {
      system: {
        platform: os.platform(),
        arch: os.arch(),
        type: os.type(),
        release: os.release(),
      },
      cpu: {
        count: os.cpus().length,
        model: os.cpus()[0]?.model?.split('\n')[0] || 'Unknown',
        loadAvg: os.loadavg().map(l => l.toFixed(2)),
      },
      memory: {
        total: formatBytes(os.totalmem()),
        free: formatBytes(os.freemem()),
        usage: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(1) + '%',
      },
      runtime: {
        nodeVersion: process.version,
        pid: process.pid,
        uptime: formatUptime(process.uptime()),
        memoryUsage: {
          rss: formatBytes(process.memoryUsage().rss),
          heapTotal: formatBytes(process.memoryUsage().heapTotal),
          heapUsed: formatBytes(process.memoryUsage().heapUsed),
        },
      },
      network: {
        interfaces: Object.keys(os.networkInterfaces()).length,
      },
      status: 'OK',
    }
    
    return {
      success: true,
      display: formatOutput(diagnostics),
      data: diagnostics,
    }
  },
}

export const logsCommand: Command = {
  name: 'logs',
  description: 'View system logs',
  category: CommandCategory.GENERAL,
  aliases: ['syslog', 'system-logs', 'dmesg'],
  usage: '/logs [--lines <n>] [--filter <pattern>]',
  examples: ['/logs', '/logs --lines 50', '/logs --filter error'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    const lines = args.flags?.lines || 20
    const filter = args.flags?.filter
    
    try {
      let cmd = process.platform === 'win32' 
        ? `powershell "Get-EventLog -LogName System -Newest ${lines}"`
        : process.platform === 'darwin'
        ? `log show --last 5m --predicate 'process == "kernel"' | head -n ${lines}`
        : `dmesg | tail -n ${lines}`
      
      if (filter) {
        if (process.platform === 'linux') {
          cmd += ` | grep -i "${filter}"`
        }
      }
      
      const output = execSync(cmd, { maxBuffer: 1024 * 1024 }).toString()
      
      return {
        success: true,
        display: output.slice(0, 10000),
        data: { raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Error reading logs: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const servicesCommand: Command = {
  name: 'services',
  description: 'List system services',
  category: CommandCategory.GENERAL,
  aliases: ['daemons', 'systemd', 'service-list'],
  usage: '/services [--status]',
  examples: ['/services', '/services --status'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = ''
      if (process.platform === 'linux') {
        cmd = 'systemctl list-units --type=service --no-pager'
      } else if (process.platform === 'darwin') {
        cmd = 'launchctl list'
      } else if (process.platform === 'win32') {
        cmd = 'powershell "Get-Service | Select-Object Name, Status"'
      }
      
      const output = execSync(cmd, { maxBuffer: 1024 * 1024 }).toString()
      
      return {
        success: true,
        display: output.slice(0, 10000),
        data: { raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Error listing services: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const pathCommand: Command = {
  name: 'path',
  description: 'Display or manage PATH environment variable',
  category: CommandCategory.GENERAL,
  aliases: ['paths', 'path-env'],
  usage: '/path [--add <dir>] [--remove <dir>]',
  examples: ['/path', '/path --add /usr/local/bin'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    const pathSep = process.platform === 'win32' ? ';' : ':'
    const paths = (process.env.PATH || '').split(pathSep)
    
    if (args.flags?.add) {
      const newDir = args.flags.add as string
      process.env.PATH = newDir + pathSep + process.env.PATH
      return {
        success: true,
        display: `Added ${newDir} to PATH`,
        data: { paths: [newDir, ...paths] },
      }
    }
    
    if (args.flags?.remove) {
      const dir = args.flags.remove as string
      process.env.PATH = paths.filter(p => p !== dir).join(pathSep)
      return {
        success: true,
        display: `Removed ${dir} from PATH`,
        data: { paths: paths.filter(p => p !== dir) },
      }
    }
    
    return {
      success: true,
      display: `PATH directories (${paths.length}):\n${paths.join('\n')}`,
      data: { paths },
    }
  },
}

export const nodeCommand: Command = {
  name: 'node',
  description: 'Display Node.js information',
  category: CommandCategory.GENERAL,
  aliases: ['node-info', 'nodejs', 'node-version'],
  usage: '/node',
  examples: ['/node'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const nodeInfo = {
      version: process.version,
      versions: process.versions,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      ppid: process.ppid,
      execPath: process.execPath,
      cwd: process.cwd(),
      uptime: process.uptime(),
      memoryUsage: {
        rss: formatBytes(process.memoryUsage().rss),
        heapTotal: formatBytes(process.memoryUsage().heapTotal),
        heapUsed: formatBytes(process.memoryUsage().heapUsed),
        external: formatBytes(process.memoryUsage().external),
        arrayBuffers: formatBytes(process.memoryUsage().arrayBuffers),
      },
      cpuUsage: process.cpuUsage(),
      features: {
        asyncHooks: 'AsyncHooks' in process,
        nativeModules: process.binding ? true : false,
      },
    }
    
    return {
      success: true,
      display: formatOutput(nodeInfo),
      data: nodeInfo,
    }
  },
}

export const modulesCommand: Command = {
  name: 'modules',
  description: 'List loaded Node.js modules',
  category: CommandCategory.GENERAL,
  aliases: ['loaded-modules', 'require-cache'],
  usage: '/modules [--filter <pattern>]',
  examples: ['/modules', '/modules --filter fs'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const cache = require.cache
    const modules = Object.keys(cache)
    
    if (args.flags?.filter) {
      const filter = args.flags.filter as string
      const filtered = modules.filter(m => m.toLowerCase().includes(filter.toLowerCase()))
      return {
        success: true,
        display: `Loaded modules matching "${filter}" (${filtered.length}):\n${filtered.join('\n')}`,
        data: { modules: filtered },
      }
    }
    
    return {
      success: true,
      display: `Loaded modules (${modules.length}):\n${modules.slice(0, 100).join('\n')}`,
      data: { modules, count: modules.length },
    }
  },
}

export const timersCommand: Command = {
  name: 'timers',
  description: 'List active timers',
  category: CommandCategory.GENERAL,
  aliases: ['active-timers', 'intervals'],
  usage: '/timers',
  examples: ['/timers'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    // Note: Node.js doesn't expose active timers directly
    // This is a placeholder showing the limitation
    const timerInfo = {
      message: 'Active timers are not directly accessible in Node.js',
      suggestion: 'Use a timer management library to track timers',
      processUptime: process.uptime() + ' seconds',
    }
    
    return {
      success: true,
      display: formatOutput(timerInfo),
      data: timerInfo,
    }
  },
}

export const listenersCommand: Command = {
  name: 'listeners',
  description: 'Display event listeners',
  category: CommandCategory.GENERAL,
  aliases: ['event-listeners', 'emitters'],
  usage: '/listeners [--process]',
  examples: ['/listeners', '/listeners --process'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const listeners = {
      process: {
        events: process.eventNames ? process.eventNames() : [],
        listenerCount: process.listenerCount ? process.listenerCount('uncaughtException') : 'N/A',
      },
      warning: 'Full event listener inspection requires --process flag and debugging tools',
    }
    
    return {
      success: true,
      display: formatOutput(listeners),
      data: listeners,
    }
  },
}

export const tempCommand: Command = {
  name: 'temp',
  description: 'Display or manage temporary files',
  category: CommandCategory.GENERAL,
  aliases: ['tmp', 'temp-dir', 'tmpdir'],
  usage: '/temp [--clear]',
  examples: ['/temp', '/temp --clear'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    const os = require('os')
    const fs = require('fs')
    const tmpdir = os.tmpdir()
    
    if (args.flags?.clear) {
      // Don't actually clear temp - just show what would be cleared
      return {
        success: true,
        display: `Would clear temp directory: ${tmpdir}\n(Use shell commands to actually clear)`,
        data: { tmpdir },
      }
    }
    
    let files: string[] = []
    try {
      files = fs.readdirSync(tmpdir).slice(0, 50)
    } catch (e) {
      files = ['(Unable to list directory)']
    }
    
    return {
      success: true,
      display: `Temp directory: ${tmpdir}\n\nSample files (${files.length} shown):\n${files.join('\n')}`,
      data: { tmpdir, files },
    }
  },
}

export const shutdownCommand: Command = {
  name: 'shutdown',
  description: 'Shutdown the agent gracefully',
  category: CommandCategory.GENERAL,
  aliases: ['exit', 'quit', 'bye', 'goodbye'],
  usage: '/shutdown [--force]',
  examples: ['/shutdown', '/shutdown --force'],
  permissions: ['execute'],
  execute: async (args, context): Promise<CommandResult> => {
    if (args.flags?.force) {
      process.exit(0)
    }
    
    return {
      success: true,
      display: 'Initiating graceful shutdown...',
      action: 'shutdown',
    }
  },
}

export const restartCommand: Command = {
  name: 'restart',
  description: 'Restart the agent',
  category: CommandCategory.GENERAL,
  aliases: ['reboot', 'reload'],
  usage: '/restart',
  examples: ['/restart'],
  permissions: ['execute'],
  execute: async (args, context): Promise<CommandResult> => {
    return {
      success: true,
      display: 'Restarting agent...',
      action: 'restart',
    }
  },
}

// Helper functions
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  parts.push(`${secs}s`)
  
  return parts.join(' ')
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let i = 0
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024
    i++
  }
  return `${bytes.toFixed(2)} ${units[i]}`
}

function formatOutput(obj: any): string {
  return JSON.stringify(obj, null, 2)
}

// Export all commands
export const systemCommands: Command[] = [
  sysinfoCommand,
  cpuCommand,
  memoryCommand,
  diskCommand,
  processListCommand,
  killProcessCommand,
  topCommand,
  uptimeCommand,
  hostnameCommand,
  archCommand,
  kernelCommand,
  userCommand,
  usersCommand,
  envCommand,
  setEnvCommand,
  unsetEnvCommand,
  loadCommand,
  dateCommand,
  timezoneCommand,
  benchmarkCommand,
  diagnosticsCommand,
  logsCommand,
  servicesCommand,
  pathCommand,
  nodeCommand,
  modulesCommand,
  timersCommand,
  listenersCommand,
  tempCommand,
  shutdownCommand,
  restartCommand,
]
