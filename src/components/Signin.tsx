// src/components/Signin.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { Button, Input } from "@nextui-org/react";
import { EyeSlashFilledIcon } from "../../public/icons/EyeSlashFilledIcon";
import { EyeFilledIcon } from "../../public/icons/EyeFilledIcon";

interface SigninComponentProps {
  userType: string;
}

const SigninComponent = ({ userType }: SigninComponentProps) => {
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
    // <div className="w-full bg-white">
    <div className="w-full h-full flex flex-col justify-center items-center">
      <h4>LOGIN</h4>
      <form
        className="animate-in h-full flex flex-col w-full justify-center items-center gap-2 relative"
        onSubmit={handleSubmit}
      >
        <div className="absolute inset-0 w-full h-full flex flex-col justify-center items-center rounded-md shadow-sm gap-3 mb-16">
          <Input
            type="email"
            label="Email"
            variant="bordered"
            color="success"
            isRequired
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type={isInputUserPasswordVisible ? "text" : "password"}
            label="Password"
            variant="bordered"
            color="success"
            isRequired
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            endContent={
              <button
                className="focus:outline-none"
                type="button"
                onClick={() =>
                  setIsInputUserPasswordVisible(!isInputUserPasswordVisible)
                }
              >
                {isInputUserPasswordVisible ? (
                  <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                ) : (
                  <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                )}
              </button>
            }
          />

          <Button
            type="submit"
            color="success"
            disabled={signInPending}
            size="lg"
            className="text-white"
          >
            {signInPending ? "Signing In..." : "Sign In"}
          </Button>
        </div>
      </form>
      <Button
        type="submit"
        variant="ghost"
        isDisabled={userType === "Administrator"}
        color="success"
        onClick={() => {
          // return router.push(`/ident/${role}/signup`);
        }}
        className="mb-10"
      >
        {userType !== "Administrator" ? "Create New Account" : "Administrator"}
      </Button>
    </div>
    // </div>
  );
};

export default SigninComponent;
