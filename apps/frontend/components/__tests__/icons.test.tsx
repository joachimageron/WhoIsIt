import { render } from "@testing-library/react";

import {
  Logo,
  SunFilledIcon,
  MoonFilledIcon,
  GithubIcon,
  TwitterIcon,
  DiscordIcon,
  HeartFilledIcon,
  SearchIcon,
} from "../icons";

describe("Icon Components", () => {
  describe("Logo", () => {
    it("renders without crashing", () => {
      const { container } = render(<Logo />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("applies custom size", () => {
      const { container } = render(<Logo size={100} />);
      const svg = container.querySelector("svg");

      expect(svg).toHaveAttribute("width", "100");
      expect(svg).toHaveAttribute("height", "100");
    });

    it("has default size", () => {
      const { container } = render(<Logo />);
      const svg = container.querySelector("svg");

      expect(svg).toHaveAttribute("width", "36");
      expect(svg).toHaveAttribute("height", "36");
    });
  });

  describe("SunFilledIcon", () => {
    it("renders without crashing", () => {
      const { container } = render(<SunFilledIcon />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("applies custom size", () => {
      const { container } = render(<SunFilledIcon size={32} />);
      const svg = container.querySelector("svg");

      expect(svg).toHaveAttribute("width", "32");
      expect(svg).toHaveAttribute("height", "32");
    });

    it("has aria-hidden attribute for accessibility", () => {
      const { container } = render(<SunFilledIcon />);
      const svg = container.querySelector("svg");

      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("MoonFilledIcon", () => {
    it("renders without crashing", () => {
      const { container } = render(<MoonFilledIcon />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("applies custom size", () => {
      const { container } = render(<MoonFilledIcon size={24} />);
      const svg = container.querySelector("svg");

      expect(svg).toHaveAttribute("width", "24");
      expect(svg).toHaveAttribute("height", "24");
    });

    it("has proper attributes for accessibility", () => {
      const { container } = render(<MoonFilledIcon />);
      const svg = container.querySelector("svg");

      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
    });
  });

  describe("GithubIcon", () => {
    it("renders without crashing", () => {
      const { container } = render(<GithubIcon />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("applies custom size", () => {
      const { container } = render(<GithubIcon size={28} />);
      const svg = container.querySelector("svg");

      expect(svg).toHaveAttribute("width", "28");
      expect(svg).toHaveAttribute("height", "28");
    });
  });

  describe("TwitterIcon", () => {
    it("renders without crashing", () => {
      const { container } = render(<TwitterIcon />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("has default size", () => {
      const { container } = render(<TwitterIcon />);
      const svg = container.querySelector("svg");

      expect(svg).toHaveAttribute("width");
    });
  });

  describe("DiscordIcon", () => {
    it("renders without crashing", () => {
      const { container } = render(<DiscordIcon />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("applies custom size", () => {
      const { container } = render(<DiscordIcon size={20} />);
      const svg = container.querySelector("svg");

      expect(svg).toHaveAttribute("width", "20");
    });
  });

  describe("HeartFilledIcon", () => {
    it("renders without crashing", () => {
      const { container } = render(<HeartFilledIcon />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("renders path elements", () => {
      const { container } = render(<HeartFilledIcon />);
      const paths = container.querySelectorAll("path");

      expect(paths.length).toBeGreaterThan(0);
    });
  });

  describe("SearchIcon", () => {
    it("renders without crashing", () => {
      const { container } = render(<SearchIcon />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("has default em-based size", () => {
      const { container } = render(<SearchIcon />);
      const svg = container.querySelector("svg");

      expect(svg).toHaveAttribute("width", "1em");
      expect(svg).toHaveAttribute("height", "1em");
    });

    it("has proper stroke attributes on path elements", () => {
      const { container } = render(<SearchIcon />);
      const paths = container.querySelectorAll("path");

      expect(paths.length).toBeGreaterThan(0);
      // Stroke is on the path, not the svg
      expect(paths[0]).toHaveAttribute("stroke", "currentColor");
    });
  });

  describe("Icon Consistency", () => {
    const icons = [
      { component: SunFilledIcon, name: "SunFilledIcon" },
      { component: MoonFilledIcon, name: "MoonFilledIcon" },
      { component: GithubIcon, name: "GithubIcon" },
      { component: TwitterIcon, name: "TwitterIcon" },
      { component: DiscordIcon, name: "DiscordIcon" },
      { component: HeartFilledIcon, name: "HeartFilledIcon" },
    ];

    icons.forEach(({ component: Icon, name }) => {
      it(`${name} has proper SVG structure`, () => {
        const { container } = render(<Icon />);
        const svg = container.querySelector("svg");

        expect(svg).toBeInTheDocument();
        expect(svg?.tagName).toBe("svg");
      });

      it(`${name} accepts size prop`, () => {
        const { container } = render(<Icon size={30} />);
        const svg = container.querySelector("svg");

        expect(svg).toHaveAttribute("width", "30");
      });
    });
  });
});
