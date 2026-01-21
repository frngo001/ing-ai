import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createProjectShare,
  getProjectShares,
  revokeProjectShare,
  deleteProjectShare,
} from '@/lib/supabase/utils/project-shares'
import { devLog, devError } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, mode, expiresAt, email } = body

    if (!projectId || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, mode' },
        { status: 400 }
      )
    }

    if (!['view', 'edit', 'suggest'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be one of: view, edit, suggest' },
        { status: 400 }
      )
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    const share = await createProjectShare(
      projectId,
      user.id,
      mode,
      expiresAt ? new Date(expiresAt) : undefined,
      supabase
    )

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shared/${share.share_token}`

    if (email) {
      try {
        const { sendEmail } = await import('@/lib/resend')
        const { ProjectInvitationEmail } = await import('@/components/emails/ProjectInvitationEmail')

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        await sendEmail({
          to: email,
          subject: `Invitation to collaborate on ${project?.name || 'a project'}`,
          react: ProjectInvitationEmail({
            inviterName: profile?.full_name || 'A user',
            projectName: project?.name || 'Untitled Project',
            actionUrl: shareUrl
          })
        })
      } catch (emailError) {
        devError('[API/PROJECT_SHARE] Failed to send invitation email:', emailError)
        // We don't fail the request if email fails, but we log it
      }
    }

    devLog('[API/PROJECT_SHARE] Share created:', share.id)

    return NextResponse.json({
      share,
      shareUrl,
    })
  } catch (error) {
    devError('[API/PROJECT_SHARE] Error creating share:', error)
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required parameter: projectId' },
        { status: 400 }
      )
    }

    const shares = await getProjectShares(projectId, user.id, supabase)

    return NextResponse.json({ shares })
  } catch (error) {
    devError('[API/PROJECT_SHARE] Error getting shares:', error)
    return NextResponse.json(
      { error: 'Failed to get shares' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const shareId = searchParams.get('shareId')
    const permanent = searchParams.get('permanent') === 'true'

    if (!shareId) {
      return NextResponse.json(
        { error: 'Missing required parameter: shareId' },
        { status: 400 }
      )
    }

    if (permanent) {
      await deleteProjectShare(shareId, user.id, supabase)
    } else {
      await revokeProjectShare(shareId, user.id, supabase)
    }

    devLog('[API/PROJECT_SHARE] Share revoked/deleted:', shareId)

    return NextResponse.json({ success: true })
  } catch (error) {
    devError('[API/PROJECT_SHARE] Error revoking share:', error)
    return NextResponse.json(
      { error: 'Failed to revoke share' },
      { status: 500 }
    )
  }
}
