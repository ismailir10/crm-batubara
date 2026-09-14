import { describe, expect, it } from "vitest";
import { SLIDES } from "@/app/presentation/slides";

describe("presentation deck", () => {
  it("has the slide count the end-to-end tests assume", () => {
    // e2e/journey.spec.ts asserts the slide counter; keep the two in step.
    expect(SLIDES).toHaveLength(18);
  });

  it("gives every slide a unique id", () => {
    const ids = SLIDES.map((slide) => slide.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every slide a title for the counter and the printed handout", () => {
    for (const slide of SLIDES) {
      expect(slide.title.trim().length).toBeGreaterThan(0);
    }
  });

  it("opens on the cover and closes on the next-steps slide", () => {
    expect(SLIDES[0].id).toBe("cover");
    expect(SLIDES[SLIDES.length - 1].id).toBe("demo");
  });
});
