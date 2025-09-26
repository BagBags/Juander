import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

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
  const [errors, setErrors] = useState("");
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      const res = await axios.post(
        "https://juander.onrender.com/api/auth/register",
        {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
        }
      );
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
        "https://juander.onrender.com/api/auth/verify-otp",
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

  const handleGoogleSignup = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      const res = await axios.post(
        "https://juander.onrender.com/api/auth/google-login",
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
    <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-2xl  space-y-6 ">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Sign Up</h2>
        <p className="text-gray-500 text-sm mt-0">
          Create an account to get started
        </p>
      </div>

      {errors.general && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">
          {errors.general}
        </p>
      )}
      {message && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-200 p-2 rounded">
          {message}
        </p>
      )}

      {step === "form" ? (
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="flex gap-2">
            <div className="w-1/2">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={form.firstName}
                onChange={handleChange}
                className={`w-full p-3 rounded-lg border ${
                  errors.firstName ? "border-red-400" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-[#f04e37] text-gray-800`}
              />
              {errors.firstName && (
                <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
              )}
            </div>

            <div className="w-1/2">
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={form.lastName}
                onChange={handleChange}
                className={`w-full p-3 rounded-lg border ${
                  errors.lastName ? "border-red-400" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-[#f04e37] text-gray-800`}
              />
              {errors.lastName && (
                <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className={`w-full p-3 rounded-lg border ${
                errors.email ? "border-red-400" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-[#f04e37] text-gray-800`}
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password with toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className={`w-full p-3 rounded-lg border ${
                errors.password ? "border-red-400" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-[#f04e37] text-gray-800 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
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
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Retype Password"
              value={form.confirmPassword}
              onChange={handleChange}
              className={`w-full p-3 rounded-lg border ${
                errors.confirmPassword ? "border-red-400" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-[#f04e37] text-gray-800 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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

          <button
            type="submit"
            className="w-full bg-[#f04e37] text-white px-4 py-3 rounded-lg shadow-md font-semibold hover:bg-[#d9442f] transition duration-200 active:scale-95"
          >
            Create an Account
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-3">
          <p className="text-sm text-gray-600">
            OTP expires in: <strong>{formatTime(timeLeft)}</strong>
          </p>

          <div>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className={`w-full p-2 rounded-lg border ${
                errors.otp ? "border-red-400" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-[#f04e37] text-gray-800`}
            />
            {errors.otp && (
              <p className="text-xs text-red-600 mt-1">{errors.otp}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#f04e37] text-white px-4 py-2 rounded-lg shadow-md font-semibold hover:bg-[#d9442f] active:scale-95"
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
      <GoogleLogin
        onSuccess={handleGoogleSignup}
        onError={() => setErrors({ general: "Google sign-up error" })}
        width="100%"
        text="signup_with"
      />

      <p className="text-xs text-center mt-4 text-gray-600">
        By signing up, you agree to our{" "}
        <span className="font-semibold underline cursor-pointer">Terms</span>{" "}
        and{" "}
        <span className="font-semibold underline cursor-pointer">Privacy</span>
      </p>

      <p className="text-sm text-center text-gray-700 mt-2">
        Already have an account?{" "}
        <span
          className="text-[#f04e37] font-semibold cursor-pointer hover:underline"
          onClick={toggleForm}
        >
          Log in here
        </span>
      </p>
    </div>
  );
}
