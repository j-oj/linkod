import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/supabaseClient";

const AcceptInvitation = () => {
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState(null);
  const [successMessage, setSuccessMessage] = useState(""); // New state for success message
  const navigate = useNavigate();
  const location = useLocation();

  // Parse email from invite link query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const email = params.get("email");
    if (email) {
      setInviteEmail(email);
    }
  }, [location]);

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      const { data: authResult, error: authError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
        });

      if (authError) throw new Error(authError.message);
    } catch (err) {
      alert("Google sign-in failed: " + err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkInviteAndRegister = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !inviteEmail) return;

      // Check invite table
      const { data: invite, error: inviteError } = await supabase
        .from("invite_admin")
        .select("*")
        .eq("admin_email", user.email)
        .eq("invite_status", "pending")
        .single();

      if (inviteError || !invite) {
        alert("No valid invite found for this email.");
        return;
      }

      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!existingRole) {
        // Insert role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: user.id,
          role: "admin",
        });

        if (roleError) {
          alert("Failed to assign role: " + roleError.message);
          return;
        }
      }

      // Insert into admin table
      const { error: adminError } = await supabase.from("admin").insert({
        admin_id: user.id, // User ID from Supabase Auth
        admin_email: user.email, // User's email from Supabase Auth
        admin_name: invite.admin_name, // Name from the invite
        org_id: invite.org_id, // Organization ID from the invite
        admin_created_at: new Date().toISOString(), // Current timestamp
      });

      if (adminError) {
        alert("Failed to register admin: " + adminError.message);
        return;
      }

      // Mark invite as complete
      await supabase
        .from("invite_admin")
        .update({ invite_status: "complete" })
        .eq("id", invite.id);

      // Set success message and redirect to login
      setSuccessMessage(
        `You are now an admin of ${invite.org_name}. You will be redirected to the login page shortly.`
      );
      setTimeout(() => {
        navigate("/login");
      }, 5000); // Redirect after 5 seconds
    };

    checkInviteAndRegister();
  }, [inviteEmail]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Accept Admin Invitation</h1>

      {inviteEmail ? (
        <>
          {successMessage ? (
            <p className="text-green-500 text-center">{successMessage}</p>
          ) : (
            <>
              <p className="mb-4 text-gray-600">
                Invited as: <strong>{inviteEmail}</strong>
              </p>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                {loading ? "Signing in..." : "Sign in with Google"}
              </button>
            </>
          )}
        </>
      ) : (
        <p className="text-red-500">Invalid or missing invitation link.</p>
      )}
    </div>
  );
};

export default AcceptInvitation;
