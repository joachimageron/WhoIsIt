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
import { Form } from "@heroui/form";

interface RegisterFormProps {
  dict: any;
  lang: string;
}

export function RegisterForm({ dict, lang }: RegisterFormProps) {
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
  });
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [agreeToTermsError, setAgreeToTermsError] = React.useState("");
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
      setError(dict.auth.register.fillAllFields);

      return;
    }

    if (!isValidEmail(formData.email)) {
      setError(dict.auth.register.invalidEmail);

      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(dict.auth.register.passwordsNoMatch);

      return;
    }

    if (!agreedToTerms) {
      setAgreeToTermsError(dict.auth.register.agreeToTermsError);
      return;
    }

    setLoading(true);

    try {
      const user = await authApi.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      setUser(user);
      setRegistrationSuccess(true);
      // Don't redirect immediately - show verification message
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : dict.auth.register.registrationFailed,
      );
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
        title: dict.auth.register.verificationSent,
        description: dict.auth.register.emailResent,
        color: "success",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : dict.auth.register.registrationFailed,
      );
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (error) {
      addToast({
        title: dict.auth.register.registrationFailed,
        description: error,
        color: "danger",
      });
    }
  }, [error, dict]);

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
            <h2 className="text-2xl font-semibold">
              {dict.auth.register.verificationSent}
            </h2>
            <p className="text-default-500 text-center">
              {dict.auth.register.verificationMessage.replace(
                "{email}",
                formData.email,
              )}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                color="primary"
                isLoading={isResending}
                variant="bordered"
                onPress={handleResendEmail}
              >
                {dict.auth.register.resendVerification}
              </Button>
              <Button color="primary" onPress={() => router.push(`/${lang}`)}>
                {dict.nav.home}
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
        <p className="pb-4 text-left text-3xl font-semibold">
          {dict.auth.register.title}
        </p>
        <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            autoFocus
            isRequired
            label={dict.auth.register.username}
            labelPlacement="outside"
            name="username"
            placeholder={dict.auth.register.usernamePlaceholder}
            type="text"
            value={formData.username}
            variant="bordered"
            onChange={handleInputChange}
          />
          <Input
            isRequired
            label={dict.auth.register.email}
            labelPlacement="outside"
            name="email"
            placeholder={dict.auth.register.emailPlaceholder}
            type="email"
            value={formData.email}
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
            label={dict.auth.register.password}
            labelPlacement="outside"
            name="password"
            placeholder={dict.auth.register.passwordPlaceholder}
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
            label={dict.auth.register.confirmPassword}
            labelPlacement="outside"
            name="confirmPassword"
            placeholder={dict.auth.register.confirmPasswordPlaceholder}
            type={isConfirmVisible ? "text" : "password"}
            value={formData.confirmPassword}
            variant="bordered"
            onChange={handleInputChange}
          />
          <Checkbox
            className="py-4"
            isSelected={agreedToTerms}
            size="sm"
            onValueChange={setAgreedToTerms}
          >
            {dict.auth.register.agreeToTerms}
          </Checkbox>
          {agreeToTermsError && (
            <div className="text-small text-danger">{agreeToTermsError}</div>
          )}
          <Button fullWidth color="primary" isLoading={isLoading} type="submit">
            {dict.auth.register.signUpButton}
          </Button>
        </Form>
        <p className="text-small text-center">
          <Link href={`/${lang}/auth/login`} size="sm">
            {dict.auth.register.haveAccount}
          </Link>
        </p>
      </div>
    </div>
  );
}
