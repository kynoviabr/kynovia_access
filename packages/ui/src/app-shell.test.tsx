import { describe, expect, it } from "vitest";
import { AppShell } from "./index";

describe("@kynovia/ui", () => {
  it("exports the AppShell primitive", () => {
    expect(AppShell).toBeTypeOf("function");
  });
});
