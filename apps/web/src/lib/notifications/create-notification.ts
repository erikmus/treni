import type { SupabaseClient } from "@supabase/supabase-js"
import type { NotificationType, Json } from "@/types/database"

interface CreateNotificationParams {
  supabase: SupabaseClient
  userId: string
  type: NotificationType
  title: string
  message?: string
  data?: Record<string, unknown>
}

export async function createNotification({
  supabase,
  userId,
  type,
  title,
  message,
  data = {},
}: CreateNotificationParams) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message: message || null,
    data: data as Json,
  })

  if (error) {
    console.error("Error creating notification:", error)
  }

  return { error }
}

