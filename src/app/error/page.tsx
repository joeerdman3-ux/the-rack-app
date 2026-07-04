import Link from "next/link";

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="max-w-sm text-center">
        <h1 className="mb-2 text-2xl font-bold text-white">Something went wrong</h1>
        <p className="mb-6 text-sm text-neutral-400">
          {message ?? "Please try again."}
        </p>
        <Link href="/login" className="text-orange-500 hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
