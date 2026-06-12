import PodcastClient from './PodcastClient';

export const metadata = {
  title: "Mind and Body Reset Podcast | Lee Anne Chapman",
  description: "Listen to the Mind and Body Reset podcast where we talk real strategy for midlife health, hormones, weight loss, and mindset shifts for women 40+.",
  openGraph: {
    title: "Mind and Body Reset Podcast | Lee Anne Chapman",
    description: "Listen to the Mind and Body Reset podcast where we talk real strategy for midlife health, hormones, weight loss, and mindset shifts for women 40+.",
    url: "/midlife-health-podcast",
  },
  twitter: {
    title: "Mind and Body Reset Podcast | Lee Anne Chapman",
    description: "Listen to the Mind and Body Reset podcast where we talk real strategy for midlife health, hormones, weight loss, and mindset shifts for women 40+.",
  }
};

export default function Page() {
  return <PodcastClient  />;
}
