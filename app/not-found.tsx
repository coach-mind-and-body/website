import NotFoundClient from "./404/NotFoundClient";
import { noindexWithoutInheritedCanonical } from "@/lib/noindexMetadata";

export const metadata = noindexWithoutInheritedCanonical(
  {
    title: "Page Not Found",
    description: "The page you are looking for could not be found.",
  },
  { follow: false }
);

export default function NotFound() {
  return <NotFoundClient />;
}
