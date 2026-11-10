import { describe, expect, it } from "vitest";
import { coachFoodLogPhotoSrc, privateFoodLogPhotoSrc } from "./foodLogPhoto";

describe("coach food log photos", () => {
  it("sends a scanned page through the private photo route", () => {
    const key = "food-logs/42/page.jpg";
    expect(privateFoodLogPhotoSrc(key)).toBe("/api/food-log-photo?key=food-logs%2F42%2Fpage.jpg");
    expect(coachFoodLogPhotoSrc(key)).toBe("/api/food-log-photo?key=food-logs%2F42%2Fpage.jpg");
  });

  it("does not turn a public web address into that private route", () => {
    expect(coachFoodLogPhotoSrc("https://cdn.example/plate.jpg")).toBe("https://cdn.example/plate.jpg");
    expect(coachFoodLogPhotoSrc("/photos/plate.jpg")).toBe("/photos/plate.jpg");
  });

  it("hides a key that is not a food-log photo", () => {
    expect(coachFoodLogPhotoSrc("food-logs/not-a-photo")).toBeNull();
    expect(coachFoodLogPhotoSrc("")).toBeNull();
    expect(coachFoodLogPhotoSrc(null)).toBeNull();
  });
});
