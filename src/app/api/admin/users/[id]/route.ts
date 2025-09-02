import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Admin ID required' },
        { status: 400 }
      )
    }

    // Get admin user by ID
    const { data: admin, error } = await supabaseService
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !admin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Don't send password_hash to client
    const { password_hash, ...adminData } = admin

    return NextResponse.json({
      success: true,
      data: adminData
    })

  } catch (error) {
    console.error('Get admin by ID error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}