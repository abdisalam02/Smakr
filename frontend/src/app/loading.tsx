import { FoodPostCardSkeleton } from "@/components/food/CardSkeletons";

export default function Loading() {
  return (
    <main className="min-h-dvh bg-[#FAF7F2] dark:bg-[#181615]" aria-busy="true">
      <div className="mx-auto max-w-xl space-y-4 p-4 pt-20">
        <div className="h-8 w-40 rounded-full bg-zinc-200/80 animate-pulse" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-24 shrink-0 rounded-full bg-zinc-200/80 animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <FoodPostCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}