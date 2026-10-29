import MyProgramClient from "./MyProgramClient";

export const metadata = {
  title: "My Program",
  description:
    "Access your R.E.C.L.A.I.M. coaching program materials, session recordings, and progress tracking.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MyProgramClient />;
}
