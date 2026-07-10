import JoinThankYouClient from "./JoinThankYouClient";

export const metadata = {
  title: "Welcome to the Community | Mind and Body Reset",
  description: "Welcome! Your registration is complete.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <JoinThankYouClient />;
}
