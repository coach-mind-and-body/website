import FoodQuizThankYouClient from "./FoodQuizThankYouClient";

export const metadata = {
  title: "Your Quiz Results",
  description: "Your personalized food and mindset quiz results.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <FoodQuizThankYouClient />;
}
