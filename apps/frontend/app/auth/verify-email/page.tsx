"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Icon } from "@iconify/react";
import { Link } from "@heroui/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

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
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/verify-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ token }),
          },
        );

        if (response.ok) {
          setStatus("success");
        } else {
          const data = await response.json();

          setErrorMessage(
            data.message || "Failed to verify email. Please try again.",
          );
          setStatus("error");
        }
      } catch {
        setErrorMessage("An error occurred. Please try again later.");
        setStatus("error");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
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
            <div className="rounded-full bg-success-100 p-4">
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
            <div className="rounded-full bg-danger-100 p-4">
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
            <div className="rounded-full bg-warning-100 p-4">
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

        <div className="mt-6 text-center">
          <Link href="/" size="sm">
            Back to Home
          </Link>
        </div>
      </Card>
    </div>
  );
}
