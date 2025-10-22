"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Icon } from "@iconify/react";

import * as authApi from "@/lib/auth-api";

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useParams();
  const token = params["verify-token"] as string;

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
          <h2 className="text-2xl font-semibold">Verifying your email...</h2>
          <p className="text-default-500 text-center">
            Please wait while we verify your email address.
          </p>
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
          <h2 className="text-2xl font-semibold">Email Verified!</h2>
          <p className="text-default-500 text-center">
            Your email has been successfully verified. You can now enjoy all
            features of WhoIsIt.
          </p>
          <Button
            className="mt-4"
            color="primary"
            size="lg"
            onPress={() => router.push("/")}
          >
            Go to Home
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
          <h2 className="text-2xl font-semibold">Verification Failed</h2>
          <p className="text-danger text-center">{errorMessage}</p>
          <div className="mt-4 flex gap-2">
            <Button
              color="primary"
              variant="bordered"
              onPress={() => router.push("/auth/register")}
            >
              Register Again
            </Button>
            <Button color="primary" onPress={() => router.push("/")}>
              Go to Home
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
          <h2 className="text-2xl font-semibold">Invalid Link</h2>
          <p className="text-default-500 text-center">
            This verification link is invalid or has expired. Please register
            again or request a new verification email.
          </p>
          <Button
            className="mt-4"
            color="primary"
            onPress={() => router.push("/auth/register")}
          >
            Go to Registration
          </Button>
        </div>
      )}
    </div>
  );
}
