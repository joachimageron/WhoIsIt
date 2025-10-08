"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Link } from "@heroui/link";
import { Icon } from "@iconify/react";

import { useAuthStore } from "@/store/auth-store";
import * as authApi from "@/lib/auth-api";
import { isValidEmail } from "@/lib/utils/validation";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setLoading, setError, clearError, isLoading, error } =
    useAuthStore();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);
  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);

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
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
        <p className="pb-4 text-left text-3xl font-semibold">
          Sign Up
          <span aria-label="emoji" className="ml-2" role="img">
            👋
          </span>
        </p>
        {error && (
          <div className="rounded-medium bg-danger-50 px-4 py-3 text-danger">
            {error}
          </div>
        )}
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
