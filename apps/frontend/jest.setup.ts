// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock framer-motion to avoid issues with dynamic imports in test environment
jest.mock("framer-motion", () => {
  const actual = jest.requireActual("framer-motion");

  return {
    ...actual,
    domAnimation: jest.fn(),
    LazyMotion: ({ children }: any) => children,
    m: {
      div: "div",
      button: "button",
      span: "span",
    },
    AnimatePresence: ({ children }: any) => children,
  };
});
