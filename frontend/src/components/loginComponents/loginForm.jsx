import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm({ toggleForm }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // OTP Input handling
  const otpLength = 6;
  const inputRefs = useRef([]);

  // OTP countdown timer (10 minutes = 600 seconds)
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${mins}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleOtpChange = (value, index) => {
    if (/^\d$/.test(value)) {
      const newOtp = otp.split("");
      newOtp[index] = value;
      setOtp(newOtp.join(""));
      if (index < otpLength - 1) {
        inputRefs.current[index + 1].focus();
      }
    } else if (value === "") {
      const newOtp = otp.split("");
      newOtp[index] = "";
      setOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const pasteData = e.clipboardData.getData("text").trim();
    if (/^\d+$/.test(pasteData)) {
      const digits = pasteData.split("").slice(0, otpLength);
      setOtp(digits.join(""));
      digits.forEach((d, i) => {
        if (inputRefs.current[i]) {
          inputRefs.current[i].value = d;
        }
      });
      if (digits.length < otpLength) {
        inputRefs.current[digits.length]?.focus();
      }
    }
  };

  // ---------- Login Handlers ----------
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setError("");
    setSuccess("");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/google-login",
        {
          token: credentialResponse.credential,
        }
      );

      const { user, token } = res.data;
      localStorage.removeItem("guest"); // clear guest
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      navigate(user.role === "admin" ? "/AdminHome" : "/Homepage");
    } catch (err) {
      setError("Google login failed. Please try again.");
    }
  };

  const handleEmailLogin = async () => {
    setError("");
    setSuccess("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      const { user, token } = res.data;
      localStorage.removeItem("guest");
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      navigate(user.role === "admin" ? "/AdminHome" : "/Homepage");
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    }
  };

  const handleForgotRequest = async () => {
    setError("");
    setSuccess("");
    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/auth/send-otp", { email });
      setSuccess("OTP sent to your email.");
      setStep(2);
      setTimeLeft(600); // start 10-minute timer
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setSuccess("");
    if (!otp || otp.length < otpLength) {
      setError("Please enter the full OTP.");
      return;
    }
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      setSuccess("Password reset successful. Please log in.");
      setShowForgot(false);
      setStep(1);
      setPassword("");
      setOtp("");
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed.");
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 border border-gray-200">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
        <p className="text-gray-500 text-sm mt-0">
          Login to continue to your account
        </p>
      </div>

      {/* Error / Success messages */}
      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 p-2 rounded">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-600 text-sm bg-green-50 border border-green-200 p-2 rounded">
          {success}
        </p>
      )}

      {!showForgot ? (
        <>
          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f04e37] focus:outline-none text-gray-800"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password field with reveal toggle */}
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f04e37] focus:outline-none text-gray-800 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Login button */}
          <button
            onClick={handleEmailLogin}
            className="w-full bg-[#f04e37] text-white font-semibold px-4 py-3 rounded-lg shadow-md hover:bg-[#d9442f] transition-all active:scale-95"
          >
            Login
          </button>

          {/* Forgot password link */}
          <div className="text-center">
            <button
              className="text-sm text-[#f04e37] hover:underline"
              onClick={() => {
                setShowForgot(true);
                setStep(1);
              }}
            >
              Forgot Password?
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <hr className="flex-1 border-gray-300" />
            <span className="text-gray-500 text-sm">or</span>
            <hr className="flex-1 border-gray-300" />
          </div>

          {/* Google Login */}
          <div className="flex justify-center">
            <GoogleLogin
              clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
              onSuccess={handleGoogleLoginSuccess}
              onError={() => setError("Google login failed.")}
            />
          </div>

          {/* Continue as guest */}
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("guest", "true");
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/GuestHomepage", { replace: true });
            }}
            className="w-full bg-gray-100 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-200 active:scale-95"
          >
            Continue as Guest
          </button>

          {/* Switch to signup */}
          <p className="text-sm text-center text-gray-700 mt-2">
            New user?{" "}
            <span
              className="text-[#f04e37] font-semibold cursor-pointer hover:underline"
              onClick={toggleForm}
            >
              Create an account here
            </span>
          </p>
        </>
      ) : (
        // Forgot Password Steps (same structure, just re-styled consistently)
        <>
          {/* Email */}
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f04e37] focus:outline-none text-gray-800"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={step !== 1}
          />

          {step === 1 && (
            <>
              <button
                onClick={handleForgotRequest}
                className="w-full bg-[#f04e37] text-white font-semibold px-4 py-3 rounded-lg hover:bg-[#d9442f] active:scale-95 mt-2"
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
                  setError("");
                  setSuccess("");
                }}
                className="w-full bg-gray-100 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-200 active:scale-95 mt-2"
              >
                Back to Login
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {/* OTP */}
              <p className="text-sm text-gray-600">
                OTP expires in: <strong>{formatTime(timeLeft)}</strong>
              </p>
              <div
                className="flex justify-center space-x-2"
                onPaste={handlePaste}
              >
                {Array.from({ length: otpLength }).map((_, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    className="w-10 h-12 text-center text-lg text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f04e37]"
                    value={otp[index] || ""}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    ref={(el) => (inputRefs.current[index] = el)}
                  />
                ))}
              </div>

              {/* New Password */}
              <div className="relative w-full mt-4">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f04e37] focus:outline-none text-gray-800 pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                onClick={handleResetPassword}
                className="w-full bg-[#f04e37] text-white font-semibold px-4 py-3 rounded-lg hover:bg-[#d9442f] active:scale-95 mt-2"
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
                  setError("");
                  setSuccess("");
                }}
                className="w-full bg-gray-100 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-200 active:scale-95 mt-2"
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
