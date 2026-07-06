import LoginClient from './LoginClient';

export const metadata = {
  title: "Sign In | Mind and Body Reset",
  description: "Sign in to your Mind & Body Reset account to access your coaching portal, program materials, and community resources.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <LoginClient  />;
}
