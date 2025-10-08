"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import * as authApi from "@/lib/auth-api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset link"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
        <p className="pb-4 text-left text-3xl font-semibold">
          Forgot Password
          <span aria-label="emoji" className="ml-2" role="img">
            🔐
          </span>
        </p>
        {success ? (
          <div className="text-small text-success">
            If an account exists with this email, you will receive a password
            reset link shortly.
          </div>
        ) : (
          <>
            <p className="text-small text-default-500 pb-2">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {error && (
                <div className="text-small text-danger">{error}</div>
              )}
              <Input
                isRequired
                label="Email"
                labelPlacement="outside"
                name="email"
                placeholder="Enter your email"
                type="email"
                variant="bordered"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isDisabled={isLoading}
              />
              <Button color="primary" type="submit" isLoading={isLoading}>
                Send Reset Link
              </Button>
            </form>
          </>
        )}
        <p className="text-small text-center">
          <Link href="/login" size="sm">
            Back to Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
