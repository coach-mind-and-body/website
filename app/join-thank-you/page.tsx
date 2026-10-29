import JoinThankYouClient from "./JoinThankYouClient";

export const metadata = {
  title: "Welcome to the Community",
  description: "Welcome! Your registration is complete.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <JoinThankYouClient />;
}
