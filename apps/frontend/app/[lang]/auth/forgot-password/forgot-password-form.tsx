"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { addToast } from "@heroui/toast";
import { Form } from "@heroui/form";

import * as authApi from "@/lib/auth-api";

interface ForgotPasswordFormProps {
  dict: any;
  lang: string;
}

export function ForgotPasswordForm({ dict, lang }: ForgotPasswordFormProps) {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError(dict.auth.forgotPassword.enterEmail);

      return;
    }

    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      addToast({
        color: "success",
        title: dict.auth.forgotPassword.resetLinkSent,
        description: dict.auth.forgotPassword.resetLinkDescription,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : dict.auth.forgotPassword.sendFailed,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
        <p className="pb-4 text-left text-3xl font-semibold">
          {dict.auth.forgotPassword.title}
        </p>
        <p className="text-small text-default-500 pb-2">
          {dict.auth.forgotPassword.description}
        </p>
        <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {error && <div className="text-small text-danger">{error}</div>}
          <Input
            isRequired
            isDisabled={isLoading}
            label={dict.auth.forgotPassword.email}
            labelPlacement="outside"
            name="email"
            placeholder={dict.auth.forgotPassword.emailPlaceholder}
            type="email"
            value={email}
            variant="bordered"
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button fullWidth color="primary" isLoading={isLoading} type="submit">
            {dict.auth.forgotPassword.sendButton}
          </Button>
        </Form>

        <p className="text-small text-center">
          <Link href={`/${lang}/auth/login`} size="sm">
            {dict.auth.forgotPassword.backToLogin}
          </Link>
        </p>
      </div>
    </div>
  );
}
