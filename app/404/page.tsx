import NotFoundClient from './NotFoundClient';

export const metadata = {
  title: "Page Not Found | Mind and Body Reset",
  description: "The page you are looking for could not be found."
};

export default function Page() {
  return <NotFoundClient  />;
}
