"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";

export default function ForgotPasswordPage() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
        <p className="pb-4 text-left text-3xl font-semibold">
          Forgot Password
          <span aria-label="emoji" className="ml-2" role="img">
            🔐
          </span>
        </p>
        <p className="text-small text-default-500 pb-2">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </p>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <Input
            isRequired
            label="Email"
            labelPlacement="outside"
            name="email"
            placeholder="Enter your email"
            type="email"
            variant="bordered"
          />
          <Button color="primary" type="submit">
            Send Reset Link
          </Button>
        </form>
        <p className="text-small text-center">
          <Link href="/login" size="sm">
            Back to Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
