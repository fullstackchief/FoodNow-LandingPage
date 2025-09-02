require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (color, message) => console.log(`${color}${message}${colors.reset}`);
const logHeader = (message) => log(colors.bright + colors.cyan, `\n=== ${message} ===`);
const logSuccess = (message) => log(colors.green, `✅ ${message}`);
const logWarning = (message) => log(colors.yellow, `⚠️  ${message}`);
const logError = (message) => log(colors.red, `❌ ${message}`);
const logInfo = (message) => log(colors.blue, `ℹ️  ${message}`);

class SupabaseManager {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    logInfo(`Supabase URL: ${this.supabaseUrl}`);
    logInfo(`Has Service Key: ${!!this.supabaseServiceKey}`);
    logInfo(`Has Anon Key: ${!!this.supabaseAnonKey}`);
    
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      logError('Missing Supabase credentials');
      process.exit(1);
    }

    // Create both admin and client connections
    this.supabaseAdmin = createClient(this.supabaseUrl, this.supabaseServiceKey);
    this.supabaseClient = createClient(this.supabaseUrl, this.supabaseAnonKey);
  }

  async testConnection() {
    logHeader('CONNECTION TESTS');
    
    const tests = [
      {
        name: 'Basic API Health Check',
        test: () => this.testApiHealth()
      },
      {
        name: 'Service Role Connection',
        test: () => this.testServiceConnection()
      },
      {
        name: 'Anonymous Connection', 
        test: () => this.testAnonConnection()
      },
      {
        name: 'Database Query Test',
        test: () => this.testDatabaseQuery()
      }
    ];

    const results = {};
    
    for (const { name, test } of tests) {
      try {
        logInfo(`Testing: ${name}...`);
        const result = await test();
        results[name] = { success: true, data: result };
        logSuccess(`${name}: OK`);
      } catch (error) {
        results[name] = { success: false, error: error.message };
        logError(`${name}: ${error.message}`);
      }
    }
    
    return results;
  }

  async testApiHealth() {
    // Try direct HTTP request first
    const response = await fetch(`${this.supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': this.supabaseServiceKey,
        'Authorization': `Bearer ${this.supabaseServiceKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return { status: response.status, ok: response.ok };
  }

  async testServiceConnection() {
    const { data, error } = await this.supabaseAdmin.from('pg_tables').select('tablename').limit(1);
    
    if (error) {
      throw new Error(`Service connection failed: ${error.message}`);
    }
    
    return { tablesAccessible: true, sampleTable: data?.[0]?.tablename };
  }

  async testAnonConnection() {
    const { data, error } = await this.supabaseClient.from('users').select('count').limit(1);
    
    if (error && !error.message.includes('permission denied')) {
      throw new Error(`Anon connection failed: ${error.message}`);
    }
    
    return { connectionOk: true, hasPermissionSystem: error?.message.includes('permission denied') };
  }

  async testDatabaseQuery() {
    // Try to query system tables to see what exists
    const { data, error } = await this.supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(10);
      
    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
    
    return { publicTables: data?.map(t => t.table_name) || [] };
  }

  async createTable(tableName, columns) {
    logHeader(`CREATING TABLE: ${tableName}`);
    
    try {
      const columnDefs = columns.map(col => {
        let def = `${col.name} ${col.type}`;
        if (col.primaryKey) def += ' PRIMARY KEY';
        if (col.notNull) def += ' NOT NULL';
        if (col.unique) def += ' UNIQUE';
        if (col.default) def += ` DEFAULT ${col.default}`;
        return def;
      }).join(', ');

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          ${columnDefs}
        );
      `;

      const { error } = await this.supabaseAdmin.rpc('exec_sql', { 
        sql: createTableSQL 
      });

      if (error) {
        throw error;
      }

      logSuccess(`Table ${tableName} created successfully`);
      return { success: true };
      
    } catch (error) {
      logError(`Failed to create table ${tableName}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async enableRLS(tableName) {
    logHeader(`ENABLING RLS FOR: ${tableName}`);
    
    try {
      const { error } = await this.supabaseAdmin.rpc('exec_sql', {
        sql: `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`
      });

      if (error) {
        throw error;
      }

      logSuccess(`RLS enabled for table ${tableName}`);
      return { success: true };
      
    } catch (error) {
      logError(`Failed to enable RLS for ${tableName}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async createRLSPolicy(tableName, policyName, operation, condition) {
    logHeader(`CREATING RLS POLICY: ${policyName} for ${tableName}`);
    
    try {
      const policySQL = `
        CREATE POLICY "${policyName}" ON ${tableName}
        FOR ${operation.toUpperCase()}
        ${condition};
      `;

      const { error } = await this.supabaseAdmin.rpc('exec_sql', {
        sql: policySQL
      });

      if (error) {
        throw error;
      }

      logSuccess(`RLS policy "${policyName}" created for ${tableName}`);
      return { success: true };
      
    } catch (error) {
      logError(`Failed to create RLS policy "${policyName}": ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async runMigration(migrationFile) {
    logHeader(`RUNNING MIGRATION: ${migrationFile}`);
    
    try {
      const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);
      
      if (!fs.existsSync(migrationPath)) {
        throw new Error(`Migration file not found: ${migrationPath}`);
      }

      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      // Split SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      
      logInfo(`Executing ${statements.length} SQL statements...`);
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (stmt) {
          try {
            const { error } = await this.supabaseAdmin.rpc('exec_sql', { sql: stmt });
            if (error) {
              logWarning(`Statement ${i + 1} failed: ${error.message}`);
              logInfo(`Failed SQL: ${stmt.substring(0, 100)}...`);
            } else {
              logInfo(`✓ Statement ${i + 1}/${statements.length} executed`);
            }
          } catch (stmtError) {
            logWarning(`Statement ${i + 1} error: ${stmtError.message}`);
          }
        }
      }

      logSuccess(`Migration ${migrationFile} completed`);
      return { success: true };
      
    } catch (error) {
      logError(`Migration failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async inspectDatabase() {
    logHeader('DATABASE INSPECTION');
    
    try {
      // Get all tables
      const { data: tables, error: tablesError } = await this.supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (tablesError) {
        throw tablesError;
      }

      const inspection = {
        tableCount: tables?.length || 0,
        tables: {}
      };

      logInfo(`Found ${inspection.tableCount} tables`);

      // Inspect each table
      for (const table of tables || []) {
        const tableName = table.table_name;
        
        try {
          // Get column info
          const { data: columns, error: colError } = await this.supabaseAdmin
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_schema', 'public')
            .eq('table_name', tableName);

          // Get record count
          const { count, error: countError } = await this.supabaseAdmin
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          inspection.tables[tableName] = {
            columns: columns || [],
            recordCount: countError ? 'error' : count,
            hasData: count > 0
          };

          const status = countError ? '❌' : count > 0 ? '✅' : '⚠️';
          logInfo(`${status} ${tableName}: ${columns?.length || 0} columns, ${countError ? 'error' : count} records`);

        } catch (tableError) {
          inspection.tables[tableName] = { error: tableError.message };
          logWarning(`Error inspecting ${tableName}: ${tableError.message}`);
        }
      }

      return inspection;
      
    } catch (error) {
      logError(`Database inspection failed: ${error.message}`);
      return { error: error.message };
    }
  }
}

// Command line interface
async function main() {
  const manager = new SupabaseManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      await manager.testConnection();
      break;
      
    case 'inspect':
      await manager.inspectDatabase();
      break;
      
    case 'migrate':
      const migrationFile = process.argv[3] || '001_complete_schema.sql';
      await manager.runMigration(migrationFile);
      break;
      
    case 'create-table':
      // Example: node supabase-manager.js create-table users '[{"name":"id","type":"uuid","primaryKey":true}]'
      const tableName = process.argv[3];
      const columns = JSON.parse(process.argv[4] || '[]');
      await manager.createTable(tableName, columns);
      break;
      
    case 'enable-rls':
      await manager.enableRLS(process.argv[3]);
      break;
      
    case 'create-policy':
      // Example: node supabase-manager.js create-policy users "user_select" select "USING (auth.uid() = id)"
      await manager.createRLSPolicy(process.argv[3], process.argv[4], process.argv[5], process.argv[6]);
      break;
      
    default:
      logInfo('Usage:');
      logInfo('  node supabase-manager.js test           - Test all connections');
      logInfo('  node supabase-manager.js inspect        - Inspect database schema');
      logInfo('  node supabase-manager.js migrate [file] - Run migration file');
      logInfo('  node supabase-manager.js create-table <name> <columns-json>');
      logInfo('  node supabase-manager.js enable-rls <table>');
      logInfo('  node supabase-manager.js create-policy <table> <name> <operation> <condition>');
  }
}

if (require.main === module) {
  main().catch(error => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = SupabaseManager;