import { MdAlternateEmail } from "react-icons/md";
import { FaFingerprint, FaRegEye, FaRegEyeSlash, FaHome } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import ActionButton from "../components/ui/actionbutton";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const togglePasswordView = () => setShowPassword(!showPassword);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      setLoading(false);
      navigate("/SAdminDashboard");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`, //updated path
      },
    });
  
    if (error) {
      setErrorMsg("Google Sign-In failed. Please try again.");
      setLoading(false);
    }
  };
  

  return (
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

          {errorMsg && (
            <p className="text-red-500 text-sm">{errorMsg}</p>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-t-transparent border-rose-800 rounded-full animate-spin" />
              <p className="text-sm text-gray-700">Authenticating...</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white p-2 rounded-xl mt-3 text-sm md:text-base transition-all duration-300 ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-rose-950 hover:bg-rose-800"
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
          className="w-full text-white flex items-center place-content-center p-2 bg-rose-950 rounded-xl mt-3 hover:bg-rose-800 text-sm md:text-base"
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
  );
};

export default Login;
