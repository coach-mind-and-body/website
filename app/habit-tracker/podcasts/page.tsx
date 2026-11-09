import PodcastsClient from "./PodcastsClient";
import { noindexWithoutInheritedCanonical } from "@/lib/noindexMetadata";

export const metadata = noindexWithoutInheritedCanonical({
  title: { absolute: "Podcast | Mind & Body Reset Habit Tracker" },
  description:
    "Listen to the Mind and Body Reset podcast — midlife health, hormones, and food freedom with Lee Anne Chapman.",
});

export default function PodcastsPage() {
  return <PodcastsClient />;
}
