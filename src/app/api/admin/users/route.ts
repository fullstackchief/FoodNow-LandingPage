import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Server-side only - service role key
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET - List all admin users (with permissions check)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestorId = searchParams.get('requestor')

    if (!requestorId) {
      return NextResponse.json(
        { success: false, error: 'Requestor ID required' },
        { status: 400 }
      )
    }

    // Check if requestor has permission to view admins
    const { data: requestor, error: requestorError } = await supabaseService
      .from('admin_users')
      .select('role, permissions')
      .eq('id', requestorId)
      .eq('is_active', true)
      .single()

    if (requestorError || !requestor) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Only super_admin can view all admins
    if (requestor.role !== 'super_admin' && !requestor.permissions?.admins?.view) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get all admin users (exclude password_hash)
    const { data: admins, error } = await supabaseService
      .from('admin_users')
      .select('id, email, first_name, last_name, role, permissions, is_active, last_login, created_at, created_by')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: admins
    })

  } catch (error) {
    console.error('Get admin users error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new admin user (God Mode only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, 
      first_name, 
      last_name, 
      password, 
      role, 
      permissions, 
      created_by 
    } = body

    if (!email || !password || !first_name || !last_name || !role || !created_by) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Verify creator has permission to create admins
    const { data: creator, error: creatorError } = await supabaseService
      .from('admin_users')
      .select('role, permissions')
      .eq('id', created_by)
      .eq('is_active', true)
      .single()

    if (creatorError || !creator) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check permissions based on role hierarchy
    if (creator.role === 'super_admin') {
      // Super admin can create anyone
    } else if (creator.role === 'admin' && creator.permissions?.admins?.create) {
      // Regular admin can only create lower level roles
      if (!['moderator', 'staff'].includes(role)) {
        return NextResponse.json(
          { success: false, error: 'Cannot create admin at this level' },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Check if email already exists
    const { data: existing } = await supabaseService
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin user
    const { data: newAdmin, error } = await supabaseService
      .from('admin_users')
      .insert({
        email,
        first_name,
        last_name,
        role,
        password_hash: hashedPassword,
        permissions: permissions || {},
        created_by,
        is_active: true,
        password_changed_at: new Date().toISOString(),
        session_timeout: 480, // 8 hours
        must_change_password: false,
        failed_login_attempts: 0
      })
      .select('id, email, first_name, last_name, role, permissions, is_active, created_at')
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newAdmin,
      message: 'Admin user created successfully'
    })

  } catch (error) {
    console.error('Create admin user error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}