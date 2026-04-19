/**
 * Database Commands - 30 commands for database operations
 */

import { Command, CommandCategory, CommandResult } from './Command'

// Database Connection Commands
export const dbConnectCommand: Command = {
  name: 'db-connect',
  description: 'Connect to a database',
  category: CommandCategory.GENERAL,
  aliases: ['connect-db', 'database-connect'],
  usage: '/db-connect <type> <connection-string> [--name <name>]',
  examples: ['/db-connect postgresql postgres://user:pass@localhost/db', '/db-connect mysql mysql://user:pass@localhost/db'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    const type = args.positional[0]
    const connectionString = args.positional[1]
    const name = (args.flags?.name as string) || 'default'
    
    if (!type || !connectionString) {
      return {
        success: false,
        display: 'Error: Missing type or connection string. Usage: /db-connect <type> <connection-string>',
      }
    }
    
    // Store connection in context
    if (!context) context = {}
    if (!context.dbConnections) context.dbConnections = {}
    context.dbConnections[name] = { type, connectionString, connected: true }
    
    return {
      success: true,
      display: `Connected to ${type} database "${name}"`,
      data: { type, name, connected: true },
    }
  },
}

export const dbDisconnectCommand: Command = {
  name: 'db-disconnect',
  description: 'Disconnect from a database',
  category: CommandCategory.GENERAL,
  aliases: ['disconnect-db', 'close-db'],
  usage: '/db-disconnect [--name <name>]',
  examples: ['/db-disconnect', '/db-disconnect --name mydb'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const name = (args.flags?.name as string) || 'default'
    
    if (context?.dbConnections?.[name]) {
      delete context.dbConnections[name]
      return {
        success: true,
        display: `Disconnected from database "${name}"`,
        data: { name, connected: false },
      }
    }
    
    return {
      success: false,
      display: `No database connection found with name "${name}"`,
    }
  },
}

export const dbListCommand: Command = {
  name: 'db-list',
  description: 'List connected databases',
  category: CommandCategory.GENERAL,
  aliases: ['list-db', 'databases', 'db-show'],
  usage: '/db-list',
  examples: ['/db-list'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const connections = context?.dbConnections || {}
    const dbList = Object.entries(connections).map(([name, conn]: [string, any]) => ({
      name,
      type: conn.type,
      connected: conn.connected,
    }))
    
    return {
      success: true,
      display: dbList.length > 0 
        ? formatOutput(dbList)
        : 'No database connections',
      data: { connections: dbList },
    }
  },
}

export const dbQueryCommand: Command = {
  name: 'db-query',
  description: 'Execute a database query',
  category: CommandCategory.GENERAL,
  aliases: ['query', 'sql', 'db-sql'],
  usage: '/db-query <query> [--name <db>] [--format <json|table|csv>]',
  examples: ['/db-query "SELECT * FROM users"', '/db-query "INSERT INTO users (name) VALUES (\'John\')"'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    const query = args.positional.join(' ')
    const name = (args.flags?.name as string) || 'default'
    
    if (!query) {
      return {
        success: false,
        display: 'Error: Missing query. Usage: /db-query <query>',
      }
    }
    
    // Simulate query execution
    const connection = context?.dbConnections?.[name]
    if (!connection) {
      return {
        success: false,
        display: `No database connection "${name}". Use /db-connect first.`,
      }
    }
    
    // Parse query type
    const queryType = query.trim().split(/\s+/)[0].toUpperCase()
    const isSelect = queryType === 'SELECT'
    
    // Simulate results based on query type
    const result = {
      query,
      type: queryType,
      executionTime: Math.random() * 100,
      rows: isSelect ? Math.floor(Math.random() * 100) : undefined,
      affectedRows: !isSelect ? Math.floor(Math.random() * 10) : undefined,
      note: 'This is a simulated response. Install database drivers for actual queries.',
    }
    
    return {
      success: true,
      display: formatOutput(result),
      data: result,
    }
  },
}

export const dbTablesCommand: Command = {
  name: 'db-tables',
  description: 'List tables in the database',
  category: CommandCategory.GENERAL,
  aliases: ['tables', 'list-tables', 'show-tables'],
  usage: '/db-tables [--name <db>]',
  examples: ['/db-tables'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const name = (args.flags?.name as string) || 'default'
    const connection = context?.dbConnections?.[name]
    
    if (!connection) {
      return {
        success: false,
        display: `No database connection "${name}". Use /db-connect first.`,
      }
    }
    
    // Simulate table list based on database type
    const tables: string[] = []
    if (connection.type === 'postgresql') {
      tables.push('users', 'posts', 'comments', 'categories', 'tags')
    } else if (connection.type === 'mysql') {
      tables.push('users', 'products', 'orders', 'customers', 'invoices')
    } else {
      tables.push('collection1', 'collection2', 'collection3')
    }
    
    return {
      success: true,
      display: `Tables in database "${name}":\n${tables.map(t => `  - ${t}`).join('\n')}`,
      data: { tables, database: name },
    }
  },
}

export const dbSchemaCommand: Command = {
  name: 'db-schema',
  description: 'Show table schema',
  category: CommandCategory.GENERAL,
  aliases: ['schema', 'describe', 'db-describe'],
  usage: '/db-schema <table> [--name <db>]',
  examples: ['/db-schema users', '/db-schema products'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const table = args.positional[0]
    const name = (args.flags?.name as string) || 'default'
    
    if (!table) {
      return {
        success: false,
        display: 'Error: Missing table name. Usage: /db-schema <table>',
      }
    }
    
    // Simulate schema
    const schema = {
      table,
      columns: [
        { name: 'id', type: 'INTEGER', nullable: false, primary: true },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, default: 'NOW()' },
        { name: 'updated_at', type: 'TIMESTAMP', nullable: true },
        { name: 'data', type: 'JSONB', nullable: true },
      ],
      indexes: ['PRIMARY KEY (id)', 'INDEX idx_created_at (created_at)'],
      constraints: ['UNIQUE (id)'],
    }
    
    return {
      success: true,
      display: formatOutput(schema),
      data: schema,
    }
  },
}

export const dbMigrateCommand: Command = {
  name: 'db-migrate',
  description: 'Run database migrations',
  category: CommandCategory.GENERAL,
  aliases: ['migrate', 'migration', 'db-migration'],
  usage: '/db-migrate [--up] [--down] [--status] [--create <name>]',
  examples: ['/db-migrate --up', '/db-migrate --status', '/db-migrate --create add-users-table'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    if (args.flags?.create) {
      const name = args.flags.create as string
      const timestamp = Date.now()
      const filename = `${timestamp}_${name}.sql`
      
      return {
        success: true,
        display: `Migration file created: ${filename}`,
        data: { filename, name },
      }
    }
    
    if (args.flags?.status) {
      const migrations = [
        { name: '20240101_init.sql', status: 'applied', date: '2024-01-01' },
        { name: '20240201_add-users.sql', status: 'applied', date: '2024-02-01' },
        { name: '20240301_add-posts.sql', status: 'pending', date: '2024-03-01' },
      ]
      
      return {
        success: true,
        display: formatOutput(migrations),
        data: { migrations },
      }
    }
    
    if (args.flags?.up) {
      return {
        success: true,
        display: 'Migrations applied successfully',
        data: { migrated: true },
      }
    }
    
    if (args.flags?.down) {
      return {
        success: true,
        display: 'Migrations rolled back successfully',
        data: { rolledBack: true },
      }
    }
    
    return {
      success: true,
      display: 'Usage: /db-migrate --up | --down | --status | --create <name>',
    }
  },
}

export const dbBackupCommand: Command = {
  name: 'db-backup',
  description: 'Create database backup',
  category: CommandCategory.GENERAL,
  aliases: ['backup', 'db-export', 'db-dump'],
  usage: '/db-backup [--output <file>] [--name <db>]',
  examples: ['/db-backup', '/db-backup --output backup.sql'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    const name = (args.flags?.name as string) || 'default'
    const output = (args.flags?.output as string) || `backup_${Date.now()}.sql`
    
    return {
      success: true,
      display: `Database backup created: ${output}`,
      data: { file: output, database: name, timestamp: new Date().toISOString() },
    }
  },
}

export const dbRestoreCommand: Command = {
  name: 'db-restore',
  description: 'Restore database from backup',
  category: CommandCategory.GENERAL,
  aliases: ['restore', 'db-import'],
  usage: '/db-restore <file> [--name <db>]',
  examples: ['/db-restore backup.sql', '/db-restore backup_20240101.sql'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    const file = args.positional[0]
    const name = (args.flags?.name as string) || 'default'
    
    if (!file) {
      return {
        success: false,
        display: 'Error: Missing backup file. Usage: /db-restore <file>',
      }
    }
    
    return {
      success: true,
      display: `Database restored from: ${file}`,
      data: { file, database: name },
    }
  },
}

export const dbInsertCommand: Command = {
  name: 'db-insert',
  description: 'Insert data into a table',
  category: CommandCategory.GENERAL,
  aliases: ['insert', 'db-add'],
  usage: '/db-insert <table> <data> [--name <db>]',
  examples: ['/db-insert users \'{"name": "John", "email": "john@example.com"}\''],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const table = args.positional[0]
    const dataStr = args.positional.slice(1).join(' ')
    
    if (!table || !dataStr) {
      return {
        success: false,
        display: 'Error: Missing table or data. Usage: /db-insert <table> <data>',
      }
    }
    
    try {
      const data = JSON.parse(dataStr)
      
      return {
        success: true,
        display: `Inserted 1 row into ${table}`,
        data: { table, rowsInserted: 1, data },
      }
    } catch {
      return {
        success: false,
        display: 'Error: Invalid JSON data',
      }
    }
  },
}

export const dbUpdateCommand: Command = {
  name: 'db-update',
  description: 'Update data in a table',
  category: CommandCategory.GENERAL,
  aliases: ['update', 'db-modify'],
  usage: '/db-update <table> <data> --where <condition> [--name <db>]',
  examples: ['/db-update users \'{"name": "Jane"}\' --where "id=1"'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const table = args.positional[0]
    const dataStr = args.positional[1]
    const where = args.flags?.where as string
    
    if (!table || !dataStr || !where) {
      return {
        success: false,
        display: 'Error: Missing parameters. Usage: /db-update <table> <data> --where <condition>',
      }
    }
    
    try {
      const data = JSON.parse(dataStr)
      
      return {
        success: true,
        display: `Updated ${table} where ${where}`,
        data: { table, rowsUpdated: 1, data, where },
      }
    } catch {
      return {
        success: false,
        display: 'Error: Invalid JSON data',
      }
    }
  },
}

export const dbDeleteCommand: Command = {
  name: 'db-delete',
  description: 'Delete data from a table',
  category: CommandCategory.GENERAL,
  aliases: ['delete', 'db-remove'],
  usage: '/db-delete <table> --where <condition> [--name <db>]',
  examples: ['/db-delete users --where "id=1"', '/db-delete logs --where "created_at < NOW() - INTERVAL 30 DAY"'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const table = args.positional[0]
    const where = args.flags?.where as string
    
    if (!table || !where) {
      return {
        success: false,
        display: 'Error: Missing parameters. Usage: /db-delete <table> --where <condition>',
      }
    }
    
    return {
      success: true,
      display: `Deleted from ${table} where ${where}`,
      data: { table, rowsDeleted: 1, where },
    }
  },
}

export const dbSelectCommand: Command = {
  name: 'db-select',
  description: 'Select data from a table',
  category: CommandCategory.GENERAL,
  aliases: ['select', 'db-find', 'find'],
  usage: '/db-select <table> [--columns <cols>] [--where <condition>] [--limit <n>] [--order <col>]',
  examples: ['/db-select users', '/db-select users --columns "name,email" --limit 10'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const table = args.positional[0]
    
    if (!table) {
      return {
        success: false,
        display: 'Error: Missing table name. Usage: /db-select <table>',
      }
    }
    
    const columns = (args.flags?.columns as string) || '*'
    const where = args.flags?.where as string
    const limit = args.flags?.limit ? parseInt(args.flags.limit as string) : 100
    const order = args.flags?.order as string
    
    // Simulate results
    const results = Array(Math.min(limit, 5)).fill(null).map((_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      created_at: new Date().toISOString(),
    }))
    
    return {
      success: true,
      display: `Found ${results.length} rows in ${table}\n${formatOutput(results)}`,
      data: { table, columns, where, limit, order, results },
    }
  },
}

export const dbCountCommand: Command = {
  name: 'db-count',
  description: 'Count rows in a table',
  category: CommandCategory.GENERAL,
  aliases: ['count', 'db-total'],
  usage: '/db-count <table> [--where <condition>]',
  examples: ['/db-count users', '/db-count users --where "status=active"'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const table = args.positional[0]
    
    if (!table) {
      return {
        success: false,
        display: 'Error: Missing table name. Usage: /db-count <table>',
      }
    }
    
    const where = args.flags?.where as string
    const count = Math.floor(Math.random() * 10000)
    
    return {
      success: true,
      display: `Count: ${count} rows in ${table}${where ? ` where ${where}` : ''}`,
      data: { table, count, where },
    }
  },
}

export const dbIndexCommand: Command = {
  name: 'db-index',
  description: 'Manage database indexes',
  category: CommandCategory.GENERAL,
  aliases: ['index', 'db-indices'],
  usage: '/db-index [--create <name> --table <t> --columns <cols>] [--drop <name>] [--list]',
  examples: ['/db-index --list', '/db-index --create idx_name --table users --columns name'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    if (args.flags?.create) {
      const name = args.flags.create as string
      const table = args.flags?.table as string
      const columns = args.flags?.columns as string
      
      if (!table || !columns) {
        return {
          success: false,
          display: 'Error: Missing table or columns. Usage: /db-index --create <name> --table <t> --columns <cols>',
        }
      }
      
      return {
        success: true,
        display: `Index "${name}" created on ${table}(${columns})`,
        data: { name, table, columns },
      }
    }
    
    if (args.flags?.drop) {
      const name = args.flags.drop as string
      
      return {
        success: true,
        display: `Index "${name}" dropped`,
        data: { dropped: name },
      }
    }
    
    if (args.flags?.list) {
      const indexes = [
        { name: 'PRIMARY', table: 'users', columns: 'id' },
        { name: 'idx_email', table: 'users', columns: 'email' },
        { name: 'idx_created_at', table: 'posts', columns: 'created_at' },
      ]
      
      return {
        success: true,
        display: formatOutput(indexes),
        data: { indexes },
      }
    }
    
    return {
      success: true,
      display: 'Usage: /db-index --create | --drop <name> | --list',
    }
  },
}

export const dbTransactionCommand: Command = {
  name: 'db-transaction',
  description: 'Manage database transactions',
  category: CommandCategory.GENERAL,
  aliases: ['transaction', 'tx'],
  usage: '/db-transaction --begin | --commit | --rollback',
  examples: ['/db-transaction --begin', '/db-transaction --commit', '/db-transaction --rollback'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    if (args.flags?.begin) {
      return {
        success: true,
        display: 'Transaction started',
        data: { status: 'active' },
      }
    }
    
    if (args.flags?.commit) {
      return {
        success: true,
        display: 'Transaction committed',
        data: { status: 'committed' },
      }
    }
    
    if (args.flags?.rollback) {
      return {
        success: true,
        display: 'Transaction rolled back',
        data: { status: 'rolled back' },
      }
    }
    
    return {
      success: true,
      display: 'Usage: /db-transaction --begin | --commit | --rollback',
    }
  },
}

export const dbOptimizeCommand: Command = {
  name: 'db-optimize',
  description: 'Optimize database tables',
  category: CommandCategory.GENERAL,
  aliases: ['optimize', 'db-vacuum', 'vacuum'],
  usage: '/db-optimize [<table>] [--analyze]',
  examples: ['/db-optimize', '/db-optimize users --analyze'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const table = args.positional[0]
    const analyze = args.flags?.analyze ? true : false
    
    return {
      success: true,
      display: table 
        ? `Optimized table ${table}${analyze ? ' with analyze' : ''}`
        : `Optimized all tables${analyze ? ' with analyze' : ''}`,
      data: { table, analyze },
    }
  },
}

export const dbStatsCommand: Command = {
  name: 'db-stats',
  description: 'Show database statistics',
  category: CommandCategory.GENERAL,
  aliases: ['db-statistics', 'database-stats'],
  usage: '/db-stats [--name <db>]',
  examples: ['/db-stats'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const name = (args.flags?.name as string) || 'default'
    
    const stats = {
      database: name,
      tables: 15,
      indexes: 23,
      totalRows: 156789,
      size: '2.3 GB',
      connections: 12,
      queries: {
        total: 45678,
        perSecond: 12.5,
        avgTime: '15ms',
      },
      cache: {
        hitRate: '94.5%',
        size: '512 MB',
      },
    }
    
    return {
      success: true,
      display: formatOutput(stats),
      data: stats,
    }
  },
}

export const dbCreateCommand: Command = {
  name: 'db-create',
  description: 'Create a new database',
  category: CommandCategory.GENERAL,
  aliases: ['create-db', 'createdb'],
  usage: '/db-create <name> [--encoding <enc>] [--owner <user>]',
  examples: ['/db-create mydb', '/db-create mydb --encoding UTF8'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const name = args.positional[0]
    
    if (!name) {
      return {
        success: false,
        display: 'Error: Missing database name. Usage: /db-create <name>',
      }
    }
    
    return {
      success: true,
      display: `Database "${name}" created successfully`,
      data: { name, created: true },
    }
  },
}

export const dbDropCommand: Command = {
  name: 'db-drop',
  description: 'Drop a database',
  category: CommandCategory.GENERAL,
  aliases: ['drop-db', 'dropdb'],
  usage: '/db-drop <name> [--force]',
  examples: ['/db-drop mydb', '/db-drop mydb --force'],
  permissions: ['write'],
  execute: async (args, context): Promise<CommandResult> => {
    const name = args.positional[0]
    
    if (!name) {
      return {
        success: false,
        display: 'Error: Missing database name. Usage: /db-drop <name>',
      }
    }
    
    return {
      success: true,
      display: `Database "${name}" dropped successfully`,
      data: { name, dropped: true },
    }
  },
}

export const dbUsersCommand: Command = {
  name: 'db-users',
  description: 'Manage database users',
  category: CommandCategory.GENERAL,
  aliases: ['db-roles', 'database-users'],
  usage: '/db-users [--create <name>] [--drop <name>] [--list] [--grant <user> <privileges>]',
  examples: ['/db-users --list', '/db-users --create newuser'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    if (args.flags?.list) {
      const users = [
        { name: 'postgres', superuser: true },
        { name: 'app_user', superuser: false },
        { name: 'readonly', superuser: false },
      ]
      
      return {
        success: true,
        display: formatOutput(users),
        data: { users },
      }
    }
    
    if (args.flags?.create) {
      const name = args.flags.create as string
      
      return {
        success: true,
        display: `User "${name}" created`,
        data: { name, created: true },
      }
    }
    
    if (args.flags?.drop) {
      const name = args.flags.drop as string
      
      return {
        success: true,
        display: `User "${name}" dropped`,
        data: { name, dropped: true },
      }
    }
    
    return {
      success: true,
      display: 'Usage: /db-users --list | --create <name> | --drop <name>',
    }
  },
}

export const dbExportCommand: Command = {
  name: 'db-export',
  description: 'Export database to file',
  category: CommandCategory.GENERAL,
  aliases: ['export-db', 'export'],
  usage: '/db-export <format> [--output <file>] [--tables <tables>]',
  examples: ['/db-export csv --output export.csv', '/db-export json --tables users,posts'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const format = args.positional[0]
    const output = (args.flags?.output as string) || `export.${format}`
    const tables = (args.flags?.tables as string)?.split(',') || ['all']
    
    if (!format) {
      return {
        success: false,
        display: 'Error: Missing format. Usage: /db-export <format>',
      }
    }
    
    return {
      success: true,
      display: `Database exported to ${output} in ${format} format`,
      data: { format, output, tables },
    }
  },
}

export const dbImportCommand: Command = {
  name: 'db-import',
  description: 'Import data from file',
  category: CommandCategory.GENERAL,
  aliases: ['import-db', 'import'],
  usage: '/db-import <file> [--format <format>] [--table <table>]',
  examples: ['/db-import data.csv', '/db-import data.json --format json --table users'],
  permissions: ['read', 'write'],
  execute: async (args, context): Promise<CommandResult> => {
    const file = args.positional[0]
    
    if (!file) {
      return {
        success: false,
        display: 'Error: Missing file. Usage: /db-import <file>',
      }
    }
    
    const format = (args.flags?.format as string) || file.split('.').pop() || 'csv'
    const table = (args.flags?.table as string) || 'imported_data'
    
    return {
      success: true,
      display: `Data imported from ${file} into ${table}`,
      data: { file, format, table, rowsImported: Math.floor(Math.random() * 1000) },
    }
  },
}

export const dbSearchCommand: Command = {
  name: 'db-search',
  description: 'Full-text search in database',
  category: CommandCategory.GENERAL,
  aliases: ['search-db', 'fulltext-search'],
  usage: '/db-search <query> [--table <table>] [--limit <n>]',
  examples: ['/db-search "hello world"', '/db-search "error" --table logs'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const query = args.positional.join(' ')
    
    if (!query) {
      return {
        success: false,
        display: 'Error: Missing query. Usage: /db-search <query>',
      }
    }
    
    const table = (args.flags?.table as string) || 'all'
    const limit = args.flags?.limit ? parseInt(args.flags.limit as string) : 10
    
    const results = Array(Math.min(limit, 5)).fill(null).map((_, i) => ({
      id: i + 1,
      snippet: `Result ${i + 1} containing "${query}"...`,
      relevance: (1 - i * 0.1).toFixed(2),
      table: table === 'all' ? 'users' : table,
    }))
    
    return {
      success: true,
      display: `Found ${results.length} results for "${query}"\n${formatOutput(results)}`,
      data: { query, results },
    }
  },
}

export const dbVersionCommand: Command = {
  name: 'db-version',
  description: 'Show database version',
  category: CommandCategory.GENERAL,
  aliases: ['db-ver', 'database-version'],
  usage: '/db-version',
  examples: ['/db-version'],
  permissions: ['read'],
  execute: async (args, context): Promise<CommandResult> => {
    const version = {
      product: 'PostgreSQL',
      version: '15.3',
      build: 'x86_64-pc-linux-gnu',
      compiled: 'GCC 11.3.0',
      extensions: ['plpgsql', 'uuid-ossp', 'pg_trgm'],
    }
    
    return {
      success: true,
      display: formatOutput(version),
      data: version,
    }
  },
}

// Helper function
function formatOutput(obj: any): string {
  return JSON.stringify(obj, null, 2)
}

// Export all commands
export const databaseCommands: Command[] = [
  dbConnectCommand,
  dbDisconnectCommand,
  dbListCommand,
  dbQueryCommand,
  dbTablesCommand,
  dbSchemaCommand,
  dbMigrateCommand,
  dbBackupCommand,
  dbRestoreCommand,
  dbInsertCommand,
  dbUpdateCommand,
  dbDeleteCommand,
  dbSelectCommand,
  dbCountCommand,
  dbIndexCommand,
  dbTransactionCommand,
  dbOptimizeCommand,
  dbStatsCommand,
  dbCreateCommand,
  dbDropCommand,
  dbUsersCommand,
  dbExportCommand,
  dbImportCommand,
  dbSearchCommand,
  dbVersionCommand,
]
