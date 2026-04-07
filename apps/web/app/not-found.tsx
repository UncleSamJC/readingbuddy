import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Page Not Found</h1>
      <Link href="/" className="text-primary hover:underline">
        Go Home
      </Link>
    </div>
  );
}
