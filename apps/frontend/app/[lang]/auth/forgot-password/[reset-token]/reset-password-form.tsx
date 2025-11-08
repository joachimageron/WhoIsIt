"use client";

import type { Dictionary } from "@/dictionaries";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { Icon } from "@iconify/react";
import { addToast } from "@heroui/toast";
import { Form } from "@heroui/form";

import * as authApi from "@/lib/auth-api";

interface ResetPasswordFormProps {
  dict: Dictionary;
  lang: string;
  token: string;
}

export function ResetPasswordForm({
  dict,
  lang,
  token,
}: ResetPasswordFormProps) {
  const router = useRouter();

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isVisible, setIsVisible] = React.useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError(dict.auth.register.fillAllFields);

      return;
    }

    if (password !== confirmPassword) {
      setError(dict.auth.resetPassword.passwordsNoMatch);

      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(token, password);
      addToast({
        color: "success",
        title: dict.auth.resetPassword.resetSuccess,
        description: dict.auth.resetPassword.resetSuccessMessage,
      });
      // Success
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push(`/${lang}/auth/login`);
      }, 2000);
    } catch (err) {
      addToast({
        color: "danger",
        title: dict.auth.resetPassword.resetFailed,
        description:
          err instanceof Error
            ? err.message
            : dict.auth.resetPassword.resetFailed,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
        <p className="pb-4 text-left text-3xl font-semibold">
          {dict.auth.resetPassword.title}
        </p>
        <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
            isDisabled={isLoading}
            label={dict.auth.resetPassword.newPassword}
            labelPlacement="outside"
            name="password"
            placeholder={dict.auth.resetPassword.newPasswordPlaceholder}
            type={isVisible ? "text" : "password"}
            value={password}
            variant="bordered"
            onChange={(e) => setPassword(e.target.value)}
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
            isDisabled={isLoading}
            label={dict.auth.resetPassword.confirmPassword}
            labelPlacement="outside"
            name="confirmPassword"
            placeholder={dict.auth.resetPassword.confirmPasswordPlaceholder}
            type={isConfirmVisible ? "text" : "password"}
            value={confirmPassword}
            variant="bordered"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && <div className="text-small text-danger">{error}</div>}
          <Button fullWidth color="primary" isLoading={isLoading} type="submit">
            {dict.auth.resetPassword.resetButton}
          </Button>
        </Form>
        <p className="text-small text-center">
          <Link href={`/${lang}/auth/login`} size="sm">
            {dict.auth.resetPassword.backToLogin}
          </Link>
        </p>
      </div>
    </div>
  );
}
