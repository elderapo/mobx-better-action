import { main } from "../main";

describe("main", () => {
  it("should return promise", async () => {
    expect(main()).toBeInstanceOf(Promise);
  });

  it("should returned promise resolve to undefined", async () => {
    await expect(main()).resolves.toBe(undefined);
  });
});
