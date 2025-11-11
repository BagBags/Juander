import { useState, useEffect, useRef } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import TermsModal from "./TermsModal";
import PrivacyModal from "./PrivacyModal";

export default function SignupForm({ toggleForm }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [step, setStep] = useState("form"); // "form" or "verify"
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [hasReadTermsInModal, setHasReadTermsInModal] = useState(false);

  const otpLength = 6;
  const inputRefs = useRef([]);

  useEffect(() => {
    if (step === "verify" && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${mins}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email) newErrors.email = "Email is required";
    else if (!emailRegex.test(form.email))
      newErrors.email = "Invalid email format";

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!form.password) newErrors.password = "Password is required";
    else if (!passwordRegex.test(form.password))
      newErrors.password =
        "At least 8 chars, 1 uppercase, 1 number, 1 special char";

    if (!form.confirmPassword)
      newErrors.confirmPassword = "Please retype your password";
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (!hasAcceptedTerms)
      newErrors.terms = "You must accept the Terms and Conditions";

    return newErrors;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/register`, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      setMessage(res.data.message);
      setStep("verify");
      setTimeLeft(600);
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || "Registration failed",
      });
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/verify-otp`,
        {
          email: form.email,
          otp,
        }
      );
      setMessage(res.data.message);
      navigate("/Homepage");
    } catch (err) {
      setErrors({
        otp: err.response?.data?.message || "OTP verification failed",
      });
    }
  };

  // 🔹 OTP input handlers
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

  const handleGoogleSignup = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/google-login`,
        {
          token: credential,
        }
      );

      const user = res.data;
      localStorage.setItem("user", JSON.stringify(user));
      navigate(user.user.role === "admin" ? "/AdminHome" : "/Home");
    } catch (error) {
      setErrors({ general: "Google sign-up failed" });
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 rounded-2xl space-y-3">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Sign Up</h2>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          Create an account to get started
        </p>
      </div>

      {errors.general && (
        <p className="text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">
          {errors.general}
        </p>
      )}
      {message && (
        <p className="text-xs sm:text-sm text-green-600 bg-green-50 border border-green-200 p-2 rounded">
          {message}
        </p>
      )}

      {step === "form" ? (
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="flex gap-2">
            <div className="w-1/2">
              <label htmlFor="signup-firstname" className="sr-only">First Name</label>
              <input
                id="signup-firstname"
                type="text"
                name="firstName"
                placeholder="First Name"
                aria-label="First Name"
                value={form.firstName}
                onChange={handleChange}
                className={`w-full p-2.5 sm:p-3 rounded-lg border text-sm ${
                  errors.firstName ? "border-red-400" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-[#f04e37] text-gray-800`}
              />
              {errors.firstName && (
                <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
              )}
            </div>

            <div className="w-1/2">
              <label htmlFor="signup-lastname" className="sr-only">Last Name</label>
              <input
                id="signup-lastname"
                type="text"
                name="lastName"
                placeholder="Last Name"
                aria-label="Last Name"
                value={form.lastName}
                onChange={handleChange}
                className={`w-full p-2.5 sm:p-3 rounded-lg border text-sm ${
                  errors.lastName ? "border-red-400" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-[#f04e37] text-gray-800`}
              />
              {errors.lastName && (
                <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="signup-email" className="sr-only">Email Address</label>
            <input
              id="signup-email"
              type="email"
              name="email"
              placeholder="Email"
              aria-label="Email Address"
              value={form.email}
              onChange={handleChange}
              className={`w-full p-2.5 sm:p-3 rounded-lg border text-sm ${
                errors.email ? "border-red-400" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-[#f04e37] text-gray-800`}
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password with toggle */}
          <div className="relative">
            <label htmlFor="signup-password" className="sr-only">Password</label>
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              aria-label="Password"
              value={form.password}
              onChange={handleChange}
              className={`w-full p-2.5 sm:p-3 rounded-lg border text-sm ${
                errors.password ? "border-red-400" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-[#f04e37] text-gray-800 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password with toggle */}
          <div className="relative">
            <label htmlFor="signup-confirm-password" className="sr-only">Confirm Password</label>
            <input
              id="signup-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Retype Password"
              aria-label="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              className={`w-full p-2.5 sm:p-3 rounded-lg border text-sm ${
                errors.confirmPassword ? "border-red-400" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-[#f04e37] text-gray-800 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms Acceptance */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={hasAcceptedTerms}
                onChange={(e) => {
                  // If trying to check and hasn't read in modal, open modal
                  if (e.target.checked && !hasReadTermsInModal) {
                    setShowTermsModal(true);
                  } else {
                    // Allow unchecking even after modal acceptance
                    setHasAcceptedTerms(e.target.checked);
                  }
                }}
                className="mt-1 w-4 h-4 text-[#f04e37] border-gray-300 rounded focus:ring-[#f04e37] focus:ring-2 cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  className="font-semibold text-[#f04e37] hover:underline"
                >
                  Terms and Conditions
                </button>
                {" "}and{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPrivacyModal(true);
                  }}
                  className="font-semibold text-[#f04e37] hover:underline"
                >
                  Privacy Policy
                </button>
              </span>
            </label>
            {errors.terms && (
              <p className="text-xs text-red-600 ml-7">{errors.terms}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!hasAcceptedTerms}
            className={`w-full px-4 py-2.5 sm:py-3 rounded-lg shadow-md font-semibold transition duration-200 active:scale-95 text-sm sm:text-base ${
              hasAcceptedTerms
                ? 'bg-[#f04e37] text-white hover:bg-[#d9442f]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Create an Account
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-3">
          <p className="text-sm text-gray-600 text-center">
            OTP expires in: <strong>{formatTime(timeLeft)}</strong>
          </p>

          {/* OTP Inputs */}
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
          {errors.otp && (
            <p className="text-xs text-red-600 mt-1 text-center">
              {errors.otp}
            </p>
          )}

          <button
            type="submit"
            disabled={otp.length !== otpLength}
            className={`w-full px-4 py-2 rounded-lg shadow-md font-semibold active:scale-95 mt-2 ${
              otp.length === otpLength
                ? "bg-[#f04e37] text-white hover:bg-[#d9442f]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Verify OTP
          </button>
        </form>
      )}

      {/* Divider */}
      <div className="flex items-center gap-2">
        <hr className="flex-1 border-gray-300" />
        <span className="text-gray-500 text-sm">or</span>
        <hr className="flex-1 border-gray-300" />
      </div>

      {/* Google Login */}
      <div className="w-full h-[40px] sm:h-[44px] overflow-hidden">
        <div className="w-full h-[40px] sm:h-[44px]" style={{ minWidth: '100%', minHeight: '40px' }}>
          <GoogleLogin
            onSuccess={handleGoogleSignup}
            onError={() => setErrors({ general: "Google sign-up error" })}
            width="100%"
            text="signup_with"
            theme="outline"
            size="large"
            shape="rectangular"
          />
        </div>
      </div>

      <p className="text-xs sm:text-sm text-center text-gray-700">
        Already have an account?{" "}
        <span
          className="text-[#f04e37] font-semibold cursor-pointer hover:underline"
          onClick={toggleForm}
        >
          Log in here
        </span>
      </p>

      {/* Modals */}
      <TermsModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setHasReadTermsInModal(true);
          setHasAcceptedTerms(true);
        }}
        requireAcceptance={true}
      />
      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </div>
  );
}
