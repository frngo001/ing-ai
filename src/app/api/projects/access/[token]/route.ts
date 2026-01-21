import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSharedProjectData, joinProjectShare, getProjectShareByToken } from '@/lib/supabase/utils/project-shares'
import { devLog, devError } from '@/lib/utils/logger'
import { sendEmail } from '@/lib/resend'
import { CollaboratorJoinedEmail } from '@/components/emails/CollaboratorJoinedEmail'

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

    // Join the share - this creates a membership record so the user can access the project
    const joinResult = await joinProjectShare(token, supabase)

    if (!joinResult.success) {
      return NextResponse.json(
        { error: joinResult.error || 'Invalid or expired share link' },
        { status: 404 }
      )
    }

    const isOwner = joinResult.isOwner || false

    // Now fetch the full project data (user now has access via membership)
    const sharedData = await getSharedProjectData(token, supabase)

    if (!sharedData || !sharedData.project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    devLog('[API/PROJECT_ACCESS] Access granted for project:', sharedData.project.id, 'isOwner:', isOwner)

    // Send email to owner if a collaborator accesses the project via link (and not the owner themselves)
    const share = await getProjectShareByToken(token, supabase)

    if (!isOwner && sharedData?.project && share) {
      // Get owner email
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', share.owner_id)
        .single()

      const { data: collaboratorProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (ownerProfile?.email) {
        try {
          await sendEmail({
            to: ownerProfile.email,
            subject: 'New Collaborator Joined',
            react: CollaboratorJoinedEmail({
              ownerName: ownerProfile.full_name || 'Project Owner',
              collaboratorName: collaboratorProfile?.full_name || user.email || 'A user',
              projectName: sharedData.project.name,
              projectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/editor?doc=${sharedData.documents[0]?.id || ''}&shared=${token}`
            })
          })
          devLog('[API/PROJECT_ACCESS] Sent join notification email to owner')
        } catch (emailError) {
          devError('[API/PROJECT_ACCESS] Failed to send join notification email:', emailError)
        }
      }
    }

    return NextResponse.json({
      project: sharedData.project,
      documents: sharedData.documents,
      libraries: sharedData.libraries,
      mode: joinResult.mode,
      isOwner,
      expiresAt: sharedData.share?.expires_at || null,
    })
  } catch (error) {
    devError('[API/PROJECT_ACCESS] Error validating access:', error)
    return NextResponse.json(
      { error: 'Failed to validate access' },
      { status: 500 }
    )
  }
}
