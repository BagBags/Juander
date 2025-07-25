export default function LoginForm({ toggleForm }) {
  return (
    <div className="bg-[#f04e37] p-6 rounded-2xl shadow-md space-y-4 text-white">
      <h2 className="text-2xl font-bold text-center">Login</h2>

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
        className="w-full bg-white text-black px-4 py-2 rounded-md shadow-md 
             hover:bg-[#ffe2de] transition-colors duration-200 ease-in-out 
             active:scale-95"
      >
        Login
      </button>

      <div className="text-center text-white font-semibold">or</div>

      <button
        type="submit"
        className="w-full bg-white text-black px-4 py-2 rounded-md  shadow-md 
             hover:bg-[#ffe2de] transition-colors duration-200 ease-in-out 
             active:scale-95"
      >
        Continue with Google
      </button>

      <button
        type="submit"
        className="w-full bg-white text-black px-4 py-2 rounded-md  shadow-md 
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
    </div>
  );
}
