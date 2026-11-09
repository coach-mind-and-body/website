import NotFoundClient from "./NotFoundClient";
import { noindexWithoutInheritedCanonical } from "@/lib/noindexMetadata";

export const metadata = noindexWithoutInheritedCanonical(
  {
    title: "Page Not Found | Mind and Body Reset",
    description: "The page you are looking for could not be found.",
  },
  { follow: false }
);

export default function Page() {
  return <NotFoundClient />;
}
