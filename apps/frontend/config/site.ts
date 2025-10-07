export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "WhoIsIt",
  description:
    "A realtime Who Is It? experience built with HeroUI, Socket.IO and NestJS.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Docs",
      href: "/docs",
    },
    {
      label: "Pricing",
      href: "/pricing",
    },
    {
      label: "Blog",
      href: "/blog",
    },
    {
      label: "About",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Calendar",
      href: "/calendar",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/agero/WhoIsIt",
    twitter: "https://twitter.com",
    docs: "https://github.com/agero/WhoIsIt/blob/main/README.md",
    discord: "https://discord.gg",
    sponsor: "https://github.com/sponsors",
  },
};
