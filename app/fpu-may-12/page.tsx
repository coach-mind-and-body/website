import FPULandingPageClient from './FPULandingPageClient';

export const metadata = {
  title: "Financial Peace University | Mind and Body Reset",
  description: "Join Lee Anne's Financial Peace University group — Dave Ramsey's proven plan for budgeting, eliminating debt, and building wealth. Next cohort starts soon.",
  openGraph: {
    title: "Financial Peace University | Mind and Body Reset",
    description: "Join Lee Anne's Financial Peace University group — Dave Ramsey's proven plan for budgeting, eliminating debt, and building wealth. Next cohort starts soon.",
    url: "/fpu-may-12",
  },
  twitter: {
    title: "Financial Peace University | Mind and Body Reset",
    description: "Join Lee Anne's Financial Peace University group — Dave Ramsey's proven plan for budgeting, eliminating debt, and building wealth. Next cohort starts soon.",
  }
};

export default function Page() {
  return <FPULandingPageClient  />;
}
