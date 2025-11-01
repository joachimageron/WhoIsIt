"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card } from "@heroui/card";
import { Icon } from "@iconify/react";
import { addToast } from "@heroui/toast";
import { Chip } from "@heroui/chip";

import { useAuthStore } from "@/store/auth-store";
import * as authApi from "@/lib/auth-api";
import { isValidEmail } from "@/lib/utils/validation";

interface ProfileFormProps {
  dict: any;
  lang: string;
}

export function ProfileForm({ dict, lang }: ProfileFormProps) {
  const router = useRouter();
  const { user, setUser, isAuthenticated } = useAuthStore();
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = React.useState(false);
  const [isResendingVerification, setIsResendingVerification] =
    React.useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = React.useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    React.useState(false);

  const [profileData, setProfileData] = React.useState({
    username: "",
    email: "",
    avatarUrl: "",
  });

  const [passwordData, setPasswordData] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Initialize form with user data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${lang}/auth/login`);

      return;
    }

    if (user) {
      setProfileData({
        username: user.username || "",
        email: user.email || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user, isAuthenticated, router, lang]);

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!profileData.username || profileData.username.length < 3) {
      addToast({
        color: "danger",
        title: dict.auth.profile.updateFailed,
        description: dict.auth.profile.invalidUsername,
      });

      return;
    }

    if (profileData.email && !isValidEmail(profileData.email)) {
      addToast({
        color: "danger",
        title: dict.auth.profile.updateFailed,
        description: dict.auth.profile.invalidEmail,
      });

      return;
    }

    if (
      profileData.avatarUrl &&
      profileData.avatarUrl.trim() !== "" &&
      !profileData.avatarUrl.startsWith("http") &&
      !profileData.avatarUrl.startsWith("/")
    ) {
      addToast({
        color: "danger",
        title: dict.auth.profile.updateFailed,
        description: dict.auth.profile.invalidAvatarUrl,
      });

      return;
    }

    setIsLoadingProfile(true);

    try {
      const updatedUser = await authApi.updateProfile({
        username: profileData.username,
        email: profileData.email || undefined,
        avatarUrl: profileData.avatarUrl || undefined,
      });

      setUser(updatedUser);

      addToast({
        color: "success",
        title: dict.auth.profile.updateSuccess,
        description:
          updatedUser.email !== user?.email
            ? dict.auth.profile.emailVerificationRequired
            : "",
      });
    } catch (err) {
      addToast({
        color: "danger",
        title: dict.auth.profile.updateFailed,
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      addToast({
        color: "danger",
        title: dict.auth.profile.passwordChangeFailed,
        description: dict.auth.profile.fillAllFields,
      });

      return;
    }

    if (passwordData.newPassword.length < 6) {
      addToast({
        color: "danger",
        title: dict.auth.profile.passwordChangeFailed,
        description: dict.auth.profile.passwordTooShort,
      });

      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast({
        color: "danger",
        title: dict.auth.profile.passwordChangeFailed,
        description: dict.auth.profile.passwordsNoMatch,
      });

      return;
    }

    setIsLoadingPassword(true);

    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      addToast({
        color: "success",
        title: dict.auth.profile.passwordChangeSuccess,
        description: "",
      });

      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      addToast({
        color: "danger",
        title: dict.auth.profile.passwordChangeFailed,
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) {
      return;
    }

    setIsResendingVerification(true);

    try {
      await authApi.resendVerificationEmail(user.email);

      addToast({
        color: "success",
        title: dict.auth.profile.verificationEmailSent,
        description: "",
      });
    } catch (err) {
      addToast({
        color: "danger",
        title: dict.auth.profile.verificationEmailFailed,
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  if (!user || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-full w-full items-center justify-center py-8">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-semibold text-center">
          {dict.auth.profile.title}
        </h1>

        {/* Profile Information Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {dict.auth.profile.updateProfile}
          </h2>
          <form className="flex flex-col gap-4" onSubmit={handleProfileSubmit}>
            <Input
              isRequired
              label={dict.auth.profile.username}
              labelPlacement="outside"
              name="username"
              placeholder={dict.auth.profile.usernamePlaceholder}
              type="text"
              value={profileData.username}
              variant="bordered"
              onChange={handleProfileInputChange}
            />
            <Input
              label={dict.auth.profile.email}
              labelPlacement="outside"
              name="email"
              placeholder={dict.auth.profile.emailPlaceholder}
              type="email"
              value={profileData.email}
              variant="bordered"
              onChange={handleProfileInputChange}
            />
            {/* Email Verification Status */}
            {!user.isGuest && user.email && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {user.emailVerified ? (
                    <Chip
                      color="success"
                      startContent={<Icon icon="solar:check-circle-bold" />}
                      variant="flat"
                    >
                      {dict.auth.profile.emailVerified}
                    </Chip>
                  ) : (
                    <Chip
                      color="warning"
                      startContent={<Icon icon="solar:danger-circle-bold" />}
                      variant="flat"
                    >
                      {dict.auth.profile.emailNotVerified}
                    </Chip>
                  )}
                </div>
                {!user.emailVerified && (
                  <Button
                    color="primary"
                    isLoading={isResendingVerification}
                    size="sm"
                    variant="flat"
                    onPress={handleResendVerification}
                  >
                    {isResendingVerification
                      ? dict.auth.profile.resendingVerification
                      : dict.auth.profile.resendVerification}
                  </Button>
                )}
              </div>
            )}
            <Input
              label={dict.auth.profile.avatarUrl}
              labelPlacement="outside"
              name="avatarUrl"
              placeholder={dict.auth.profile.avatarUrlPlaceholder}
              type="text"
              value={profileData.avatarUrl}
              variant="bordered"
              onChange={handleProfileInputChange}
            />
            <Button
              className="w-full"
              color="primary"
              isLoading={isLoadingProfile}
              type="submit"
            >
              {isLoadingProfile
                ? dict.auth.profile.updating
                : dict.auth.profile.updateProfile}
            </Button>
          </form>
        </Card>

        {/* Change Password Card */}
        {!user.isGuest && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {dict.auth.profile.changePassword}
            </h2>
            <form
              className="flex flex-col gap-4"
              onSubmit={handlePasswordSubmit}
            >
              <Input
                isRequired
                endContent={
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? (
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
                label={dict.auth.profile.currentPassword}
                labelPlacement="outside"
                name="currentPassword"
                placeholder={dict.auth.profile.currentPasswordPlaceholder}
                type={isPasswordVisible ? "text" : "password"}
                value={passwordData.currentPassword}
                variant="bordered"
                onChange={handlePasswordInputChange}
              />
              <Input
                isRequired
                endContent={
                  <button
                    type="button"
                    onClick={() =>
                      setIsNewPasswordVisible(!isNewPasswordVisible)
                    }
                  >
                    {isNewPasswordVisible ? (
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
                label={dict.auth.profile.newPassword}
                labelPlacement="outside"
                name="newPassword"
                placeholder={dict.auth.profile.newPasswordPlaceholder}
                type={isNewPasswordVisible ? "text" : "password"}
                value={passwordData.newPassword}
                variant="bordered"
                onChange={handlePasswordInputChange}
              />
              <Input
                isRequired
                endContent={
                  <button
                    type="button"
                    onClick={() =>
                      setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                    }
                  >
                    {isConfirmPasswordVisible ? (
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
                label={dict.auth.profile.confirmPassword}
                labelPlacement="outside"
                name="confirmPassword"
                placeholder={dict.auth.profile.confirmPasswordPlaceholder}
                type={isConfirmPasswordVisible ? "text" : "password"}
                value={passwordData.confirmPassword}
                variant="bordered"
                onChange={handlePasswordInputChange}
              />
              <Button
                className="w-full"
                color="primary"
                isLoading={isLoadingPassword}
                type="submit"
              >
                {isLoadingPassword
                  ? dict.auth.profile.changing
                  : dict.auth.profile.changePassword}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
