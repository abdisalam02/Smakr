import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-[#FAF7F2] text-[#181615]">
      <div className="max-w-md w-full text-center space-y-4">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#e84a27]">
          404 · Page Not Found
        </span>
        <h1 className="font-comico text-3xl font-bold tracking-tight">
          Lost in Oslo?
        </h1>
        <p className="text-sm text-[#6E655F]">
          The dish, venue, or page you are looking for has moved or does not exist.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#e84a27] text-white text-xs font-bold hover:bg-[#d43f1f] transition-colors shadow-xs"
          >
            Back to Smakr Feed
          </Link>
        </div>
      </div>
    </main>
  );
}
