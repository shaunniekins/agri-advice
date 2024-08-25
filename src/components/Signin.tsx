// src/components/Signin.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

const SigninComponent = () => {
  const [isInputUserPasswordVisible, setIsInputUserPasswordVisible] =
    useState(false);
  const [signInPending, setSignInPending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSignInPending(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Error signing in:", error.message);
    } else {
      console.log("Signed in successfully:", data);
      router.push("/admin");
    }

    setSignInPending(false);
  };

  return (
    <div className="w-full bg-white">
      <div className="mx-5 md:container md:mx-auto md:px-[35rem] min-h-[100svh] h-[100svh] flex flex-col justify-around items-center">
        {/* <img
          src="/images/logo.svg"
          alt="logo"
          width={100}
          height={100}
          className="mt-16"
        /> */}
        <form
          className="animate-in flex-1 flex flex-col w-full justify-center gap-2"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col rounded-md shadow-sm gap-3 mb-16">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type={isInputUserPasswordVisible ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() =>
                setIsInputUserPasswordVisible(!isInputUserPasswordVisible)
              }
            >
              {isInputUserPasswordVisible ? "Hide Password" : "Show Password"}
            </button>
            <button type="submit">
              {signInPending ? "Signing In..." : "Sign In"}
            </button>
          </div>
        </form>
        <button type="button" color="primary" className="mb-10">
          Create New Account
        </button>
      </div>
    </div>
  );
};

export default SigninComponent;
