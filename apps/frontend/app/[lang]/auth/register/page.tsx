"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Link } from "@heroui/link";
import { Icon } from "@iconify/react";
import { addToast } from "@heroui/toast";

import { useAuthStore } from "@/store/auth-store";
import * as authApi from "@/lib/auth-api";
import { isValidEmail } from "@/lib/utils/validation";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setLoading, setError, clearError, isLoading, error } =
    useAuthStore();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);
  const [registrationSuccess, setRegistrationSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all required fields");

      return;
    }

    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address");

      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");

      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the terms and privacy policy");

      return;
    }

    setLoading(true);

    try {
      const user = await authApi.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName || formData.username,
      });

      setUser(user);
      setRegistrationSuccess(true);
      // Don't redirect immediately - show verification message
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    clearError();
    setIsResending(true);

    try {
      await authApi.resendVerificationEmail(formData.email);
      addToast({
        title: "Success",
        description:
          "Verification email sent successfully! Please check your inbox.",
        color: "success",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to resend verification email",
      );
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (error) {
      addToast({
        title: "Error",
        description: error,
        color: "danger",
      });
    }
  }, [error]);

  if (registrationSuccess) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="rounded-large flex w-full max-w-md flex-col gap-4 px-8 pt-6 pb-10">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full p-4">
              <Icon
                className="text-success text-5xl"
                icon="solar:check-circle-bold"
              />
            </div>
            <h2 className="text-2xl font-semibold">Registration Successful!</h2>
            <p className="text-default-500 text-center">
              We&apos;ve sent a verification email to{" "}
              <strong>{formData.email}</strong>. Please check your inbox and
              click the verification link to activate your account.
            </p>
            <div className="rounded-medium mt-2 p-4">
              <p className="text-primary-600 text-sm">
                <Icon className="inline mr-1" icon="solar:info-circle-bold" />
                Didn&apos;t receive the email? Check your spam folder or click
                below to resend.
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                color="primary"
                isLoading={isResending}
                variant="bordered"
                onPress={handleResendEmail}
              >
                Resend Email
              </Button>
              <Button color="primary" onPress={() => router.push("/")}>
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
        <p className="pb-4 text-left text-3xl font-semibold">Sign Up</p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            isRequired
            label="Username"
            labelPlacement="outside"
            name="username"
            placeholder="Enter your username"
            type="text"
            value={formData.username}
            variant="bordered"
            onChange={handleInputChange}
          />
          <Input
            isRequired
            label="Email"
            labelPlacement="outside"
            name="email"
            placeholder="Enter your email"
            type="email"
            value={formData.email}
            variant="bordered"
            onChange={handleInputChange}
          />
          <Input
            label="Display Name"
            labelPlacement="outside"
            name="displayName"
            placeholder="Enter your display name (optional)"
            type="text"
            value={formData.displayName}
            variant="bordered"
            onChange={handleInputChange}
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
            label="Password"
            labelPlacement="outside"
            name="password"
            placeholder="Enter your password"
            type={isVisible ? "text" : "password"}
            value={formData.password}
            variant="bordered"
            onChange={handleInputChange}
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
            label="Confirm Password"
            labelPlacement="outside"
            name="confirmPassword"
            placeholder="Confirm your password"
            type={isConfirmVisible ? "text" : "password"}
            value={formData.confirmPassword}
            variant="bordered"
            onChange={handleInputChange}
          />
          <Checkbox
            isRequired
            className="py-4"
            isSelected={agreedToTerms}
            size="sm"
            onValueChange={setAgreedToTerms}
          >
            I agree with the&nbsp;
            <Link className="relative z-1" href="#" size="sm">
              Terms
            </Link>
            &nbsp; and&nbsp;
            <Link className="relative z-1" href="#" size="sm">
              Privacy Policy
            </Link>
          </Checkbox>
          <Button color="primary" isLoading={isLoading} type="submit">
            Sign Up
          </Button>
        </form>
        <p className="text-small text-center">
          <Link href="/auth/login" size="sm">
            Already have an account? Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
