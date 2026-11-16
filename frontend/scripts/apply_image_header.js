const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/components/venue/VenueBottomSheet.tsx');
let file = fs.readFileSync(targetPath, 'utf8');
const isCrlf = file.includes('\r\n');
file = file.replace(/\r\n/g, '\n');

const oldHeaderBlock = `              {/* Sticky / Floating Top Header */}
              <div
                className={\`absolute top-0 inset-x-0 z-30 transition-all duration-200 pointer-events-none \${
                  isScrolled
                    ? "bg-[#FAF7F2]/95 dark:bg-[#181615]/95 backdrop-blur-md border-b border-[#181615]/10 dark:border-white/10 shadow-xs pt-2.5 pb-2 px-4"
                    : "bg-gradient-to-b from-black/60 via-black/25 to-transparent pt-3 pb-3 px-4"
                }\`}
              >
                {/* Centered Drag Handle Pill */}
                <div
                  onTouchStart={handleHeaderTouchStart}
                  onTouchMove={handleHeaderTouchMove}
                  onTouchEnd={handleHeaderTouchEnd}
                  className="w-full flex justify-center pb-1.5 cursor-grab active:cursor-grabbing pointer-events-auto touch-none select-none"
                >
                  <div
                    className={\`w-10 h-1 rounded-full transition-colors \${
                      isScrolled
                        ? "bg-zinc-300 dark:bg-zinc-600"
                        : "bg-white/80 dark:bg-white/60 shadow-xs"
                    }\`}
                  />
                </div>

                <div className="w-full flex items-center justify-between gap-3 min-h-[36px]">
                  {/* Title & Address: Hidden at top of scroll, appears when scrolled */}
                  <div
                    className={\`min-w-0 flex-1 transition-all duration-200 \${
                      isScrolled
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 -translate-y-1 pointer-events-none"
                    }\`}
                  >
                    <h3 className="font-comico text-lg sm:text-xl text-zinc-950 dark:text-white tracking-tight leading-tight truncate">
                      {selectedVenue.name}
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-[#e84a27] shrink-0" />
                      <span className="truncate">
                        {formatOsloLocation(selectedVenue.address, selectedVenue.city || selectedVenue.neighborhood).fullClean}
                      </span>
                    </p>
                  </div>

                  {/* Share & Close Buttons: Always sticky in top-right */}
                  <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto ml-auto">
                    <button
                      type="button"
                      onClick={handleShare}
                      className={\`p-2 rounded-full transition-all cursor-pointer \${
                        isScrolled
                          ? "bg-zinc-200/80 hover:bg-zinc-300 active:bg-zinc-400 text-zinc-700 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                          : "bg-black/40 hover:bg-black/60 active:bg-black/70 backdrop-blur-md text-white border border-white/20 shadow-sm"
                      }\`}
                      title="Share venue link"
                      aria-label="Share venue link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className={\`p-2 rounded-full transition-all cursor-pointer \${
                        isScrolled
                          ? "bg-zinc-200/80 hover:bg-zinc-300 active:bg-zinc-400 text-zinc-700 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                          : "bg-black/40 hover:bg-black/60 active:bg-black/70 backdrop-blur-md text-white border border-white/20 shadow-sm"
                      }\`}
                      title="Close details"
                      aria-label="Close details"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>`;

const newHeaderBlock = `              {/* Sticky / Floating Top Header with Persistent Image Background */}
              <div className="absolute top-0 inset-x-0 z-30 transition-all duration-300 pointer-events-none pt-2.5 pb-2.5 px-4 overflow-hidden rounded-t-3xl">
                {/* Background 1: The restaurant image itself with frosted dark glass scrim when scrolled */}
                {selectedVenue.cover_image_url && (
                  <div
                    className={\`absolute inset-0 transition-opacity duration-300 pointer-events-none \${
                      isScrolled ? "opacity-100" : "opacity-0"
                    }\`}
                  >
                    <Image
                      src={selectedVenue.cover_image_url}
                      alt=""
                      fill
                      className="object-cover object-top scale-105"
                      sizes="600px"
                      priority
                    />
                    {/* Deep frosted blur scrim: preserves image texture & palette while keeping text/controls high-contrast */}
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-xl border-b border-white/15" />
                  </div>
                )}

                {/* Background 2: Soft top gradient scrim when resting at top of scroll */}
                <div
                  className={\`absolute inset-0 bg-gradient-to-b from-black/75 via-black/35 to-transparent transition-opacity duration-300 pointer-events-none \${
                    isScrolled ? "opacity-0" : "opacity-100"
                  }\`}
                />

                {/* Relative content layer */}
                <div className="relative z-10 w-full flex flex-col">
                  {/* Centered Drag Handle Pill */}
                  <div
                    onTouchStart={handleHeaderTouchStart}
                    onTouchMove={handleHeaderTouchMove}
                    onTouchEnd={handleHeaderTouchEnd}
                    className="w-full flex justify-center pb-1.5 cursor-grab active:cursor-grabbing pointer-events-auto touch-none select-none"
                  >
                    <div className="w-10 h-1 rounded-full bg-white/75 shadow-xs transition-colors" />
                  </div>

                  <div className="w-full flex items-center justify-between gap-3 min-h-[36px]">
                    {/* Title & Address: Hidden at top of scroll, appears in crisp white text over image when scrolled */}
                    <div
                      className={\`min-w-0 flex-1 transition-all duration-300 \${
                        isScrolled
                          ? "opacity-100 translate-y-0 pointer-events-auto"
                          : "opacity-0 -translate-y-1 pointer-events-none"
                      }\`}
                    >
                      <h3 className="font-comico text-lg sm:text-xl text-white tracking-tight leading-tight truncate drop-shadow-md">
                        {selectedVenue.name}
                      </h3>
                      <p className="text-[11px] text-white/80 mt-0.5 flex items-center gap-1 truncate drop-shadow-xs">
                        <MapPin className="w-3 h-3 text-[#e84a27] shrink-0" />
                        <span className="truncate">
                          {formatOsloLocation(selectedVenue.address, selectedVenue.city || selectedVenue.neighborhood).fullClean}
                        </span>
                      </p>
                    </div>

                    {/* Share & Close Buttons: Sleek translucent frosted glass over image */}
                    <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto ml-auto">
                      <button
                        type="button"
                        onClick={handleShare}
                        className="p-2 rounded-full bg-black/40 hover:bg-black/60 active:bg-black/80 backdrop-blur-md text-white border border-white/20 shadow-sm transition-all cursor-pointer"
                        title="Share venue link"
                        aria-label="Share venue link"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 rounded-full bg-black/40 hover:bg-black/60 active:bg-black/80 backdrop-blur-md text-white border border-white/20 shadow-sm transition-all cursor-pointer"
                        title="Close details"
                        aria-label="Close details"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>`;

if (!file.includes(oldHeaderBlock)) {
  throw new Error('oldHeaderBlock not found');
}
file = file.replace(oldHeaderBlock, newHeaderBlock);

if (isCrlf) {
  file = file.replace(/\n/g, '\r\n');
}
fs.writeFileSync(targetPath, file, 'utf8');
console.log('Successfully updated VenueBottomSheet with persistent image background header.');
