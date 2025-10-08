"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { Icon } from "@iconify/react";
import * as authApi from "@/lib/auth-api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isVisible, setIsVisible] = React.useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
          <p className="pb-4 text-left text-3xl font-semibold">
            Reset Password
            <span aria-label="emoji" className="ml-2" role="img">
              🔑
            </span>
          </p>
          <div className="text-small text-danger">
            Invalid or missing reset token. Please request a new password reset
            link.
          </div>
          <p className="text-small text-center">
            <Link href="/auth/forgot-password" size="sm">
              Request Password Reset
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
        <p className="pb-4 text-left text-3xl font-semibold">
          Reset Password
          <span aria-label="emoji" className="ml-2" role="img">
            🔑
          </span>
        </p>
        {success ? (
          <div className="text-small text-success">
            Password reset successfully! Redirecting to login...
          </div>
        ) : (
          <>
            <p className="text-small text-default-500 pb-2">
              Please enter your new password.
            </p>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {error && (
                <div className="text-small text-danger">{error}</div>
              )}
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
                label="New Password"
                labelPlacement="outside"
                name="password"
                placeholder="Enter your new password"
                type={isVisible ? "text" : "password"}
                variant="bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isDisabled={isLoading}
              />
              <Input
                isRequired
                endContent={
                  <button type="button" onClick={toggleConfirmVisibility}>
                    {isConfirmVisible ? (
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
                label="Confirm New Password"
                labelPlacement="outside"
                name="confirmPassword"
                placeholder="Confirm your new password"
                type={isConfirmVisible ? "text" : "password"}
                variant="bordered"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                isDisabled={isLoading}
              />
              <Button color="primary" type="submit" isLoading={isLoading}>
                Reset Password
              </Button>
            </form>
          </>
        )}
        <p className="text-small text-center">
          <Link href="/auth/login" size="sm">
            Back to Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
