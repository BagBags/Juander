import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function SignupForm({ toggleForm }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [step, setStep] = useState("form"); // "form" or "verify"
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

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
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        form
      );
      setMessage(res.data.message);
      setStep("verify");
      setTimeLeft(600); // reset timer
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/verify-otp",
        {
          email: form.email,
          otp,
        }
      );
      setMessage(res.data.message);
      navigate("/Homepage");
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    }
  };

  const handleGoogleSignup = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      const res = await axios.post(
        "http://localhost:5000/api/auth/google-login",
        {
          token: credential,
        }
      );

      const user = res.data;
      localStorage.setItem("user", JSON.stringify(user));
      navigate(user.user.role === "admin" ? "/AdminHome" : "/Home");
    } catch (error) {
      console.error("Google sign-up failed:", error);
    }
  };

  return (
    <div className="bg-[#f04e37] p-6 rounded-2xl shadow-md space-y-4 text-white">
      <h2 className="text-2xl font-bold text-center">Sign Up</h2>

      {error && <p className="text-sm text-red-200">{error}</p>}
      {message && <p className="text-sm text-green-200">{message}</p>}

      {step === "form" ? (
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              className="w-1/2 p-2 rounded bg-white text-black"
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              className="w-1/2 p-2 rounded bg-white text-black"
              required
            />
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-2 rounded bg-white text-black"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-2 rounded bg-white text-black"
            required
          />

          <button
            type="submit"
            className="w-full bg-white text-black px-4 py-2 rounded-md hover:bg-[#ffe2de] active:scale-95"
          >
            Create an Account
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-3">
          <p className="text-sm">
            OTP expires in: <strong>{formatTime(timeLeft)}</strong>
          </p>

          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="w-full p-2 rounded bg-white text-black"
            required
          />
          <button
            type="submit"
            className="w-full bg-white text-black px-4 py-2 rounded-md hover:bg-[#ffe2de] active:scale-95"
          >
            Verify OTP
          </button>
        </form>
      )}

      <div className="text-center font-semibold">or</div>

      <GoogleLogin
        onSuccess={handleGoogleSignup}
        onError={() => console.error("Google sign-up error")}
        width="100%"
        text="signup_with"
      />

      <p className="text-xs text-center mt-4 bg-white/70 text-black px-4 py-2 rounded-md shadow-md">
        By signing up, you agree to our{" "}
        <span className="font-bold underline cursor-pointer">Terms</span> and{" "}
        <span className="font-bold underline cursor-pointer">Privacy</span>
      </p>

      <p className="text-sm text-center mt-2">
        Already have an account?{" "}
        <span
          className="underline font-bold cursor-pointer"
          onClick={toggleForm}
        >
          Log in here
        </span>
      </p>
    </div>
  );
}
