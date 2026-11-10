import { handleFoodLogPhotoRequest } from "@/server/foodLogPhoto";

export function GET(req: Request) {
  return handleFoodLogPhotoRequest(req);
}
