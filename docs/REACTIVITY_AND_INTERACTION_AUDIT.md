# Reactivity, Snappiness & Touch Interaction Technical Audit
**Oslo Food Discovery Radar (Smakr)**
Audit Date: 2026-11-07  
Status: Complete Inspection (Audit Only — Code Untouched)

---

## Executive Summary
This audit provides a forensic codebase analysis of the touch-event pipelines, gesture listeners, spring physics, and state updates across the Feed, Bottom Dock, Header Sheet, and Reaction buttons. It identifies the root causes behind missed clicks, input latency, sticky scrolling, and animation stutter, accompanied by exact line numbers and remediation targets.

---

## 1. Bottom Navigation Bar "Double-Tap / Missed Click" Bug
**Files:**
- `frontend/src/components/food/FoodViewSlider.tsx` (L1–L159)
- `frontend/src/components/home/HomeView.tsx` (L1255–L1275, L978–L986)

### A. Root Cause Analysis

#### 1. Framer Motion Gesture Conflict with Tap vs. Pan
In `FoodViewSlider.tsx` (L49–L70, L118–L127):
```tsx
<motion.nav
  layout
  aria-label="Feed mode navigation"
  transition={SPRING}
  className={`pointer-events-auto select-none bg-[#FAF7F2]/55 dark:bg-[#181615]/55 backdrop-blur-md border border-white/40 rounded-full p-1.5 shadow-sm flex items-center gap-1 ${className}`}
  style={{
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
    userSelect: "none",
    touchAction: "manipulation",
  }}
>
  <motion.button
    layout
    type="button"
    onClick={() => handleSelectMode("food")}
    whileTap={{ scale: 0.94 }}
    className={tabClass(isFeedActive)}
  >
```
- **The Issue:** `motion.button` with `layout` and nested `motion.span layout` registers internal pointer listeners (`pointerdown`, `pointermove`, `pointerup`). On mobile touchscreens, human fingers produce micro-displacement (1–3px) during a tap. Framer Motion's internal pan detector detects this micro-movement and cancels the synthetic `onClick` event if it considers the pointer in a drag state.
- **Result:** The first tap is swallowed by the gesture recognizer as a micro-drag; only a deliberate, motionless tap registers on the second attempt.

#### 2. Sub-44px Touch Target Size on Inactive State
In `FoodViewSlider.tsx` (L41–L46):
```tsx
const tabClass = (active: boolean) =>
  `relative z-10 flex items-center justify-center rounded-full text-[13px] font-bold cursor-pointer outline-none border-0 select-none transition-colors duration-200 h-10 ${
    active
      ? "text-white px-4"
      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white w-10 px-0"
  }`;
```
- **The Issue:** When inactive, the tab button shrinks to `w-10 h-10` (40×40px) with `px-0`. Both Apple Human Interface Guidelines and W3C WCAG 2.5.5 mandate a minimum touch target size of 44×44px (or 48×48px on Android). 
- **Result:** Finger pads touching the outer 2–4px perimeter miss the hit area entirely, falling on the parent navigation pill padding.

#### 3. React `startTransition` Deprioritizing Urgent UI Feedback
In `FoodViewSlider.tsx` (L28–L36):
```tsx
const handleSelectMode = (mode: "food" | "places" | "popups") => {
  if (feedMode === mode) return;
  startTransition(() => {
    setFeedMode(mode);
    if (mobileSheet === "peek") {
      setMobileSheet("half");
    }
  });
};
```
- **The Issue:** `startTransition` marks the state update as non-urgent. When switching from `places` to `food` (or vice-versa), React defers updating the active pill layout while it evaluates the heavier feed items list.
- **Result:** The visual button indicator does not move instantaneously on touch release, giving the user the impression that their tap was ignored, prompting an immediate second tap.

### B. Recommended Remediation
1. Remove `layout` prop from child buttons inside `FoodViewSlider.tsx`; leave layout animation strictly to `motion.div layoutId="activeFeedTabPill"`.
2. Expand inactive hit area using an invisible tap boundary: `before:absolute before:-inset-1.5 before:content-['']`.
3. Separate immediate visual state from data fetching: update local active state synchronously and run feed filtering in transition.

---

## 2. Top Area of Feed Card / Sheet Header Reactivity
**Files:**
- `frontend/src/components/home/HomeView.tsx` (L517–L576, L634–L687, L1030–L1080)
- `frontend/src/components/food/FoodPostCard.tsx` (L323–L327)

### A. Root Cause Analysis

#### 1. Header Drag Container Swallowing Child Touch Events
In `HomeView.tsx` (L1031–L1057):
```tsx
<div className="sticky top-0 z-20 bg-[#F5F0E6] ...">
  <div
    onTouchStart={handleHeaderTouchStart}
    onTouchMove={handleHeaderTouchMove}
    onTouchEnd={handleHeaderTouchEnd}
    onClick={toggleSheetState}
    className="w-full max-w-full min-w-0 pt-2 pb-1 cursor-pointer select-none rounded-t-3xl active:bg-black/[0.02] transition-colors touch-none"
  >
    <div className="w-10 h-1 rounded-full bg-zinc-300 ..." />
    <div onClick={(e) => e.stopPropagation()} className="cursor-default">
      <MascotWeeklyDrop ... />
    </div>
  </div>
  <FeedFilterBar compact />
</div>
```
- **The Issue:** While `onClick={(e) => e.stopPropagation()}` prevents sheet collapse/expand clicks from firing when clicking `<MascotWeeklyDrop>`, **`onTouchStart` and `onTouchMove` are NOT stopped**.
- In `handleHeaderTouchStart` (L517–L537):
  ```tsx
  isDraggingRef.current = true;
  hasDraggedRef.current = false;
  sheetRef.current.style.transition = "none";
  ```
  And in `handleHeaderTouchMove` (L545–L547):
  ```tsx
  if (Math.abs(delta) > 4) {
    hasDraggedRef.current = true;
  }
  ```
- **Result:** Any touch on the weekly drop capsule or top header area initiates a sheet drag immediately. If the user's finger drifts by even 4px, `hasDraggedRef.current = true`, which completely suppresses the subsequent `onClick` event on child buttons.

#### 2. Top Feed Card Drag Interception (`scrollTop <= 1`)
In `HomeView.tsx` (L648–L674):
```tsx
const handleContentTouchStart = (e: React.TouchEvent) => {
  ...
  const scrollTop = feedScrollRef.current ? feedScrollRef.current.scrollTop : 0;
  if (scrollTop <= 1) {
    contentTouchStartY.current = e.touches[0].clientY;
    dragStartTranslateYRef.current = currentYRef.current || getSnapTranslateY(mobileSheet);
    isContentPulling.current = false;
  }
};

const handleContentTouchMove = (e: React.TouchEvent) => {
  ...
  if (scrollTop <= 1) {
    const pullDown = currentY - contentTouchStartY.current;
    if (pullDown > 6) {
      isContentPulling.current = true;
      isDraggingRef.current = true;
      sheetRef.current.style.transition = "none";
      // rAF drags the sheet down
    }
  }
};
```
- **The Issue:** At the top of the feed (`scrollTop <= 1`), a downward swipe of just 6px (`pullDown > 6`) switches the gesture from feed scrolling to bottom-sheet translation.
- **Result:** Tapping or swiping anywhere on the top card (photo, price badge, or reaction buttons) triggers sheet dragging rather than triggering card actions or smooth scrolling.

### B. Recommended Remediation
1. Add `onTouchStart={(e) => e.stopPropagation()}` to interactive widgets inside the sticky header (Weekly Drop and Filter Bar).
2. Increase the content pull-down threshold from 6px to 18px with angle lock (`deltaY > 18 && Math.abs(deltaX) < 12`) to prevent accidental sheet drags when flicking or scrolling.

---

## 3. Smakr Pick Dropdown & Filter Dropdown Snappiness
**Files:**
- `frontend/src/components/food/MascotWeeklyDrop.tsx` (L283–L294)
- `frontend/src/components/filter/FeedFilterBar.tsx` (L435–L445)

### A. Root Cause Analysis

#### 1. Layout Reflow from Animating `height: "auto"`
In `MascotWeeklyDrop.tsx` (L288–L291):
```tsx
initial={{ height: 0, opacity: 0, y: -6, scale: 0.985 }}
animate={{ height: "auto", opacity: 1, y: 0, scale: 1 }}
exit={{ height: 0, opacity: 0, y: -6, scale: 0.985 }}
transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.68 }}
```
- **The Issue:** Unlike GPU transforms (`transform: translateY`, `opacity`), animating `height: "auto"` cannot run on the compositor thread. The browser must calculate `getBoundingClientRect()` on every single animation frame (~60 times per second), invalidating the layout tree of the parent sheet.
- **Compounding Factor:** Inside `MascotWeeklyDrop`, the expanded panel renders `MemoizedMascotBust` (complex vector SVG paths) and Next.js `<Image src={weeklyPick.dish_image} />`. Parsing and layout of these DOM nodes occurs simultaneously with the height spring expansion.

#### 2. Synchronous State Cascade in FeedFilterBar
In `FeedFilterBar.tsx`:
- Opening the drawer triggers `useCollapseOnFeedScroll` listeners. If the feed container emits a scroll offset tick during expansion, the collapse listener checks DOM selectors synchronously (`ignoreSelector: "[data-filter-drawer]"`), competing for the main thread.

### B. Recommended Remediation
1. Use CSS Grid row animation (`grid-template-rows: 0fr -> 1fr`) or CSS transform clips (`clip-path: inset(...)`) with fixed max-height constraints to offload height calculation from Framer Motion's JS thread.
2. Defer heavy sub-component rendering (mascot paths and full image) until the first layout frame has resolved.

---

## 4. The "Fire" Button (Hype / Reaction Button)
**Files:**
- `frontend/src/components/food/FoodPostCard.tsx` (L250–L259, L325–L326, L634–L652)
- `frontend/src/components/venue/VenueDetailPane.tsx` (L725–L743)
- `frontend/src/components/food/DishDetailPopup.tsx` (L288–L301)

### A. Root Cause Analysis

#### 1. Double-Tap Interception on Parent `<motion.article>`
In `FoodPostCard.tsx` (L323–L327):
```tsx
<motion.article
  style={{ contain: "layout paint style" }}
  onClick={handleCardClick}
  onDoubleClick={handleDoubleTap}
  className="group relative w-full rounded-[26px] ... cursor-pointer"
>
```
- **The Issue:** Binding `onDoubleClick={handleDoubleTap}` to the parent card instructs the browser (particularly iOS Safari WebKit) to delay dispatching `onClick` by 300ms to determine if a second tap is forthcoming.
- **Result:** Tapping the Fire button experiences an artificial 300ms delay. If the user taps again within that window, the browser fires `onDoubleClick` on the card instead of registering the second button tap.

#### 2. Button Hit Box Misalignment (36px Height)
In `FoodPostCard.tsx` (L634–L651):
```tsx
<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    handleToggleLike();
  }}
  className={`h-9 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
    isLiked
      ? "bg-[#E84A27] border border-[#FF7A5C] text-white shadow-[0_4px_12px_rgba(232,74,39,0.4)]"
      : "bg-[#181615]/75 border border-white/20 text-[#FAF7F2] hover:bg-[#181615]"
  }`}
  aria-label="React with fire"
>
  <Flame className={`w-3.5 h-3.5 ${isLiked ? "fill-white text-white" : "text-[#E84A27]"}`} />
  <span className="font-mono text-xs">{worthItCount}</span>
</button>
```
- **The Issue:** `h-9` is exactly 36px tall. If a user touches slightly above or below the pill (e.g. at 40px), the click target is the parent `<motion.article>`, which executes `handleCardClick` and triggers `flyToSpot(post.spot_coords, post.spot_id)`.
- **Result:** The user attempts to like the dish, but instead the map camera flies away to the venue's GPS location.

#### 3. Optimistic Update Architecture
In `FoodPostCard.tsx` (L254–L259):
```tsx
const handleToggleLike = () => {
  const nextLiked = !isLiked;
  toggleLikePost(post.id);
  const uid = useCityPulseStore.getState().currentUser?.id;
  if (uid) void setPostLike(uid, post.id, nextLiked);
};
```
- The local toggle `toggleLikePost(post.id)` is properly optimistic in the Zustand store (`likedPostIds.has(post.id)`).
- However, `worthItCount` relies on `post.likes_count`:
  ```tsx
  const worthItCount = Math.max(1, post.likes_count || 1) + (isLiked ? 1 : 0);
  ```
  If `post.likes_count` is updated from a background server fetch while the component is mounted, the count can jump asynchronously.

### B. Recommended Remediation
1. Remove `onDoubleClick` from `<motion.article>` to eliminate the 300ms tap delay.
2. Expand the Fire button hit boundary with `before:absolute before:-inset-2 before:content-['']` (expanding the tap area from 36px to 52px).
3. Add `touch-action: manipulation` directly to the reaction button classes.

---

## 5. Summary Matrix & Action Items

| Component | Target Location | Identified Bottleneck | Proposed Fix |
|---|---|---|---|
| **Bottom Navigation Dock** | `FoodViewSlider.tsx:63` | `layout` prop on buttons conflicting with micro-pan touch | Remove child `layout` props; rely solely on `layoutId` pill |
| **Bottom Dock Hit Target** | `FoodViewSlider.tsx:45` | Inactive tabs are 40×40px (`w-10 px-0`) | Enforce min 44×44px hit bounds via pseudo-element padding |
| **Feed Sheet Grab Bar** | `HomeView.tsx:1037` | `touch-none` and unstopped `onTouchStart` bubbling | Add `stopPropagation` on touch start for header child elements |
| **Top Card Pull-Down** | `HomeView.tsx:669` | `pullDown > 6` switches from card tap to sheet drag | Increase pull threshold to 18px with directional angle lock |
| **Weekly Drop Accordion** | `MascotWeeklyDrop.tsx:288` | `height: "auto"` layout thrashing on rAF | Transition to CSS Grid row or CSS clip transition |
| **Fire Reaction Button** | `FoodPostCard.tsx:326` | Card `onDoubleClick` causes 300ms delay & off-target flyTo | Remove `onDoubleClick`; add `before:-inset-2` hit area expansion |

*Audit complete. Ready for implementation planning upon user instruction.*
