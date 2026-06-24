import { describe, it, expect } from "vitest";
import { numberField } from "../urlState";

describe("numberField serialize", () => {
  it("omits zero by default to keep links short", () => {
    const f = numberField<{ v: number }, "v">("v");
    expect(f.serialize(0)).toBeNull();
    expect(f.serialize(3.5)).toBe("3.5");
  });

  it("preserves explicit zero when keepZero is set", () => {
    const f = numberField<{ v: number }, "v">("v", { keepZero: true });
    // A 0% rate / 0% down payment is a meaningful, shareable choice.
    expect(f.serialize(0)).toBe("0");
    expect(f.serialize(10)).toBe("10");
  });

  it("drops non-finite values", () => {
    const f = numberField<{ v: number }, "v">("v", { keepZero: true });
    expect(f.serialize(Number.NaN)).toBeNull();
  });

  it("round-trips through parse", () => {
    const f = numberField<{ v: number }, "v">("v", { keepZero: true });
    const serialized = f.serialize(0);
    expect(serialized).toBe("0");
    expect(f.parse(serialized as string)).toBe(0);
  });
});
