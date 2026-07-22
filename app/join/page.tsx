import JoinLandingClient from './JoinLandingClient';

export const metadata = {
  title: "Join the Community | Mind and Body Reset",
  description:
    "Join the Mind & Body Reset Coaches community for free wellness tips, recipes, and support for women 40+ navigating midlife health and food freedom.",
  alternates: { canonical: "/join" },
  openGraph: {
    title: "Join the Community | Mind and Body Reset",
    description:
      "Free wellness tips and support for women 40+ — midlife health and food freedom.",
    url: "/join",
  },
};

export default function Page() {
  return <JoinLandingClient  />;
}
