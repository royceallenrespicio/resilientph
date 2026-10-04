import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function DELETE() {
  const supabase = await createClient()

  // Verify the user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized. You must be logged in to delete your account." },
      { status: 401 }
    )
  }

  // Use the admin client to bypass RLS and perform the hard delete
  const adminClient = createAdminClient()

  try {
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error("Error deleting user:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete account from identity provider." },
        { status: 500 }
      )
    }

    // Attempt to log out the user on the current session
    await supabase.auth.signOut()

    return NextResponse.json(
      { success: true, message: "Account deleted successfully." },
      { status: 200 }
    )
  } catch (err) {
    console.error("Account deletion exception:", err)
    return NextResponse.json(
      { error: "An unexpected error occurred during account deletion." },
      { status: 500 }
    )
  }
}
