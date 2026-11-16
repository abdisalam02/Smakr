const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/components/venue/VenueDetailPane.tsx');
let file = fs.readFileSync(targetPath, 'utf8');
const isCrlf = file.includes('\r\n');
file = file.replace(/\r\n/g, '\n');

// 1. Remove Sparkles and Foodie Radar Verified from Dishes section
const oldHeader = `            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#e84a27]" />
                <span>
                  {isPopup
                    ? \`Pop-Up Drop Dishes (\${recommendedMeals.length})\`
                    : \`Dishes You Can't Miss (\${recommendedMeals.length})\`}
                </span>
              </h2>
              <span className="text-[10px] font-mono text-zinc-400">
                Foodie Radar Verified
              </span>
            </div>`;

const newHeader = `            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--foreground)]">
                {isPopup
                  ? \`Pop-Up Drop Dishes (\${recommendedMeals.length})\`
                  : \`Dishes You Can't Miss (\${recommendedMeals.length})\`}
              </h2>
            </div>`;

if (!file.includes(oldHeader)) {
  throw new Error('oldHeader not found in VenueDetailPane');
}
file = file.replace(oldHeader, newHeader);

// 2. Dish title: orange text in font-comico, inline taste tags & bookmark
const oldCardBottom = `                    <div className="flex-1 min-w-0 flex flex-col pt-2">
                      <h3 className="text-sm font-bold text-[var(--foreground)] truncate leading-snug">
                        {dish.dish_name}
                      </h3>

                      {noteText && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 italic">
                          <span className="text-[#E84A27] font-bold not-italic mr-1">✦</span>
                          &ldquo;{noteText}&rdquo;
                        </p>
                      )}

                      <div className="mt-auto pt-2 flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLikePost(dish.id);
                          }}
                          className={\`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold transition-all active:scale-95 \${
                            isLiked
                              ? "bg-[#e84a27] text-white border-[#e84a27]"
                              : "bg-[var(--surface-raised)] text-zinc-700 border-[var(--surface-border)] hover:bg-zinc-100"
                          }\`}
                          title="Worth it"
                        >
                          <Flame
                            className={\`w-3 h-3 \${
                              isLiked ? "fill-white text-white" : "text-[#E84A27]"
                            }\`}
                          />
                          <span className="font-mono">{Math.max(1, dish.likes_count || 1)}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSavePost(dish.id);
                          }}
                          className={\`p-1.5 rounded-full border transition-all active:scale-95 \${
                            isSaved
                              ? "bg-zinc-900 text-white border-zinc-900"
                              : "bg-[var(--surface-raised)] text-zinc-500 border-[var(--surface-border)] hover:bg-zinc-100"
                          }\`}
                          title={isSaved ? "Saved to your list" : "Save dish"}
                        >
                          <Bookmark
                            className={\`w-3 h-3 \${isSaved ? "fill-current" : ""}\`}
                          />
                        </button>
                      </div>
                    </div>`;

const newCardBottom = `                    <div className="flex-1 min-w-0 flex flex-col pt-2">
                      <h3 className="font-comico text-xs sm:text-sm text-[#e84a27] font-bold truncate leading-snug">
                        {dish.dish_name}
                      </h3>

                      {noteText && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 italic">
                          <span className="text-[#E84A27] font-bold not-italic mr-1">✦</span>
                          &ldquo;{noteText}&rdquo;
                        </p>
                      )}

                      <div className="mt-auto pt-2 flex items-center justify-between gap-1.5">
                        <div className="flex flex-wrap items-center gap-1 min-w-0">
                          {dish.taste_tags && dish.taste_tags.length > 0 &&
                            dish.taste_tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 text-[9px] font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSavePost(dish.id);
                          }}
                          className={\`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 \${
                            isSaved
                              ? "bg-[#e84a27] text-white border-[#e84a27] shadow-xs"
                              : "bg-[var(--surface-raised)] text-zinc-500 hover:text-[#e84a27] border-[var(--surface-border)] hover:bg-zinc-100"
                          }\`}
                          title={isSaved ? "Saved to your list" : "Save dish"}
                          aria-label={isSaved ? "Saved to your list" : "Save dish"}
                        >
                          <Bookmark
                            className={\`w-3.5 h-3.5 \${isSaved ? "fill-current" : ""}\`}
                          />
                        </button>
                      </div>
                    </div>`;

if (!file.includes(oldCardBottom)) {
  throw new Error('oldCardBottom not found in VenueDetailPane');
}
file = file.replace(oldCardBottom, newCardBottom);

if (isCrlf) {
  file = file.replace(/\n/g, '\r\n');
}
fs.writeFileSync(targetPath, file, 'utf8');
console.log('VenueDetailPane.tsx updated successfully.');
