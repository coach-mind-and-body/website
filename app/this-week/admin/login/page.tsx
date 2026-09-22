import { adminLogin } from "@/app/this-week/actions";
import { isAdmin } from "@/lib/weekly-pairs/auth";
import { APP_NAME } from "@/lib/weekly-pairs/config";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdmin()) redirect("/this-week/admin");
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
        {APP_NAME}
      </p>
      <h1 className="mt-2 font-display text-4xl">Admin</h1>
      <p className="mt-2 text-stone-600">Lee Anne&apos;s roster, matching, and reminders.</p>
      <form action={adminLogin} className="card mt-8 space-y-4">
        <label className="block text-sm font-medium">
          Password
          <input
            className="field mt-1"
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </label>
        {error ? <p className="text-sm text-terracotta">{error}</p> : null}
        <button className="btn-primary w-full" type="submit">
          Open admin
        </button>
      </form>
    </div>
  );
}
