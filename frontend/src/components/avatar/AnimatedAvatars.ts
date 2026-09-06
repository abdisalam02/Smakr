import { AvatarOption } from "@/types";

/**
 * Lordicon Interactive Foodie & Coffee Barista / Sipper
 * Dual-tone motion graphics vector with animated arm lifting coffee cup, curling steam wisps, and contented closed eyes.
 * Ground ripples and core dot are centered with exact mathematical precision directly under the soles of the barista's shoes.
 */
function renderLordiconBaristaHTML(): string {
  return `
    <div style="
      position: relative;
      width: 76px;
      height: 114px;
      pointer-events: none;
      user-select: none;
    ">
      <!-- Minimalist 'You're here' Speech Bubble -->
      <div style="
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(24, 24, 27, 0.95);
        backdrop-filter: blur(8px);
        color: #ffffff;
        font-size: 10px;
        font-weight: 700;
        padding: 3px 9px;
        border-radius: 999px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
        border: 1px solid rgba(255,255,255,0.18);
        letter-spacing: -0.01em;
        animation: avatarPillFloat 2.6s ease-in-out infinite alternate;
        z-index: 10;
      ">
        <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #ff5500; box-shadow: 0 0 8px #ff5500;"></span>
        <span>You're here</span>
      </div>

      <!-- Ground Beacon & Radar Rings (Center X = 38px, Ground Y = 110px) -->
      <div style="
        position: absolute;
        bottom: 0px;
        left: 50%;
        transform: translateX(-50%);
        width: 50px;
        height: 16px;
        pointer-events: none;
        z-index: 1;
      ">
        <!-- Expanding Radar Ring 1 -->
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid #ff5500;
          animation: pingAura 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>

        <!-- Expanding Radar Ring 2 (Staggered) -->
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px solid #ff7722;
          animation: pingAura 2.2s cubic-bezier(0, 0, 0.2, 1) infinite 0.7s;
        "></div>

        <!-- Ground Soft Contact Shadow (Right under the shoes) -->
        <div style="
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 36px;
          height: 8px;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 72%);
          border-radius: 50%;
        "></div>

        <!-- Precise GPS Core Dot (Right at the center between feet) -->
        <div style="
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 4px;
          border-radius: 50%;
          background: #ff5500;
          box-shadow: 0 0 6px #ff5500;
        "></div>
      </div>

      <!-- Character Stage (Sits precisely on the ground baseline) -->
      <div style="
        position: absolute;
        bottom: 4px;
        left: 50%;
        transform: translateX(-50%);
        width: 70px;
        height: 84px;
        z-index: 2;
      ">
        <!-- Lordicon Vector Motion Graphics SVG (viewBox 0 0 70 84, centered at X=35, soles touch Y=84) -->
        <svg
          viewBox="0 0 70 84"
          width="70"
          height="84"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style="overflow: visible; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.18));"
        >
          <!-- Torso & Legs -->
          <g>
            <!-- Legs & Boots (Soles at Y=84, symmetrically spaced around Center X=35) -->
            <!-- Left Leg & Boot (X: 23 to 31, center 27) -->
            <path d="M 28 66 L 28 83 L 23 84" stroke="#18181b" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 22 84 C 22 82 29 82 31 84 Z" fill="#18181b" stroke="#18181b" stroke-width="1.8" />

            <!-- Right Leg & Boot (X: 39 to 47, center 43) -->
            <!-- Center between boots: (27 + 43)/2 = 35.0 EXACT! -->
            <path d="M 42 66 L 42 83 L 47 84" stroke="#18181b" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 39 84 C 39 82 46 82 48 84 Z" fill="#18181b" stroke="#18181b" stroke-width="1.8" />

            <!-- Barista Apron Body (Width 20, centered at X=35) -->
            <path d="M 25 43 C 24 50 25 66 27 67 L 43 67 C 45 66 46 50 45 43 Z" fill="#ffffff" stroke="#18181b" stroke-width="2.6" stroke-linejoin="round" />
            <!-- Orange Apron Neck Loop & Pocket -->
            <path d="M 29 43 L 35 50 L 41 43" stroke="#ff5500" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
            <rect x="29" y="56" width="12" height="8" rx="2" fill="#fff7ed" stroke="#ff5500" stroke-width="1.8" />
            <!-- Barista Spoon / Pen in pocket -->
            <line x1="33" y1="53" x2="33" y2="57" stroke="#18181b" stroke-width="1.8" stroke-linecap="round" />

            <!-- Left Arm Resting on Hip -->
            <path d="M 25 44 Q 19 50 23 56" stroke="#18181b" stroke-width="2.6" stroke-linecap="round" />
          </g>

          <!-- Head & Face (Centered at X=35) -->
          <g>
            <!-- Neck -->
            <rect x="32" y="36" width="6" height="7" fill="#fed7aa" stroke="#18181b" stroke-width="2" />

            <!-- Head Face (Width 22, X: 24 to 46, center 35) -->
            <rect x="24" y="14" width="22" height="23" rx="11" fill="#fed7aa" stroke="#18181b" stroke-width="2.6" />

            <!-- Barista Cap (Electric Orange Flat Cap, centered at X=35) -->
            <path d="M 21 16 C 23 7 47 7 49 16 Z" fill="#ff5500" stroke="#18181b" stroke-width="2.4" stroke-linejoin="round" />
            <!-- Cap Visor -->
            <path d="M 19 17 C 25 14 45 14 51 17" stroke="#18181b" stroke-width="2.6" stroke-linecap="round" />
            <!-- Cap Button -->
            <circle cx="35" cy="8" r="2.2" fill="#18181b" />

            <!-- Animated Delight Eyes (Closes into happy arcs when sipping) -->
            <g style="transform-origin: 35px 24px; animation: lordiconEyeSip 3.2s ease-in-out infinite;">
              <circle cx="30" cy="24" r="1.6" fill="#18181b" />
              <circle cx="40" cy="24" r="1.6" fill="#18181b" />
            </g>

            <!-- Barista Smile / Mustache -->
            <path d="M 32 30 Q 35 32 38 30" stroke="#18181b" stroke-width="2" stroke-linecap="round" />
          </g>

          <!-- The Animated Sipping Arm with Steaming Coffee Cup -->
          <g style="transform-origin: 45px 46px; animation: lordiconSipArm 3.2s ease-in-out infinite;">
            <!-- Upper arm & Forearm holding cup -->
            <path d="M 45 44 Q 53 48 56 52 L 51 50" stroke="#18181b" stroke-width="2.6" stroke-linecap="round" />

            <!-- Coffee Mug (Vibrant Neon Orange with White Rim) -->
            <g transform="translate(43, 42)">
              <!-- Mug Body -->
              <rect x="0" y="3" width="10" height="9" rx="2" fill="#ff5500" stroke="#18181b" stroke-width="2" />
              <!-- Mug Handle -->
              <path d="M 10 5 C 13 5 13 9 10 9" stroke="#18181b" stroke-width="1.8" fill="none" />
              <!-- Steaming Coffee Surface -->
              <ellipse cx="5" cy="3" rx="5" ry="1.5" fill="#ffffff" stroke="#18181b" stroke-width="1.2" />

              <!-- Animated Rising Steam Curls -->
              <path
                d="M 3 1 Q 1 -3 3 -6 T 3 -10"
                stroke="#ff5500"
                stroke-width="1.6"
                fill="none"
                stroke-linecap="round"
                style="animation: lordiconSteamRise 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;"
              />
              <path
                d="M 7 1 Q 9 -3 7 -6 T 7 -10"
                stroke="#fb923c"
                stroke-width="1.6"
                fill="none"
                stroke-linecap="round"
                style="animation: lordiconSteamRise 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.7s;"
              />
            </g>
          </g>
        </svg>
      </div>
    </div>
  `;
}

/**
 * Creates the DOM element for MapLibre Marker for Lordicon Barista.
 * Anchored at 'bottom' with ground ripple precisely at the anchor coordinates.
 */
export function createAvatarElement(_option?: AvatarOption): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "maplibregl-marker smakr-avatar-marker avatar-lordicon";
  root.style.position = "absolute";
  root.style.top = "0";
  root.style.left = "0";
  root.style.width = "76px";
  root.style.height = "114px";
  root.style.cursor = "default";
  root.style.userSelect = "none";
  root.style.zIndex = "50";
  root.style.pointerEvents = "none"; // User cannot drag or click the marker itself

  root.innerHTML = renderLordiconBaristaHTML();
  return root;
}
