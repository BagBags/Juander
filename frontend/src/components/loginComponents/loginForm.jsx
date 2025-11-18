import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import i18n from "/src/i18n.js";
import { saveAuth, clearAuth } from "../../utils/authStorage";

export default function LoginForm({ toggleForm }) {
  const navigate = useNavigate();
  const guestButtonRef = useRef(null);
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
  const [resendCooldown, setResendCooldown] = useState(0); // Cooldown for resend button


  // 👇 Load saved language on component mount
  useEffect(() => {
    const savedLang = localStorage.getItem("lang") || "en";
    i18n.changeLanguage(savedLang);
  }, []);


  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

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
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/google-login`,
        { token: credentialResponse.credential }
      );

      const { user, token } = res.data;
      localStorage.removeItem("guest");
      
      // Use secure auth storage
      saveAuth(token, user);

      // 👇 Save & apply language
      if (user.language) {
        i18n.changeLanguage(user.language);
        localStorage.setItem("language", user.language);
      }

      // Check if profile is completed
      if (user.role !== "admin" && !user.profileCompleted) {
        navigate("/CompleteProfile");
      } else {
        navigate(user.role === "admin" ? "/AdminHome" : "/Homepage");
      }
    } catch (err) {
      console.error("Google login error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message || "Google login failed. Please try again."
      );
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
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/login`, {
        email,
        password,
      });

      const { user, token } = res.data;
      localStorage.removeItem("guest");
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      // 👇 Save & apply language
      if (user.language) {
        localStorage.setItem("lang", user.language);
        i18n.changeLanguage(user.language);
      }

      // Check if profile is completed
      if (user.role !== "admin" && !user.profileCompleted) {
        navigate("/CompleteProfile");
      } else {
        navigate(user.role === "admin" ? "/AdminHome" : "/Homepage");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
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
      await axios.post(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/send-otp`, {
        email,
      });
      setSuccess("OTP sent to your email.");
      setStep(2);
      setTimeLeft(600);
      setResendCooldown(60); // 60 second cooldown for resend
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

    // Password validation - same as signup
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError("Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character (@$!%*?&).");
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/reset-password`, {
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

  const handleResendForgotOtp = async () => {
    if (resendCooldown > 0) return;
    
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/send-otp`, {
        email,
      });
      setSuccess("OTP resent to your email.");
      setResendCooldown(60); // 60 second cooldown
      setError(""); // Clear any previous errors
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 rounded-2xl space-y-3">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Welcome Back</h2>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          Login to continue to your account
        </p>
      </div>

      {/* Error / Success messages */}
      {error && (
        <p className="text-red-600 text-xs sm:text-sm bg-red-50 border border-red-200 p-2 rounded">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-600 text-xs sm:text-sm bg-green-50 border border-green-200 p-2 rounded">
          {success}
        </p>
      )}

      {!showForgot ? (
        <>
          {/* Email */}
          <div>
            <label htmlFor="login-email" className="sr-only">Email Address</label>
            <input
              id="login-email"
              type="email"
              placeholder="Email"
              aria-label="Email Address"
              className="w-full p-2.5 sm:p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f04e37] focus:outline-none text-gray-800 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password with reveal toggle */}
          <div className="relative w-full">
            <label htmlFor="login-password" className="sr-only">Password</label>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              aria-label="Password"
              className="w-full p-2.5 sm:p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f04e37] focus:outline-none text-gray-800 text-sm pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Login button */}
          <button
            onClick={handleEmailLogin}
            className="w-full bg-[#f04e37] text-white font-semibold px-4 py-2.5 sm:py-3 rounded-lg shadow-md hover:bg-[#d9442f] transition-all active:scale-95 text-sm sm:text-base"
          >
            Login
          </button>

          {/* Forgot password */}
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

          {/* Google Login - sized responsively to match the Guest button */}
          <ResponsiveGoogleLogin guestRef={guestButtonRef} onSuccess={handleGoogleLoginSuccess} onError={() => setError("Google login failed.")} />

          {/* Guest Login */}
          <button
            type="button"
            onClick={() => {
              // Use localStorage for guest users to persist across tabs/windows
              localStorage.setItem("guest", "true");
              localStorage.setItem("guestLanguage", "en"); // Set English as default for guests
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              // Clear sessionStorage
              sessionStorage.clear();
              // Set language to English immediately
              i18n.changeLanguage("en");
              navigate("/GuestHomepage", { replace: true });
            }}
            ref={guestButtonRef}
            className="w-full bg-gray-100 text-gray-800 px-4 py-2.5 sm:py-3 rounded-lg hover:bg-gray-200 active:scale-95 text-sm sm:text-base"
          >
            Continue as Guest
          </button>

          {/* Switch to signup */}
          <p className="text-xs sm:text-sm text-center text-gray-700">
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
        <>
          {/* Step 1: Request OTP */}
          {step === 1 && (
            <>
              <label htmlFor="forgot-email" className="sr-only">Email Address for Password Reset</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="Enter your email"
                aria-label="Email Address for Password Reset"
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f04e37] focus:outline-none text-gray-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                onClick={handleForgotRequest}
                className="w-full bg-[#f04e37] text-white px-4 py-3 rounded-lg shadow-md hover:bg-[#d9442f] transition-all active:scale-95"
              >
                Send OTP
              </button>
            </>
          )}

          {/* Step 2: Enter OTP + Reset password */}
          {step === 2 && (
            <>
              <p className="text-sm text-gray-600">
                Enter the 6-digit OTP sent to your email.
              </p>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {Array.from({ length: otpLength }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength="1"
                    aria-label={`OTP digit ${i + 1} of ${otpLength}`}
                    className="w-10 h-10 border rounded text-center text-lg"
                    value={otp[i] || ""}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    ref={(el) => (inputRefs.current[i] = el)}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Expires in: {formatTime(timeLeft)}
              </p>

              {/* Resend OTP Button */}
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={handleResendForgotOtp}
                  disabled={resendCooldown > 0}
                  className={`text-sm font-medium ${
                    resendCooldown > 0
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-[#f04e37] hover:underline"
                  }`}
                >
                  {resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : "Resend OTP"}
                </button>
              </div>

              {/* New password */}
              <div className="relative w-full mt-4">
                <label htmlFor="new-password" className="sr-only">New Password</label>
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  aria-label="New Password"
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f04e37] focus:outline-none text-gray-800 pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                onClick={handleResetPassword}
                className="w-full bg-[#f04e37] text-white px-4 py-3 rounded-lg shadow-md hover:bg-[#d9442f] transition-all active:scale-95 mt-3"
              >
                Reset Password
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

function ResponsiveGoogleLogin({ guestRef, onSuccess, onError }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const measure = () => {
      const guestW = guestRef?.current?.offsetWidth;
      const containerW = containerRef.current?.offsetWidth;
      const w = guestW || containerW || 360;
      setWidth(Math.floor(w));
    };
    measure();
    window.addEventListener("resize", measure, { passive: true });
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div className="w-full flex justify-center">
      <div ref={containerRef} className="w-full sm:w-[360px] min-w-[280px] h-[44px] min-h-[44px] flex-shrink-0 overflow-hidden">
        <GoogleLogin
          key={width || 360}
          onSuccess={onSuccess}
          onError={onError}
          useOneTap
          width={width || 360}
          text="signin_with"
          theme="outline"
          size="large"
          shape="rectangular"
          logo_alignment="left"
        />
      </div>
    </div>
  );
}
