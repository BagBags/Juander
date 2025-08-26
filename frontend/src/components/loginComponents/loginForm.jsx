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
    <div className="bg-[#f04e37] p-6 rounded-2xl shadow-md space-y-4 text-white">
      <h2 className="text-2xl font-bold text-center">Login</h2>

      {error && (
        <p className="text-red-500 text-sm bg-red-100 p-2 rounded">{error}</p>
      )}
      {success && (
        <p className="text-green-600 text-sm bg-green-100 p-2 rounded">
          {success}
        </p>
      )}

      {!showForgot ? (
        <>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 rounded bg-white text-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password field with reveal toggle */}
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full p-2 rounded bg-white text-black pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

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
            clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
            onSuccess={handleGoogleLoginSuccess}
            onError={() => setError("Google login failed.")}
          />

          <button
            type="button"
            onClick={() => navigate("/Homepage")}
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
                  setError("");
                  setSuccess("");
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
              <p className="text-sm">
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
                    className="w-10 h-12 text-center text-black text-lg 
             bg-white border border-gray-300 rounded-md 
             focus:outline-none focus:ring-2 focus:ring-[#f04e37]"
                    value={otp[index] || ""}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    ref={(el) => (inputRefs.current[index] = el)}
                  />
                ))}
              </div>

              {/* New password with reveal toggle */}
              <div className="relative w-full mt-4">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  className="w-full p-2 rounded bg-white text-black pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

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
                  setError("");
                  setSuccess("");
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
