import { MdAlternateEmail } from "react-icons/md";
import { FaFingerprint, FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import ActionButton from "@/components/ui/actionbutton";
import Navbar from "@/components/navbar";
import { useLoading } from "@/context/LoadingContext";
import Alert from "@/components/ui/Alert";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "error",
  });
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { loading, setLoading } = useLoading();
  const navigate = useNavigate();
  const togglePasswordView = () => setShowPassword(!showPassword);

  // Auto-dismiss alert
  useEffect(() => {
    if (!alert.show) return;
    const timer = setTimeout(() => setAlert({ ...alert, show: false }), 4000);
    return () => clearTimeout(timer);
  }, [alert]);

  useEffect(() => {
    const checkSessionAndLogAdmin = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (session) {
        const userId = session.user.id;

        // Check if this user is an admin
        const { data: adminData, error: adminError } = await supabase
          .from("admin")
          .select("admin_id")
          .eq("admin_id", userId)
          .single();

        if (!adminError && adminData) {
          // Log last sign-in (optional)
          const { data: userData, error: userError } = await supabase
            .from("auth.users")
            .select("last_sign_in_at")
            .eq("id", userId)
            .single();

          if (userError) {
            console.error(
              "Failed to fetch user last sign-in:",
              userError.message
            );
          } else {
            console.log("Last sign-in:", userData.last_sign_in_at);
          }

          // Insert login record without checking time diff
          const { error: insertError } = await supabase
            .from("admin_login_record")
            .insert({
              admin_id: userId,
              login_time: new Date(),
            });

          if (insertError) {
            console.error(
              "Failed to insert admin login record:",
              insertError.message
            );
          } else {
            console.log("Admin login record inserted.");
          }
        }

        // Redirect after role check
        redirectBasedOnRole(userId);
      }
    };

    checkSessionAndLogAdmin();
  }, [navigate]);

  const redirectBasedOnRole = async (userId) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("user_roles")
        .select("role, organization_slug")
        .eq("user_id", userId)
        .single();

      console.log("user_roles fetch result:", { userData, userError });

      if (userError || !userData?.role) {
        setAlert({
          show: true,
          message: "Your account does not have access. Contact admin.",
          type: "error",
        });
        return;
      }

      localStorage.setItem("userRole", userData.role || "user");

      // Show success message before redirecting
      setAlert({
        show: true,
        message: "Login successful!",
        type: "success",
      });

      // Delay navigation slightly to show success message
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1000);
    } catch (err) {
      console.error("redirectBasedOnRole failed:", err);
      setAlert({
        show: true,
        message: "Login failed. Please try again.",
        type: "error",
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert({ show: false, message: "", type: "error" });
    setEmailError("");
    setPasswordError("");

    let hasError = false;
    if (!email.trim()) {
      setEmailError("Email is required.");
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError("Password is required.");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAlert({
          show: true,
          message: "Invalid email or password. Please try again.",
          type: "error",
        });
        setLoading(false);
        return;
      }

      const userId = data.user.id;
      redirectBasedOnRole(userId);
    } catch {
      setAlert({
        show: true,
        message: "Login failed. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setAlert({
          show: true,
          message: "Google Sign-In failed. Please try again.",
          type: "error",
        });
      }
    } catch {
      setAlert({
        show: true,
        message: "Google Sign-In failed. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar userRole={localStorage.getItem("userRole") || "guest"} />
      {alert.show && (
        <Alert
          type={alert.type}
          message={alert.message}
          isOpen={alert.show}
          onClose={() => setAlert({ ...alert, show: false })}
        />
      )}

      <div className="w-full h-screen flex items-center justify-center">
        <div className="w-[90%] max-w-sm md:max-w-md p-5 bg-gray-100 dark:bg-gray-900 flex-col flex items-center gap-3 rounded-xl shadow-md transition-all duration-300">
          <img src="/templogo.png" alt="logo" className="w-25 md:w-14" />
          <h1 className="text-rose-950 text-lg md:text-xl font-semibold dark:text-white">
            Welcome!
          </h1>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-3">
            <div className="w-full flex flex-col gap-2">
              <div
                className={`w-full flex items-center gap-2 bg-neutral-200 p-2 rounded-xl dark:bg-gray-800 relative transition-all duration-300 ${
                  emailError ? "border border-red-500" : ""
                }`}
              >
                <MdAlternateEmail />
                <input
                  type="email"
                  placeholder="Email address"
                  className="bg-transparent border-0 w-full outline-none text-sm md:text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby="emailError"
                />
              </div>
              {emailError && (
                <p id="emailError" className="text-red-500 text-xs ml-2">
                  {emailError}
                </p>
              )}

              <div
                className={`w-full flex items-center gap-2 bg-neutral-200 p-2 rounded-xl dark:bg-gray-800 relative transition-all duration-300 ${
                  passwordError ? "border border-red-500" : ""
                }`}
              >
                <FaFingerprint />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="bg-transparent border-0 w-full outline-none text-sm md:text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby="passwordError"
                />
                {showPassword ? (
                  <FaRegEye
                    className="absolute right-5 cursor-pointer"
                    onClick={togglePasswordView}
                  />
                ) : (
                  <FaRegEyeSlash
                    className="absolute right-5 cursor-pointer"
                    onClick={togglePasswordView}
                  />
                )}
              </div>
              {passwordError && (
                <p id="passwordError" className="text-red-500 text-xs ml-2">
                  {passwordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white p-2 rounded-xl mt-3 text-sm md:text-base transition-all duration-300 ${
                loading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-maroon hover:bg-red-800"
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="relative w-full flex items-center justify-center py-3">
            <div className="w-2/5 h-[2px] bg-gray-800"></div>
            <h3 className="font-lora text-xs md:text-sm px-4 text-gray-500">
              Or
            </h3>
            <div className="w-2/5 h-[2px] bg-gray-800"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full text-white flex items-center justify-center p-2 bg-maroon rounded-xl mt-3 hover:bg-red-800 text-sm md:text-base"
          >
            <img
              src="/google-icon.png"
              alt="google-icon"
              className="w-6 md:w-8 mr-2"
            />
            Login with Google
          </button>
        </div>

        <ActionButton type="home" />
      </div>
    </>
  );
};

export default Login;
