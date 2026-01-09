import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSharedProjectData, validateShareAccess } from '@/lib/supabase/utils/project-shares'
import { devLog, devError } from '@/lib/utils/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token parameter' },
        { status: 400 }
      )
    }

    const accessResult = await validateShareAccess(token, supabase)

    if (!accessResult.isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired share link' },
        { status: 404 }
      )
    }

    const isOwner = user.id === accessResult.ownerId

    const sharedData = await getSharedProjectData(token, supabase)

    if (!sharedData || !sharedData.project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    devLog('[API/PROJECT_ACCESS] Access granted for project:', sharedData.project.id)

    return NextResponse.json({
      project: sharedData.project,
      documents: sharedData.documents,
      libraries: sharedData.libraries,
      mode: accessResult.mode,
      isOwner,
      expiresAt: accessResult.expiresAt?.toISOString() || null,
    })
  } catch (error) {
    devError('[API/PROJECT_ACCESS] Error validating access:', error)
    return NextResponse.json(
      { error: 'Failed to validate access' },
      { status: 500 }
    )
  }
}
