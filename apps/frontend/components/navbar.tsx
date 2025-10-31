"use client";

import type { Locale } from "@/dictionaries";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Avatar } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import { Listbox, ListboxItem } from "@heroui/listbox";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";

import { ThemeSwitch } from "@/components/theme-switch";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/icons";
import { useAuth } from "@/lib/hooks/use-auth";

interface NavbarProps {
  lang: Locale;
  dict: any;
}

export const Navbar = ({ lang, dict }: NavbarProps) => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push(`/${lang}/auth/login`);
  };

  const navItems = [
    { label: dict.nav.createGame, href: `/${lang}/game/create` },
    { label: dict.nav.joinGame, href: `/${lang}/game/join` },
  ];

  const navMenuItems = [
    { label: dict.nav.createGame, href: `/${lang}/game/create` },
    { label: dict.nav.joinGame, href: `/${lang}/game/join` },
  ];

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink
            className="flex justify-start items-center gap-1"
            href={`/${lang}`}
          >
            <Logo />
            <p className="font-bold text-inherit">WhoIsIt</p>
          </NextLink>
        </NavbarBrand>
        <ul className="hidden sm:flex gap-4 justify-start ml-2">
          {navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium",
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
          <LanguageSwitcher currentLang={lang} />
        </NavbarItem>
        <NavbarItem className="hidden sm:flex">
          {isAuthenticated && user ? (
            <Tooltip
              content={
                <div className="px-1 py-2">
                  <Listbox
                    aria-label="User Actions"
                    onAction={(key) => {
                      if (key === "logout") {
                        handleLogout();
                      } else if (key === "profile") {
                        router.push(`/${lang}/profile`);
                      }
                    }}
                  >
                    <ListboxItem key="info" className="h-14 gap-2">
                      <p className="font-semibold">{dict.auth.signedInAs}</p>
                      <p className="font-semibold">{user.email}</p>
                    </ListboxItem>
                    <ListboxItem key="profile">{dict.nav.profile}</ListboxItem>
                    <ListboxItem
                      key="logout"
                      className="text-danger"
                      color="danger"
                    >
                      {dict.auth.logOut}
                    </ListboxItem>
                  </Listbox>
                </div>
              }
            >
              <Avatar
                as="button"
                className="transition-transform"
                name={user.username}
                size="sm"
                src={user.avatarUrl || undefined}
              />
            </Tooltip>
          ) : (
            <div className="flex gap-2">
              <Button as={NextLink} href={`/${lang}/auth/login`} variant="flat">
                {dict.nav.login}
              </Button>
              <Button
                as={NextLink}
                color="primary"
                href={`/${lang}/auth/register`}
                variant="flat"
              >
                {dict.nav.signUp}
              </Button>
            </div>
          )}
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <LanguageSwitcher currentLang={lang} />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item.label}-${index}`}>
              <Link
                color={
                  index === 2
                    ? "primary"
                    : index === navMenuItems.length - 1
                      ? "danger"
                      : "foreground"
                }
                href={item.href}
                size="lg"
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
          {!isAuthenticated && (
            <>
              <NavbarMenuItem>
                <Link color="primary" href={`/${lang}/auth/login`} size="lg">
                  {dict.nav.login}
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Link color="primary" href={`/${lang}/auth/register`} size="lg">
                  {dict.nav.signUp}
                </Link>
              </NavbarMenuItem>
            </>
          )}
          {isAuthenticated && user && (
            <>
              <NavbarMenuItem>
                <div className="text-small">
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-default-500">{user.email}</p>
                </div>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Link color="danger" size="lg" onPress={handleLogout}>
                  {dict.auth.logOut}
                </Link>
              </NavbarMenuItem>
            </>
          )}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
