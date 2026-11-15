export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF7F2] select-none overflow-hidden"
    >
      <div className="absolute inset-x-4 top-[24%] sm:top-[22%] flex flex-col items-center text-center pointer-events-none">
        <div className="flex items-baseline gap-2.5 sm:gap-3">
          <span className="font-comico text-5xl sm:text-6xl md:text-7xl tracking-wide text-[#e84a27] drop-shadow-[0_4px_0_rgba(43,24,16,0.14)]">
            SMAKR
          </span>
          <span className="text-[10px] sm:text-xs font-sans font-bold tracking-[0.22em] uppercase text-[#181615]/55">
            OSLO
          </span>
        </div>
      </div>
    </main>
  );
}