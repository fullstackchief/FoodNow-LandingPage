import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

/**
 * POST /api/supabase/execute-migration
 * Executes SQL migration files via Supabase service role
 */
export async function POST(request: NextRequest) {
  try {
    // Get migration file to execute
    const body = await request.json()
    const { migrationFile, adminKey } = body

    // Security: Require admin key (simple protection)
    if (adminKey !== 'foodnow-migration-key-2025') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized migration access' },
        { status: 401 }
      )
    }

    // Validate migration file
    const allowedMigrations = [
      '002_missing_tables.sql',
      '003_selective_tables.sql', 
      '004_complete_rls_security.sql'
    ]

    if (!allowedMigrations.includes(migrationFile)) {
      return NextResponse.json(
        { success: false, error: 'Invalid migration file' },
        { status: 400 }
      )
    }

    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile)
    
    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json(
        { success: false, error: `Migration file not found: ${migrationFile}` },
        { status: 404 }
      )
    }

    const sqlContent = fs.readFileSync(migrationPath, 'utf8')
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`Executing ${statements.length} SQL statements from ${migrationFile}`)

    const results = []
    let successCount = 0
    let errorCount = 0

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      try {
        // Use raw SQL execution via Supabase
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_text: statement 
        })

        if (error) {
          console.error(`Statement ${i + 1} failed:`, error.message)
          results.push({
            statement_number: i + 1,
            success: false,
            error: error.message,
            sql_preview: statement.substring(0, 100) + '...'
          })
          errorCount++
        } else {
          console.log(`Statement ${i + 1} executed successfully`)
          results.push({
            statement_number: i + 1,
            success: true,
            sql_preview: statement.substring(0, 100) + '...'
          })
          successCount++
        }
      } catch (execError) {
        console.error(`Statement ${i + 1} execution error:`, execError)
        results.push({
          statement_number: i + 1,
          success: false,
          error: (execError as Error).message,
          sql_preview: statement.substring(0, 100) + '...'
        })
        errorCount++
      }
    }

    return NextResponse.json({
      success: errorCount === 0,
      migration_file: migrationFile,
      total_statements: statements.length,
      successful_statements: successCount,
      failed_statements: errorCount,
      execution_results: results,
      message: errorCount === 0 
        ? `Migration ${migrationFile} executed successfully`
        : `Migration ${migrationFile} completed with ${errorCount} errors`
    })

  } catch (error) {
    console.error('Migration execution error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migration execution failed',
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/supabase/execute-migration
 * Lists available migration files
 */
export async function GET() {
  try {
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
    
    if (!fs.existsSync(migrationsDir)) {
      return NextResponse.json({
        success: false,
        error: 'Migrations directory not found'
      })
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: `supabase/migrations/${file}`,
        size: fs.statSync(path.join(migrationsDir, file)).size
      }))

    return NextResponse.json({
      success: true,
      available_migrations: files,
      count: files.length
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to list migrations',
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
}