// Node (jsdom) project setup: unmount every rendered tree after each test.
// Without this, @testing-library/react's render leaks its container (no
// `globals`/auto-cleanup is configured), so a reused worker fork accumulates
// DOM across its ~15 test files and OOMs its fixed 4 GB heap.
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
