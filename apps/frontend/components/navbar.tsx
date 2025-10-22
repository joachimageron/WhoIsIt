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
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import { Listbox, ListboxItem } from "@heroui/listbox";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  TwitterIcon,
  GithubIcon,
  DiscordIcon,
  SearchIcon,
  Logo,
} from "@/components/icons";
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
    { label: dict.nav.home, href: `/${lang}` },
    { label: dict.nav.docs, href: `/${lang}/docs` },
    { label: dict.nav.pricing, href: `/${lang}/pricing` },
    { label: dict.nav.blog, href: `/${lang}/blog` },
    { label: dict.nav.about, href: `/${lang}/about` },
  ];

  const navMenuItems = [
    { label: dict.nav.profile, href: `/${lang}/profile` },
    { label: dict.nav.dashboard, href: `/${lang}/dashboard` },
    { label: dict.nav.projects, href: `/${lang}/projects` },
    { label: dict.nav.team, href: `/${lang}/team` },
    { label: dict.nav.calendar, href: `/${lang}/calendar` },
    { label: dict.nav.settings, href: `/${lang}/settings` },
    { label: dict.nav.helpFeedback, href: `/${lang}/help-feedback` },
    { label: dict.nav.logout, href: `/${lang}/logout` },
  ];

  const searchInput = (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="Search..."
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
    />
  );

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink
            className="flex justify-start items-center gap-1"
            href={`/${lang}`}
          >
            <Logo />
            <p className="font-bold text-inherit">ACME</p>
          </NextLink>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-4 justify-start ml-2">
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
          <Link isExternal aria-label="Twitter" href={siteConfig.links.twitter}>
            <TwitterIcon className="text-default-500" />
          </Link>
          <Link isExternal aria-label="Discord" href={siteConfig.links.discord}>
            <DiscordIcon className="text-default-500" />
          </Link>
          <Link isExternal aria-label="Github" href={siteConfig.links.github}>
            <GithubIcon className="text-default-500" />
          </Link>
          <ThemeSwitch />
          <LanguageSwitcher currentLang={lang} />
        </NavbarItem>
        <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>
        <NavbarItem className="hidden md:flex">
          {isAuthenticated && user ? (
            <Tooltip
              content={
                <div className="px-1 py-2">
                  <Listbox
                    aria-label="User Actions"
                    onAction={(key) => {
                      if (key === "logout") {
                        handleLogout();
                      }
                    }}
                  >
                    <ListboxItem key="profile" className="h-14 gap-2">
                      <p className="font-semibold">{dict.auth.signedInAs}</p>
                      <p className="font-semibold">{user.email}</p>
                    </ListboxItem>
                    <ListboxItem key="settings">
                      {dict.nav.settings}
                    </ListboxItem>
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
                name={user.displayName}
                size="sm"
                src={user.avatarUrl || undefined}
              />
            </Tooltip>
          ) : (
            <>
              <Button
                as={NextLink}
                className="text-sm font-normal text-default-600"
                href={`/${lang}/auth/login`}
                variant="flat"
              >
                {dict.nav.login}
              </Button>
              <Button
                as={NextLink}
                className="text-sm font-normal"
                color="primary"
                href={`/${lang}/auth/register`}
                variant="flat"
              >
                {dict.nav.signUp}
              </Button>
            </>
          )}
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <Link isExternal aria-label="Github" href={siteConfig.links.github}>
          <GithubIcon className="text-default-500" />
        </Link>
        <ThemeSwitch />
        <LanguageSwitcher currentLang={lang} />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        {searchInput}
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
                  <p className="font-semibold">{user.displayName}</p>
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
