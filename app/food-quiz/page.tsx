import FoodQuizClient from './FoodQuizClient';

export const metadata = {
  title: "Free Food & Mindset Quiz | Mind and Body Reset",
  description: "Take this free 60-second quiz to discover what's really keeping you stuck with food and get personalized insights for your midlife health journey.",
  openGraph: {
    title: "Free Food & Mindset Quiz | Mind and Body Reset",
    description: "Take this free 60-second quiz to discover what's really keeping you stuck with food and get personalized insights for your midlife health journey.",
    url: "/food-quiz",
  },
  twitter: {
    title: "Free Food & Mindset Quiz | Mind and Body Reset",
    description: "Take this free 60-second quiz to discover what's really keeping you stuck with food and get personalized insights for your midlife health journey.",
  }
};

export default function Page() {
  return <FoodQuizClient  />;
}
