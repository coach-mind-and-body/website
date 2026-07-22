import BlogEditorClient from './BlogEditorClient';

export const metadata = {
  title: "Blog Editor | Mind and Body Reset",
  description: "Create and edit blog posts for the Mind & Body Reset Coaches health and wellness blog.",
  keywords: "blog editor, content management, blog post",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <BlogEditorClient  />;
}
