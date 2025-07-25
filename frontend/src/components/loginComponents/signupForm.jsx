export default function SignupForm({ toggleForm }) {
  return (
    <div className="bg-[#f04e37] p-6 rounded-2xl shadow-md space-y-4 text-white">
      <h2 className="text-2xl font-bold text-center">Sign Up</h2>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="First Name"
          className="w-1/2 p-2 rounded bg-white text-black"
        />
        <input
          type="text"
          placeholder="Last Name"
          className="w-1/2 p-2 rounded bg-white text-black"
        />
      </div>

      <input
        type="email"
        placeholder="Email"
        className="w-full p-2 rounded bg-white text-black"
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full p-2 rounded bg-white text-black"
      />

      <button
        type="submit"
        className="w-full bg-white text-black px-4 py-2 rounded-md  shadow-md 
             hover:bg-[#ffe2de] transition-colors duration-200 ease-in-out 
             active:scale-95"
      >
        Create an Account
      </button>

      <div className="text-center text-white font-semibold">or</div>

      <button
        type="submit"
        className="w-full bg-white text-black px-4 py-2 rounded-md  shadow-md 
             hover:bg-[#ffe2de] transition-colors duration-200 ease-in-out 
             active:scale-95"
      >
        Sign up with Google
      </button>
      <p className="text-xs text-center mt-4 bg-white/70 text-black px-4 py-2 rounded-md shadow-md">
        By signing up, you agree to our{" "}
        <span className="font-bold underline cursor-pointer">
          Terms and Conditions
        </span>{" "}
        and{" "}
        <span className="font-bold underline cursor-pointer">
          Privacy Policy
        </span>
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
