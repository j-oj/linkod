import { MdAlternateEmail } from "react-icons/md";
import { FaFingerprint, FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import ActionButton from "../components/ui/actionbutton";
import Navbar from "../components/navbar";
import { useLoading } from "../context/LoadingContext";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const { loading, setLoading } = useLoading();
  const navigate = useNavigate();
  const togglePasswordView = () => setShowPassword(!showPassword);

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      console.log("Checking session...");
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log("Existing session found:", data.session);
        // User is already logged in, redirect based on role
        redirectBasedOnRole(data.session.user.id);
      }
    };

    checkSession();
  }, [navigate]);

  // Function to handle redirection based on user role
  const redirectBasedOnRole = async (userId) => {
    try {
      console.log("Redirecting based on role for user:", userId);

      const { data: userData, error: userError } = await supabase
        .from("user_roles")
        .select("role, organization_slug")
        .eq("user_id", userId)
        .single();

      if (userError) {
        console.error("Error fetching user role:", userError.message);
        // Default to homepage if role can't be determined
        console.log("Redirecting to homepage due to error");
        navigate("/", { replace: true });
        return;
      }

      console.log("User role data:", userData);
      localStorage.setItem("userRole", userData.role || "user");

      // Default to homepage for all users
      console.log("Redirecting to homepage");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Redirection error:", error);
      // Default to homepage on any error
      console.log("Redirecting to homepage due to exception");
      navigate("/", { replace: true });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      console.log("Attempting login with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login Error:", error);
        setErrorMsg("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      console.log("Login successful:", data.user.id);

      // Force navigation to homepage immediately after successful login
      console.log("Redirecting to homepage after login");
      navigate("/", { replace: true });
      setLoading(false);
    } catch (error) {
      console.error("Unexpected error:", error);
      setErrorMsg("Login failed. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      console.log("Attempting Google login");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`, // Redirect directly to homepage
        },
      });

      if (error) {
        console.error("Google Login Error:", error);
        setErrorMsg("Google Sign-In failed. Please try again.");
      }
    } catch (error) {
      console.error("Unexpected Google login error:", error);
      setErrorMsg("Google Sign-In failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar userRole={localStorage.getItem("userRole") || "guest"} />
      <div className="w-full h-screen flex items-center justify-center">
        <div className="w-[90%] max-w-sm md:max-w-md lg:max-w-md p-5 bg-gray-100 flex-col flex items-center gap-3 rounded-xl shadow-slate-400 shadow-md">
          <img src="/templogo.png" alt="logo" className="w-12 md:w-14" />
          <h1 className="text-rose-950 text-lg md:text-xl font-semibold">
            Welcome!
          </h1>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-3">
            <div className="w-full flex flex-col gap-3">
              <div className="w-full flex items-center gap-2 bg-neutral-200 p-2 rounded-xl">
                <MdAlternateEmail />
                <input
                  type="email"
                  placeholder="Email address"
                  className="bg-transparent border-0 w-full outline-none text-sm md:text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="w-full flex items-center gap-2 bg-neutral-200 p-2 rounded-xl relative">
                <FaFingerprint />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="bg-transparent border-0 w-full outline-none text-sm md:text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

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
            className="w-full text-white flex items-center place-content-center p-2 bg-maroon rounded-xl mt-3 hover:bg-red-800 text-sm md:text-base"
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
