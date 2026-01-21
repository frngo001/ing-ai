import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type UserOnboarding = Database['public']['Tables']['user_onboarding']['Row']
type UserOnboardingInsert = Database['public']['Tables']['user_onboarding']['Insert']
type UserOnboardingUpdate = Database['public']['Tables']['user_onboarding']['Update']

export async function getOnboardingStatus(userId: string): Promise<UserOnboarding | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching onboarding status:', error)
    return null
  }

  return data
}

export async function createOnboardingRecord(userId: string): Promise<UserOnboarding | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_onboarding')
    .insert({
      user_id: userId,
      current_step: 0,
      completed_steps: [],
      is_completed: false,
      is_skipped: false,
    } satisfies UserOnboardingInsert)
    .select()
    .single()

  if (error) {
    // If the record already exists, ignoring the error to allow fetching it
    if (error.code === '23505') {
      return null
    }
    console.error('Error creating onboarding record:', JSON.stringify(error))
    return null
  }

  return data
}

export async function updateOnboardingProgress(
  userId: string,
  updates: Omit<UserOnboardingUpdate, 'id' | 'user_id'>
): Promise<UserOnboarding | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_onboarding')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating onboarding progress:', error)
    return null
  }

  return data
}

export async function completeOnboardingStep(
  userId: string,
  stepIndex: number
): Promise<UserOnboarding | null> {
  const current = await getOnboardingStatus(userId)
  if (!current) return null

  const completedSteps = current.completed_steps.includes(stepIndex)
    ? current.completed_steps
    : [...current.completed_steps, stepIndex]

  const isCompleted = completedSteps.length >= 10

  return updateOnboardingProgress(userId, {
    completed_steps: completedSteps,
    current_step: stepIndex + 1,
    is_completed: isCompleted,
  })
}

export async function skipOnboarding(userId: string): Promise<UserOnboarding | null> {
  return updateOnboardingProgress(userId, {
    is_skipped: true,
  })
}

export async function resetOnboarding(userId: string): Promise<UserOnboarding | null> {
  return updateOnboardingProgress(userId, {
    current_step: 0,
    completed_steps: [],
    is_completed: false,
    is_skipped: false,
  })
}

export async function getOrCreateOnboarding(userId: string): Promise<UserOnboarding | null> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_or_create_user_onboarding', {
    p_user_id: userId,
  })

  if (error) {
    console.error('Error getting/creating onboarding:', error)
    return null
  }

  if (Array.isArray(data) && data.length > 0) {
    return data[0]
  }

  if (data && !Array.isArray(data)) {
    return data as UserOnboarding
  }

  return null
}
