"use client";

import type { Dictionary } from "@/dictionaries";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Icon } from "@iconify/react";

import * as authApi from "@/lib/auth-api";

interface VerifyEmailFormProps {
  dict: Dictionary;
  lang: string;
  token: string;
}

export function VerifyEmailForm({ dict, lang, token }: VerifyEmailFormProps) {
  const router = useRouter();

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "invalid"
  >("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");

      return;
    }

    const verifyEmail = async () => {
      try {
        await authApi.verifyEmail({ token });
        setStatus("success");
      } catch (e) {
        if (e instanceof Error) {
          setErrorMessage(e.message);
        } else {
          setErrorMessage("An error occurred. Please try again later.");
        }
        setStatus("error");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="flex flex-col h-full w-full items-center justify-center p-4">
      {status === "loading" && (
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <h2 className="text-2xl font-semibold">
            {dict.auth.verifyEmail.verifying}
          </h2>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full p-4">
            <Icon
              className="text-success text-5xl"
              icon="solar:check-circle-bold"
            />
          </div>
          <h2 className="text-2xl font-semibold">
            {dict.auth.verifyEmail.success}
          </h2>
          <p className="text-default-500 text-center">
            {dict.auth.verifyEmail.successMessage}
          </p>
          <Button
            className="mt-4"
            color="primary"
            size="lg"
            onPress={() => router.push(`/${lang}/auth/login`)}
          >
            {dict.auth.verifyEmail.goToLogin}
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full p-4">
            <Icon
              className="text-danger text-5xl"
              icon="solar:close-circle-bold"
            />
          </div>
          <h2 className="text-2xl font-semibold">
            {dict.auth.verifyEmail.failed}
          </h2>
          <p className="text-danger text-center">{errorMessage}</p>
          <div className="mt-4 flex gap-2">
            <Button
              color="primary"
              variant="bordered"
              onPress={() => router.push(`/${lang}/auth/register`)}
            >
              {dict.nav.signUp}
            </Button>
            <Button color="primary" onPress={() => router.push(`/${lang}`)}>
              {dict.nav.home}
            </Button>
          </div>
        </div>
      )}

      {status === "invalid" && (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full p-4">
            <Icon
              className="text-warning text-5xl"
              icon="solar:danger-triangle-bold"
            />
          </div>
          <h2 className="text-2xl font-semibold">
            {dict.auth.verifyEmail.failed}
          </h2>
          <p className="text-default-500 text-center">
            {dict.auth.verifyEmail.failedMessage}
          </p>
          <Button
            className="mt-4"
            color="primary"
            onPress={() => router.push(`/${lang}/auth/register`)}
          >
            {dict.nav.signUp}
          </Button>
        </div>
      )}
    </div>
  );
}
