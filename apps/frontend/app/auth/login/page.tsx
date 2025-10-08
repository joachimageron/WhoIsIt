"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { Icon } from "@iconify/react";

import { useAuthStore } from "@/store/auth-store";
import * as authApi from "@/lib/auth-api";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setLoading, setError, clearError, isLoading, error } = useAuthStore();
  const [isVisible, setIsVisible] = React.useState(false);
  const [emailOrUsername, setEmailOrUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    if (!emailOrUsername || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const user = await authApi.login({ emailOrUsername, password });
      setUser(user);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
        <p className="pb-4 text-left text-3xl font-semibold">
          Log In
          <span aria-label="emoji" className="ml-2" role="img">
            👋
          </span>
        </p>
        {error && (
          <div className="rounded-medium bg-danger-50 px-4 py-3 text-danger">
            {error}
          </div>
        )}
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
        >
          <Input
            isRequired
            label="Email or Username"
            labelPlacement="outside"
            name="emailOrUsername"
            placeholder="Enter your email or username"
            type="text"
            value={emailOrUsername}
            variant="bordered"
            onChange={(e) => setEmailOrUsername(e.target.value)}
          />
          <Input
            isRequired
            endContent={
              <button type="button" onClick={toggleVisibility}>
                {isVisible ? (
                  <Icon
                    className="text-default-400 pointer-events-none text-2xl"
                    icon="solar:eye-closed-linear"
                  />
                ) : (
                  <Icon
                    className="text-default-400 pointer-events-none text-2xl"
                    icon="solar:eye-bold"
                  />
                )}
              </button>
            }
            label="Password"
            labelPlacement="outside"
            name="password"
            placeholder="Enter your password"
            type={isVisible ? "text" : "password"}
            value={password}
            variant="bordered"
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex items-center justify-between py-2">
            <Link href="/auth/forgot-password" size="sm">
              Forgot password?
            </Link>
          </div>
          <Button color="primary" type="submit" isLoading={isLoading}>
            Log In
          </Button>
        </form>
        <p className="text-small text-center">
          <Link href="/auth/register" size="sm">
            Don&apos;t have an account? Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
