import { handleFormPhotoRequest } from "@/server/formPhoto";

export function GET(req: Request) {
  return handleFormPhotoRequest(req);
}
