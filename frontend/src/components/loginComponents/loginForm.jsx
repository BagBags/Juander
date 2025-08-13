import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function LoginForm({ toggleForm }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(
        // "http://localhost:5000/api/auth/google-login",
        "https://juander.onrender.com/api/auth/google-login",
        {
          token: credentialResponse.credential,
        }
      );

      const { user, token } = res.data;
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      navigate(user.role === "admin" ? "/AdminHome" : "/Homepage");
    } catch (err) {
      console.error("Google login failed", err);
      alert("Google login failed.");
    }
  };

  const handleEmailLogin = async () => {
    try {
      const res = await axios.post(
        // "http://localhost:5000/api/auth/login",
        "https://juander.onrender.com/api/auth/login",
        {
          email,
          password,
        }
      );

      const { user, token } = res.data;
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      navigate(user.role === "admin" ? "/AdminHome" : "/Homepage");
    } catch (err) {
      console.error("Email login failed", err);
      alert("Login failed. Please check your credentials.");
    }
  };

  const handleForgotRequest = async () => {
    if (!email) {
      alert("Please enter your email first.");
      return;
    }

    try {
      console.log("Sending OTP to:", email); // ✅ for debug
      await axios.post(
        // "http://localhost:5000/api/auth/send-otp",
        "https://juander.onrender.com/api/auth/send-otp",
        { email }
      );
      alert("OTP sent to your email.");
      setStep(2);
    } catch (err) {
      console.error("Error sending OTP:", err.response || err);
      alert(err.response?.data?.message || "Failed to send OTP.");
    }
  };

  const handleResetPassword = async () => {
    try {
      await axios.post(
        // "http://localhost:5000/api/auth/reset-password",
        "https://juander.onrender.com/api/auth/reset-password",
        {
          email,
          otp,
          newPassword,
        }
      );
      alert("Password reset successful. Please log in.");
      setShowForgot(false);
      setStep(1);
      setPassword("");
    } catch (err) {
      alert(err.response?.data?.message || "Password reset failed.");
    }
  };

  return (
    <div className="bg-[#f04e37] p-6 rounded-2xl shadow-md space-y-4 text-white">
      <h2 className="text-2xl font-bold text-center">Login</h2>

      {!showForgot ? (
        <>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 rounded bg-white text-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 rounded bg-white text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleEmailLogin}
            className="w-full bg-white text-black px-4 py-2 rounded-md shadow-md 
              hover:bg-[#ffe2de] transition-colors duration-200 ease-in-out 
              active:scale-95"
          >
            Login
          </button>

          <div className="text-center">
            <button
              className="text-sm underline"
              onClick={() => {
                setShowForgot(true);
                setStep(1);
              }}
            >
              Forgot Password?
            </button>
          </div>

          <div className="text-center text-white font-semibold">or</div>

          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={() => console.log("Google login failed")}
          />

          <button
            type="button"
            className="w-full bg-white text-black px-4 py-2 rounded-md shadow-md 
              hover:bg-[#ffe2de] transition-colors duration-200 ease-in-out 
              active:scale-95"
          >
            Continue as Guest
          </button>

          <p className="text-sm text-center mt-2">
            New user?{" "}
            <span
              className="underline font-bold cursor-pointer"
              onClick={toggleForm}
            >
              Create an account here
            </span>
          </p>
        </>
      ) : (
        <>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full p-2 rounded bg-white text-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={step !== 1}
          />

          {step === 1 && (
            <>
              <button
                onClick={handleForgotRequest}
                className="w-full bg-white text-black px-4 py-2 rounded-md shadow-md 
                  hover:bg-[#ffe2de] transition-colors duration-200 ease-in-out 
                  active:scale-95 mt-2"
              >
                Send OTP
              </button>
              <button
                onClick={() => {
                  setShowForgot(false);
                  setStep(1);
                  setEmail("");
                  setOtp("");
                  setNewPassword("");
                }}
                className="w-full bg-white text-black px-4 py-2 rounded-md shadow-md 
                  hover:bg-[#ffe2de] transition-colors duration-200 ease-in-out 
                  active:scale-95 mt-2"
              >
                Back to Login
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                className="w-full p-2 rounded bg-white text-black"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <input
                type="password"
                placeholder="New Password"
                className="w-full p-2 rounded bg-white text-black"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                onClick={handleResetPassword}
                className="w-full bg-white text-black px-4 py-2 rounded-md shadow-md 
                  hover:bg-[#ffe2de] transition-colors duration-200 ease-in-out 
                  active:scale-95 mt-2"
              >
                Reset Password
              </button>
              <button
                onClick={() => {
                  setShowForgot(false);
                  setStep(1);
                  setEmail("");
                  setOtp("");
                  setNewPassword("");
                }}
                className="w-full bg-white text-black px-4 py-2 rounded-md shadow-md 
              hover:bg-[#ffe2de] transition-colors duration-200 ease-in-out 
              active:scale-95"
              >
                Back to Login
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
