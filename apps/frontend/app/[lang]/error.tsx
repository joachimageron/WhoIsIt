"use client";

import { useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

import { title, subtitle } from "@/components/primitives";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service

    console.error("Error boundary caught:", error);
  }, [error]);

  return (
    <section className="flex flex-col items-center justify-center gap-8 py-8 md:py-10 min-h-[60vh]">
      <div className="inline-block max-w-3xl text-center justify-center">
        <div className="mb-6">
          <span className={title({ size: "lg", color: "yellow" })}>
            Oops! Something went wrong
          </span>
        </div>
        <div className={subtitle({ class: "mt-4 max-w-2xl" })}>
          We&apos;re sorry, but something unexpected happened. Please try again.
        </div>
      </div>

      <Card className="max-w-md">
        <CardBody className="p-6">
          {error.message && (
            <p className="text-sm text-default-600 mb-4 font-mono">
              {error.message}
            </p>
          )}
          {error.digest && (
            <p className="text-xs text-default-400 mb-4">
              Error ID: {error.digest}
            </p>
          )}
          <Button color="primary" size="lg" variant="shadow" onPress={reset}>
            Try Again
          </Button>
        </CardBody>
      </Card>
    </section>
  );
}
