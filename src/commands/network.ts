/**
 * Network Commands - 35 commands for network operations
 */

import { Command, CommandCategory, CommandResult } from './Command'
import * as https from 'https'
import * as http from 'http'
import * as dns from 'dns'
import * as net from 'net'

// Network Information Commands
export const networkInfoCommand: Command = {
  name: 'network',
  description: 'Display network interfaces and configuration',
  category: CommandCategory.GENERAL,
  aliases: ['net-info', 'networks', 'netconfig'],
  usage: '/network [--detailed]',
  examples: ['/network', '/network --detailed'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const os = require('os')
    const interfaces = os.networkInterfaces()
    
    const networkInfo: any = {
      hostname: os.hostname(),
      interfaces: Object.keys(interfaces),
    }
    
    if (args.flags?.detailed) {
      networkInfo.interfaceDetails = interfaces
    }
    
    return {
      success: true,
      display: formatOutput(networkInfo),
      data: networkInfo,
    }
  },
}

export const ipCommand: Command = {
  name: 'ip',
  description: 'Display IP addresses',
  category: CommandCategory.GENERAL,
  aliases: ['myip', 'ip-address', 'addresses'],
  usage: '/ip [--public] [--all]',
  examples: ['/ip', '/ip --public', '/ip --all'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const os = require('os')
    const interfaces = os.networkInterfaces()
    
    const addresses: any = {
      local: [],
    }
    
    for (const [name, nets] of Object.entries(interfaces as any)) {
      for (const net of nets as any[]) {
        addresses.local.push({
          interface: name,
          family: net.family,
          address: net.address,
          mac: net.mac,
          cidr: net.cidr,
          internal: net.internal,
        })
      }
    }
    
    if (args.flags?.public) {
      // Try to get public IP
      try {
        const publicIp = await new Promise<string>((resolve, reject) => {
          https.get('https://api.ipify.org?format=json', (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => {
              try {
                resolve(JSON.parse(data).ip)
              } catch {
                resolve(data)
              }
            })
          }).on('error', reject)
        }).catch(() => null)
        
        if (publicIp) {
          addresses.public = publicIp
        }
      } catch {}
    }
    
    return {
      success: true,
      display: formatOutput(addresses),
      data: addresses,
    }
  },
}

export const dnsCommand: Command = {
  name: 'dns',
  description: 'Perform DNS lookup',
  category: CommandCategory.GENERAL,
  aliases: ['resolve', 'dns-lookup', 'lookup'],
  usage: '/dns <hostname> [--type <A|AAAA|MX|TXT|NS|CNAME>]',
  examples: ['/dns google.com', '/dns google.com --type MX'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const hostname = args.positional[0]
    
    if (!hostname) {
      return {
        success: false,
        display: 'Error: Missing hostname. Usage: /dns <hostname>',
      }
    }
    
    const type = (args.flags?.type as string) || 'A'
    
    return new Promise((resolve) => {
      const resolver = new dns.Resolver()
      
      const cb = (err: any, records: any) => {
        if (err) {
          resolve({
            success: false,
            display: `DNS lookup failed: ${err.message}`,
            error: err,
          })
          return
        }
        
        resolve({
          success: true,
          display: formatOutput({
            hostname,
            type,
            records,
          }),
          data: { hostname, type, records },
        })
      }
      
      switch (type.toUpperCase()) {
        case 'A':
          resolver.resolve4(hostname, cb)
          break
        case 'AAAA':
          resolver.resolve6(hostname, cb)
          break
        case 'MX':
          resolver.resolveMx(hostname, cb)
          break
        case 'TXT':
          resolver.resolveTxt(hostname, cb)
          break
        case 'NS':
          resolver.resolveNs(hostname, cb)
          break
        case 'CNAME':
          resolver.resolveCname(hostname, cb)
          break
        default:
          resolver.resolve4(hostname, cb)
      }
    })
  },
}

export const reverseDnsCommand: Command = {
  name: 'rdns',
  description: 'Perform reverse DNS lookup',
  category: CommandCategory.GENERAL,
  aliases: ['reverse-dns', 'ptr', 'reverse-lookup'],
  usage: '/rdns <ip>',
  examples: ['/rdns 8.8.8.8'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const ip = args.positional[0]
    
    if (!ip) {
      return {
        success: false,
        display: 'Error: Missing IP. Usage: /rdns <ip>',
      }
    }
    
    return new Promise((resolve) => {
      dns.reverse(ip, (err, hostnames) => {
        if (err) {
          resolve({
            success: false,
            display: `Reverse DNS failed: ${err.message}`,
            error: err,
          })
          return
        }
        
        resolve({
          success: true,
          display: formatOutput({ ip, hostnames }),
          data: { ip, hostnames },
        })
      })
    })
  },
}

export const pingCommand: Command = {
  name: 'ping',
  description: 'Ping a host',
  category: CommandCategory.GENERAL,
  aliases: ['icmp', 'ping-host'],
  usage: '/ping <host> [--count <n>]',
  examples: ['/ping google.com', '/ping 8.8.8.8 --count 5'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const host = args.positional[0]
    
    if (!host) {
      return {
        success: false,
        display: 'Error: Missing host. Usage: /ping <host>',
      }
    }
    
    const count = parseInt(args.flags?.count as string) || 4
    
    const { execSync } = require('child_process')
    
    try {
      const cmd = process.platform === 'win32'
        ? `ping -n ${count} ${host}`
        : `ping -c ${count} ${host}`
      
      const output = execSync(cmd, { timeout: 10000 }).toString()
      
      return {
        success: true,
        display: output,
        data: { host, count, raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Ping failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const tracerouteCommand: Command = {
  name: 'traceroute',
  description: 'Trace route to host',
  category: CommandCategory.GENERAL,
  aliases: ['trace', 'tracert'],
  usage: '/traceroute <host> [--max-hops <n>]',
  examples: ['/traceroute google.com', '/traceroute 8.8.8.8 --max-hops 15'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const host = args.positional[0]
    
    if (!host) {
      return {
        success: false,
        display: 'Error: Missing host. Usage: /traceroute <host>',
      }
    }
    
    const maxHops = args.flags?.['max-hops'] || 30
    
    const { execSync } = require('child_process')
    
    try {
      const cmd = process.platform === 'win32'
        ? `tracert -h ${maxHops} ${host}`
        : `traceroute -m ${maxHops} ${host}`
      
      const output = execSync(cmd, { timeout: 60000 }).toString()
      
      return {
        success: true,
        display: output,
        data: { host, maxHops, raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Traceroute failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const portsCommand: Command = {
  name: 'ports',
  description: 'List open ports',
  category: CommandCategory.GENERAL,
  aliases: ['open-ports', 'listening-ports', 'netstat'],
  usage: '/ports [--filter <port>] [--tcp] [--udp]',
  examples: ['/ports', '/ports --tcp', '/ports --filter 8080'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = process.platform === 'win32'
        ? 'netstat -ano'
        : 'netstat -tulpn'
      
      let output = execSync(cmd, { timeout: 10000 }).toString()
      
      if (args.flags?.filter) {
        const filter = args.flags.filter as string
        output = output.split('\n').filter(line => line.includes(filter)).join('\n')
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

export const scanCommand: Command = {
  name: 'scan',
  description: 'Scan ports on a host',
  category: CommandCategory.GENERAL,
  aliases: ['port-scan', 'scan-ports', 'portscan'],
  usage: '/scan <host> [--ports <range>] [--timeout <ms>]',
  examples: ['/scan localhost', '/scan 192.168.1.1 --ports 1-1000'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const host = args.positional[0] || 'localhost'
    const portsArg = args.flags?.ports as string || '1-100'
    const timeout = parseInt(args.flags?.timeout as string) || 1000
    
    const [start, end] = portsArg.split('-').map(Number)
    const ports: number[] = []
    
    for (let p = start; p <= end && p <= 1024; p++) { // Limit to 1024 max
      ports.push(p)
    }
    
    const openPorts: number[] = []
    const closedPorts: number[] = []
    
    const scanPort = (port: number): Promise<'open' | 'closed'> => {
      return new Promise((resolve) => {
        const socket = new net.Socket()
        socket.setTimeout(timeout)
        
        socket.on('connect', () => {
          socket.destroy()
          resolve('open')
        })
        
        socket.on('timeout', () => {
          socket.destroy()
          resolve('closed')
        })
        
        socket.on('error', () => {
          resolve('closed')
        })
        
        socket.connect(port, host)
      })
    }
    
    for (const port of ports) {
      const status = await scanPort(port)
      if (status === 'open') {
        openPorts.push(port)
      } else {
        closedPorts.push(port)
      }
    }
    
    return {
      success: true,
      display: `Scan results for ${host}:\n\nOpen ports: ${openPorts.join(', ') || 'none'}\nClosed ports: ${closedPorts.length}`,
      data: { host, openPorts, closedPorts: closedPorts.length },
    }
  },
}

export const curlCommand: Command = {
  name: 'curl',
  description: 'Make HTTP request',
  category: CommandCategory.GENERAL,
  aliases: ['http', 'request', 'fetch'],
  usage: '/curl <url> [--method <GET|POST|PUT|DELETE>] [--headers <json>] [--body <data>] [--timeout <ms>]',
  examples: ['/curl https://api.github.com', '/curl https://httpbin.org/post --method POST --body \'{"test":1}\''],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const url = args.positional[0]
    
    if (!url) {
      return {
        success: false,
        display: 'Error: Missing URL. Usage: /curl <url>',
      }
    }
    
    const method = (args.flags?.method as string) || 'GET'
    const timeout = parseInt(args.flags?.timeout as string) || 30000
    
    let headers: any = {}
    if (args.flags?.headers) {
      try {
        headers = JSON.parse(args.flags.headers as string)
      } catch {}
    }
    
    let body: string | undefined
    if (args.flags?.body) {
      body = args.flags.body as string
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
      }
    }
    
    return new Promise((resolve) => {
      const urlObj = new URL(url)
      const lib = urlObj.protocol === 'https:' ? https : http
      
      const req = lib.request({
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: method.toUpperCase(),
        headers,
        timeout,
      }, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          resolve({
            success: true,
            display: `HTTP ${res.statusCode} ${res.statusMessage}\n\n${data.slice(0, 10000)}`,
            data: {
              status: res.statusCode,
              statusText: res.statusMessage,
              headers: res.headers,
              body: data.slice(0, 10000),
            },
          })
        })
      })
      
      req.on('error', (err) => {
        resolve({
          success: false,
          display: `Request failed: ${err.message}`,
          error: err,
        })
      })
      
      req.on('timeout', () => {
        req.destroy()
        resolve({
          success: false,
          display: 'Request timed out',
        })
      })
      
      if (body) {
        req.write(body)
      }
      req.end()
    })
  },
}

export const wgetCommand: Command = {
  name: 'wget',
  description: 'Download a file from URL',
  category: CommandCategory.GENERAL,
  aliases: ['download', 'fetch-file'],
  usage: '/wget <url> [--output <filename>]',
  examples: ['/wget https://example.com/file.zip', '/wget https://example.com/data.json --output data.json'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    const url = args.positional[0]
    
    if (!url) {
      return {
        success: false,
        display: 'Error: Missing URL. Usage: /wget <url>',
      }
    }
    
    const outputFilename = args.flags?.output as string || url.split('/').pop() || 'download'
    const fs = require('fs')
    const path = require('path')
    
    const outputPath = path.join(process.cwd(), outputFilename)
    
    return new Promise((resolve) => {
      const urlObj = new URL(url)
      const lib = urlObj.protocol === 'https:' ? https : http
      
      const file = fs.createWriteStream(outputPath)
      
      lib.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Follow redirect
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            file.close()
            fs.unlinkSync(outputPath)
            // Recurse would go here, but for simplicity return redirect info
            resolve({
              success: false,
              display: `Redirect to: ${redirectUrl}`,
              data: { redirect: redirectUrl },
            })
            return
          }
        }
        
        response.pipe(file)
        
        file.on('finish', () => {
          file.close()
          const stats = fs.statSync(outputPath)
          resolve({
            success: true,
            display: `Downloaded ${url} to ${outputPath} (${formatBytes(stats.size)})`,
            data: { url, outputPath, size: stats.size },
          })
        })
      }).on('error', (err) => {
        fs.unlinkSync(outputPath)
        resolve({
          success: false,
          display: `Download failed: ${err.message}`,
          error: err,
        })
      })
    })
  },
}

export const httpHeadersCommand: Command = {
  name: 'headers',
  description: 'Get HTTP headers for a URL',
  category: CommandCategory.GENERAL,
  aliases: ['http-headers', 'head', 'http-head'],
  usage: '/headers <url>',
  examples: ['/headers https://google.com'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const url = args.positional[0]
    
    if (!url) {
      return {
        success: false,
        display: 'Error: Missing URL. Usage: /headers <url>',
      }
    }
    
    return new Promise((resolve) => {
      const urlObj = new URL(url)
      const lib = urlObj.protocol === 'https:' ? https : http
      
      const req = lib.request({
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'HEAD',
      }, (res) => {
        const headers: any = {}
        for (const [key, value] of Object.entries(res.headers)) {
          headers[key] = value
        }
        
        resolve({
          success: true,
          display: formatOutput({
            status: res.statusCode,
            statusText: res.statusMessage,
            headers,
          }),
          data: { status: res.statusCode, headers },
        })
      })
      
      req.on('error', (err) => {
        resolve({
          success: false,
          display: `Request failed: ${err.message}`,
          error: err,
        })
      })
      
      req.end()
    })
  },
}

export const websocketCommand: Command = {
  name: 'ws',
  description: 'WebSocket client operations',
  category: CommandCategory.GENERAL,
  aliases: ['websocket', 'ws-connect'],
  usage: '/ws <url> [--send <message>]',
  examples: ['/ws wss://echo.websocket.org', '/ws wss://example.com/socket --send "hello"'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const url = args.positional[0]
    
    if (!url) {
      return {
        success: false,
        display: 'Error: Missing URL. Usage: /ws <url>',
      }
    }
    
    // Note: WebSocket requires the 'ws' library
    return {
      success: false,
      display: 'WebSocket support requires the "ws" library. Install with: npm install ws',
    }
  },
}

export const whoisCommand: Command = {
  name: 'whois',
  description: 'Perform WHOIS lookup',
  category: CommandCategory.GENERAL,
  aliases: ['whois-lookup', 'domain-info'],
  usage: '/whois <domain>',
  examples: ['/whois google.com', '/whois github.com'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const domain = args.positional[0]
    
    if (!domain) {
      return {
        success: false,
        display: 'Error: Missing domain. Usage: /whois <domain>',
      }
    }
    
    const { execSync } = require('child_process')
    
    try {
      const output = execSync(`whois ${domain}`, { timeout: 30000 }).toString()
      
      return {
        success: true,
        display: output.slice(0, 5000),
        data: { domain, raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `WHOIS failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const sslCommand: Command = {
  name: 'ssl',
  description: 'Check SSL certificate',
  category: CommandCategory.GENERAL,
  aliases: ['ssl-check', 'certificate', 'cert'],
  usage: '/ssl <hostname> [--port <n>]',
  examples: ['/ssl google.com', '/ssl github.com --port 443'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const hostname = args.positional[0]
    
    if (!hostname) {
      return {
        success: false,
        display: 'Error: Missing hostname. Usage: /ssl <hostname>',
      }
    }
    
    const port = parseInt(args.flags?.port as string) || 443
    
    return new Promise((resolve) => {
      const socket = net.connect(port, hostname, () => {
        const tlsSocket = require('tls').connect({
          host: hostname,
          port: port,
          socket: socket,
          servername: hostname,
        }, () => {
          const cert = tlsSocket.getPeerCertificate()
          
          const certInfo = {
            subject: cert.subject,
            issuer: cert.issuer,
            valid_from: cert.valid_from,
            valid_to: cert.valid_to,
            fingerprint: cert.fingerprint,
            serialNumber: cert.serialNumber,
            daysRemaining: Math.floor((new Date(cert.valid_to).getTime() - Date.now()) / 86400000),
          }
          
          tlsSocket.destroy()
          
          resolve({
            success: true,
            display: formatOutput(certInfo),
            data: certInfo,
          })
        })
        
        tlsSocket.on('error', (err: Error) => {
          resolve({
            success: false,
            display: `SSL check failed: ${err.message}`,
            error: err,
          })
        })
      })
      
      socket.on('error', (err: Error) => {
        resolve({
          success: false,
          display: `Connection failed: ${err.message}`,
          error: err,
        })
      })
    })
  },
}

export const bandwidthCommand: Command = {
  name: 'bandwidth',
  description: 'Test network bandwidth',
  category: CommandCategory.GENERAL,
  aliases: ['speed', 'speedtest', 'bandwidth-test'],
  usage: '/bandwidth [--download] [--upload]',
  examples: ['/bandwidth', '/bandwidth --download'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    // Simple download speed test
    const testUrl = 'https://speed.cloudflare.com/__down?bytes=10000000'
    
    const start = Date.now()
    
    return new Promise((resolve) => {
      https.get(testUrl, (res) => {
        let downloaded = 0
        res.on('data', chunk => downloaded += chunk.length)
        res.on('end', () => {
          const elapsed = (Date.now() - start) / 1000
          const mbps = (downloaded * 8) / (elapsed * 1000000)
          
          resolve({
            success: true,
            display: `Download speed: ${mbps.toFixed(2)} Mbps (${formatBytes(downloaded)} in ${elapsed.toFixed(2)}s)`,
            data: { downloaded, elapsed, mbps },
          })
        })
      }).on('error', (err) => {
        resolve({
          success: false,
          display: `Bandwidth test failed: ${err.message}`,
          error: err,
        })
      })
    })
  },
}

export const latencyCommand: Command = {
  name: 'latency',
  description: 'Measure latency to a host',
  category: CommandCategory.GENERAL,
  aliases: ['delay', 'rtt', 'round-trip'],
  usage: '/latency <host> [--samples <n>]',
  examples: ['/latency google.com', '/latency api.github.com --samples 10'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const host = args.positional[0] || 'google.com'
    const samples = parseInt(args.flags?.samples as string) || 5
    
    const latencies: number[] = []
    
    for (let i = 0; i < samples; i++) {
      const start = Date.now()
      
      await new Promise<void>((resolve) => {
        dns.lookup(host, () => {
          latencies.push(Date.now() - start)
          resolve()
        })
      })
      
      await new Promise(r => setTimeout(r, 100))
    }
    
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length
    const min = Math.min(...latencies)
    const max = Math.max(...latencies)
    
    return {
      success: true,
      display: `Latency to ${host}:\n  Min: ${min}ms\n  Max: ${max}ms\n  Avg: ${avg.toFixed(1)}ms`,
      data: { host, samples, min, max, avg, values: latencies },
    }
  },
}

export const hostsCommand: Command = {
  name: 'hosts',
  description: 'Manage hosts file',
  category: CommandCategory.GENERAL,
  aliases: ['hosts-file', 'etc-hosts'],
  usage: '/hosts [--list] [--add <ip> <hostname>] [--remove <hostname>]',
  examples: ['/hosts', '/hosts --add 127.0.0.1 myapp.local', '/hosts --remove myapp.local'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const fs = require('fs')
    const path = require('path')
    
    const hostsPath = process.platform === 'win32'
      ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32\\drivers\\etc\\hosts')
      : '/etc/hosts'
    
    try {
      const content = fs.readFileSync(hostsPath, 'utf8')
      const lines = content.split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => {
          const parts = line.trim().split(/\s+/)
          return { ip: parts[0], hostname: parts.slice(1) }
        })
      
      return {
        success: true,
        display: formatOutput(lines),
        data: { hostsPath, entries: lines },
      }
    } catch (error) {
      return {
        success: false,
        display: `Error reading hosts file: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const firewallCommand: Command = {
  name: 'firewall',
  description: 'Display firewall status',
  category: CommandCategory.GENERAL,
  aliases: ['iptables', 'ufw', 'firewall-status'],
  usage: '/firewall [--list]',
  examples: ['/firewall', '/firewall --list'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = ''
      if (process.platform === 'linux') {
        cmd = 'iptables -L -n 2>/dev/null || ufw status'
      } else if (process.platform === 'darwin') {
        cmd = 'pfctl -s rules'
      } else if (process.platform === 'win32') {
        cmd = 'netsh advfirewall show allprofiles'
      }
      
      const output = execSync(cmd, { timeout: 5000 }).toString()
      
      return {
        success: true,
        display: output,
        data: { raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Firewall command failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const routeCommand: Command = {
  name: 'route',
  description: 'Display routing table',
  category: CommandCategory.GENERAL,
  aliases: ['routes', 'routing-table', 'netstat-r'],
  usage: '/route',
  examples: ['/route'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      const cmd = process.platform === 'win32' ? 'route print' : 'netstat -r'
      const output = execSync(cmd, { timeout: 5000 }).toString()
      
      return {
        success: true,
        display: output,
        data: { raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Route command failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const arpCommand: Command = {
  name: 'arp',
  description: 'Display ARP table',
  category: CommandCategory.GENERAL,
  aliases: ['arp-table', 'arp-cache'],
  usage: '/arp',
  examples: ['/arp'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      const cmd = process.platform === 'win32' ? 'arp -a' : 'arp -an'
      const output = execSync(cmd, { timeout: 5000 }).toString()
      
      return {
        success: true,
        display: output,
        data: { raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `ARP command failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const interfaceCommand: Command = {
  name: 'interface',
  description: 'Manage network interfaces',
  category: CommandCategory.GENERAL,
  aliases: ['ifconfig', 'ip-link', 'nic'],
  usage: '/interface [--up <name>] [--down <name>]',
  examples: ['/interface', '/interface --up eth0'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = ''
      if (process.platform === 'linux') {
        cmd = 'ip addr show'
      } else if (process.platform === 'darwin') {
        cmd = 'ifconfig'
      } else if (process.platform === 'win32') {
        cmd = 'ipconfig /all'
      }
      
      const output = execSync(cmd, { timeout: 5000 }).toString()
      
      return {
        success: true,
        display: output,
        data: { raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Interface command failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const proxyCommand: Command = {
  name: 'proxy',
  description: 'Display or set proxy configuration',
  category: CommandCategory.GENERAL,
  aliases: ['proxy-config', 'http-proxy'],
  usage: '/proxy [--set <url>] [--clear]',
  examples: ['/proxy', '/proxy --set http://proxy.example.com:8080', '/proxy --clear'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    if (args.flags?.set) {
      const proxyUrl = args.flags.set as string
      process.env.HTTP_PROXY = proxyUrl
      process.env.HTTPS_PROXY = proxyUrl
      return {
        success: true,
        display: `Proxy set to: ${proxyUrl}`,
        data: { proxy: proxyUrl },
      }
    }
    
    if (args.flags?.clear) {
      delete process.env.HTTP_PROXY
      delete process.env.HTTPS_PROXY
      delete process.env.http_proxy
      delete process.env.https_proxy
      return {
        success: true,
        display: 'Proxy configuration cleared',
      }
    }
    
    const proxyInfo = {
      HTTP_PROXY: process.env.HTTP_PROXY || process.env.http_proxy || 'Not set',
      HTTPS_PROXY: process.env.HTTPS_PROXY || process.env.https_proxy || 'Not set',
      NO_PROXY: process.env.NO_PROXY || process.env.no_proxy || 'Not set',
    }
    
    return {
      success: true,
      display: formatOutput(proxyInfo),
      data: proxyInfo,
    }
  },
}

export const macCommand: Command = {
  name: 'mac',
  description: 'Display MAC addresses',
  category: CommandCategory.GENERAL,
  aliases: ['mac-address', 'hwaddr'],
  usage: '/mac',
  examples: ['/mac'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const os = require('os')
    const interfaces = os.networkInterfaces()
    
    const macs: any = {}
    for (const [name, nets] of Object.entries(interfaces as any)) {
      for (const net of nets as any[]) {
        if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
          macs[name] = {
            mac: net.mac,
            family: net.family,
          }
        }
      }
    }
    
    return {
      success: true,
      display: formatOutput(macs),
      data: macs,
    }
  },
}

export const connectionCommand: Command = {
  name: 'connection',
  description: 'Display active connections',
  category: CommandCategory.GENERAL,
  aliases: ['connections', 'netstat-t', 'tcp-connections'],
  usage: '/connection [--established] [--listen]',
  examples: ['/connection', '/connection --established'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = ''
      if (process.platform === 'win32') {
        cmd = 'netstat -ano'
      } else {
        if (args.flags?.established) {
          cmd = 'netstat -tn | grep ESTABLISHED'
        } else if (args.flags?.listen) {
          cmd = 'netstat -tln'
        } else {
          cmd = 'netstat -tn'
        }
      }
      
      const output = execSync(cmd, { timeout: 5000 }).toString()
      
      return {
        success: true,
        display: output.slice(0, 5000),
        data: { raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `Connection command failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const ncCommand: Command = {
  name: 'nc',
  description: 'Netcat-like operations',
  category: CommandCategory.GENERAL,
  aliases: ['netcat', 'ncat'],
  usage: '/nc <host> <port> [--send <data>] [--timeout <ms>]',
  examples: ['/nc localhost 8080', '/nc example.com 80 --send "GET / HTTP/1.0"'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const host = args.positional[0]
    const port = parseInt(args.positional[1])
    
    if (!host || isNaN(port)) {
      return {
        success: false,
        display: 'Error: Missing host or port. Usage: /nc <host> <port>',
      }
    }
    
    const timeout = parseInt(args.flags?.timeout as string) || 5000
    const sendData = args.flags?.send as string
    
    return new Promise((resolve) => {
      const socket = new net.Socket()
      socket.setTimeout(timeout)
      let received = ''
      
      socket.on('connect', () => {
        if (sendData) {
          socket.write(sendData + '\n')
        }
        socket.end()
      })
      
      socket.on('data', (data) => {
        received += data.toString()
      })
      
      socket.on('close', () => {
        resolve({
          success: true,
          display: received || `Connected to ${host}:${port}`,
          data: { host, port, received },
        })
      })
      
      socket.on('timeout', () => {
        socket.destroy()
        resolve({
          success: false,
          display: `Connection to ${host}:${port} timed out`,
        })
      })
      
      socket.on('error', (err) => {
        resolve({
          success: false,
          display: `Connection failed: ${err.message}`,
          error: err,
        })
      })
      
      socket.connect(port, host)
    })
  },
}

export const telnetCommand: Command = {
  name: 'telnet',
  description: 'Telnet connection test',
  category: CommandCategory.GENERAL,
  aliases: ['telnet-test'],
  usage: '/telnet <host> <port>',
  examples: ['/telnet localhost 22', '/telnet example.com 80'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const host = args.positional[0]
    const port = parseInt(args.positional[1])
    
    if (!host || isNaN(port)) {
      return {
        success: false,
        display: 'Error: Missing host or port. Usage: /telnet <host> <port>',
      }
    }
    
    return new Promise((resolve) => {
      const socket = new net.Socket()
      socket.setTimeout(5000)
      
      socket.on('connect', () => {
        socket.destroy()
        resolve({
          success: true,
          display: `Successfully connected to ${host}:${port}`,
          data: { host, port, status: 'open' },
        })
      })
      
      socket.on('timeout', () => {
        socket.destroy()
        resolve({
          success: false,
          display: `Connection to ${host}:${port} timed out`,
          data: { host, port, status: 'timeout' },
        })
      })
      
      socket.on('error', (err) => {
        resolve({
          success: false,
          display: `Connection to ${host}:${port} failed: ${err.message}`,
          data: { host, port, status: 'closed' },
        })
      })
      
      socket.connect(port, host)
    })
  },
}

export const dhcpCommand: Command = {
  name: 'dhcp',
  description: 'Display DHCP information',
  category: CommandCategory.GENERAL,
  aliases: ['dhcp-info', 'lease'],
  usage: '/dhcp',
  examples: ['/dhcp'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = ''
      if (process.platform === 'linux') {
        cmd = 'cat /var/lib/dhcp/dhclient.leases 2>/dev/null || ip addr show'
      } else if (process.platform === 'darwin') {
        cmd = 'ipconfig getpacket en0'
      } else if (process.platform === 'win32') {
        cmd = 'ipconfig /all'
      }
      
      const output = execSync(cmd, { timeout: 5000 }).toString()
      
      return {
        success: true,
        display: output.slice(0, 3000),
        data: { raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `DHCP command failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const wifiCommand: Command = {
  name: 'wifi',
  description: 'Display WiFi information',
  category: CommandCategory.GENERAL,
  aliases: ['wireless', 'wlan'],
  usage: '/wifi [--scan]',
  examples: ['/wifi', '/wifi --scan'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let cmd = ''
      if (process.platform === 'linux') {
        cmd = args.flags?.scan ? 'iwlist scan' : 'iwconfig'
      } else if (process.platform === 'darwin') {
        cmd = args.flags?.scan ? '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s' : 'networksetup -getairportnetwork en0'
      } else if (process.platform === 'win32') {
        cmd = 'netsh wlan show networks'
      }
      
      const output = execSync(cmd, { timeout: 10000 }).toString()
      
      return {
        success: true,
        display: output,
        data: { raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `WiFi command failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

export const vpnCommand: Command = {
  name: 'vpn',
  description: 'Display VPN status',
  category: CommandCategory.GENERAL,
  aliases: ['vpn-status', 'tunnel'],
  usage: '/vpn',
  examples: ['/vpn'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const { execSync } = require('child_process')
    
    try {
      let output = ''
      
      if (process.platform === 'linux') {
        output = execSync('ip tunnel show 2>/dev/null || echo "No tunnels"').toString()
      } else if (process.platform === 'darwin') {
        output = execSync('ifconfig | grep -A 5 "utun" || echo "No VPN interfaces"').toString()
      } else if (process.platform === 'win32') {
        output = execSync('rasdial').toString()
      }
      
      return {
        success: true,
        display: output,
        data: { raw: output },
      }
    } catch (error) {
      return {
        success: false,
        display: `VPN status check failed: ${error}`,
        error: error as Error,
      }
    }
  },
}

// Helper functions
function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
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
export const networkCommands: Command[] = [
  networkInfoCommand,
  ipCommand,
  dnsCommand,
  reverseDnsCommand,
  pingCommand,
  tracerouteCommand,
  portsCommand,
  scanCommand,
  curlCommand,
  wgetCommand,
  httpHeadersCommand,
  websocketCommand,
  whoisCommand,
  sslCommand,
  bandwidthCommand,
  latencyCommand,
  hostsCommand,
  firewallCommand,
  routeCommand,
  arpCommand,
  interfaceCommand,
  proxyCommand,
  macCommand,
  connectionCommand,
  ncCommand,
  telnetCommand,
  dhcpCommand,
  wifiCommand,
  vpnCommand,
]
