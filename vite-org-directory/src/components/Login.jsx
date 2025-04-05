import { MdAlternateEmail } from "react-icons/md";
import { FaFingerprint } from "react-icons/fa";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useState } from "react";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordView = () => setShowPassword(!showPassword);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="w-[90%] max-w-sm md:max-w-md lg:max-w-md p-5 bg-gray-300 flex-col flex items-center gap-3 rounded-xl shadow-slate-500 shadow-lg">
        <img src="/templogo.png" alt="logo" className="w-12 md:w-14" />
        <h1 className="text-rose-950 text-lg md:text-xl font-semibold">
          Welcome!
        </h1>

        <div className="w-full flex flex-col gap-3">
          <div className="w-full flex items-center gap-2 bg-neutral-200 p-2 rounded-xl">
            <MdAlternateEmail />
            <input
              type="email"
              placeholder="Email address"
              className="bg-transparent border-0 w-full outline-none text-sm md:text-base"
            />
          </div>

          <div className="w-full flex items-center gap-2 bg-neutral-200 p-2 rounded-xl relative">
            <FaFingerprint />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="bg-transparent border-0 w-full outline-none text-sm md:text-base"
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

        <button className="w-full text-white p-2 bg-rose-950 rounded-xl mt-3 hover:bg-rose-800 text-sm md:text-base">
          Login
        </button>

        <div className="relative w-full flex items-center justify-center py-3">
          <div className="w-2/5 h-[2px] bg-gray-800"></div>
          <h3 className="font-lora text-xs md:text-sm px-4 text-gray-500">
            Or
          </h3>
          <div className="w-2/5 h-[2px] bg-gray-800"></div>
        </div>
        <button className="w-full text-white flex items-center place-content-center p-2 bg-rose-950 rounded-xl mt-3 hover:bg-rose-800 text-sm md:text-base">
          <img
            src="/google-icon.png"
            alt="google-icon"
            className="w-6 md:w-8"
          />
          Login with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
