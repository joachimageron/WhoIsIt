"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { Icon } from "@iconify/react";
import { addToast } from "@heroui/toast";

import { useAuthStore } from "@/store/auth-store";
import * as authApi from "@/lib/auth-api";
import { isValidEmail, looksLikeEmail } from "@/lib/utils/validation";
import { Form } from "@heroui/form";

interface LoginFormProps {
  dict: any;
  lang: string;
}

export function LoginForm({ dict, lang }: LoginFormProps) {
  const router = useRouter();
  const { setUser, setLoading, setError, clearError, isLoading, error } =
    useAuthStore();
  const [isVisible, setIsVisible] = React.useState(false);
  const [emailOrUsername, setEmailOrUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    if (!emailOrUsername || !password) {
      setError(dict.auth.login.fillAllFields);

      return;
    }

    if (looksLikeEmail(emailOrUsername) && !isValidEmail(emailOrUsername)) {
      setError(dict.auth.login.invalidEmail);

      return;
    }

    setLoading(true);

    try {
      const user = await authApi.login({ emailOrUsername, password });

      setUser(user);
      router.push(`/${lang}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : dict.auth.login.loginFailed,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error) {
      addToast({
        color: "danger",
        title: error ? dict.auth.login.loginFailed : "",
        description: error || "",
      });
    }
  }, [error, dict]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
        <p className="pb-4 text-left text-3xl font-semibold">
          {dict.auth.login.title}
        </p>
        <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            autoFocus
            isRequired
            label={dict.auth.login.emailOrUsername}
            labelPlacement="outside"
            name="emailOrUsername"
            placeholder={dict.auth.login.emailOrUsernamePlaceholder}
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
            label={dict.auth.login.password}
            labelPlacement="outside"
            name="password"
            placeholder={dict.auth.login.passwordPlaceholder}
            type={isVisible ? "text" : "password"}
            value={password}
            variant="bordered"
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex items-center justify-between py-2">
            <Link href={`/${lang}/auth/forgot-password`} size="sm">
              {dict.auth.login.forgotPassword}
            </Link>
          </div>
          <Button fullWidth color="primary" isLoading={isLoading} type="submit">
            {dict.auth.login.loginButton}
          </Button>
        </Form>
        <p className="text-small text-center">
          <Link href={`/${lang}/auth/register`} size="sm">
            {dict.auth.login.noAccount}
          </Link>
        </p>
      </div>
    </div>
  );
}
