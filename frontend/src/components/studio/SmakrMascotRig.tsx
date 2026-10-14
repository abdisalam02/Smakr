'use client';

import React, { useMemo } from 'react';
import type {
  MascotFrameMode,
  BubbleStyle,
  BubbleSide,
  MascotProp,
  MascotFx,
} from '@/types/studio';
import { DEFAULT_MASCOT_CONFIG } from '@/types/studio';
import {
  BLUSH_BODIES,
  BLUSH_HEADS,
  BLUSH_FACES,
  BLUSH_ACCESSORIES,
  BLUSH_BEARDS,
  BLUSH_PRESETS,
  type BlushComponent,
} from '@/lib/blushMascotCatalog';

export { BLUSH_BODIES, BLUSH_HEADS, BLUSH_FACES, BLUSH_ACCESSORIES, BLUSH_BEARDS, BLUSH_PRESETS };

export interface SmakrMascotRigProps {
  head?: string;
  face?: string;
  accessories?: string;
  facialHair?: string;
  skinColor?: string;
  clothingColor?: string;
  innerClothingColor?: string;
  headContrastColor?: string;
  stickerOutline?: boolean;
  frameMode?: MascotFrameMode;
  bodyPose?: string;
  bubbleText?: string;
  bubbleEyebrow?: string;
  bubbleStyle?: BubbleStyle;
  circleBg?: string;
  customMascotDataUrl?: string | null;
  flip?: boolean;
  size?: number;
  className?: string;
  // Bubble placement & closeness
  bubbleOffsetX?: number;
  bubbleOffsetY?: number;
  bubbleSide?: BubbleSide;
  bubbleScale?: number;
  // Backward compatibility
  expression?: string;
  eyewear?: string;
  shirtColor?: string;
  fx?: MascotFx;
  prop?: MascotProp;
}

/** Normalize body pose key to clean Blush body dictionary ID */
export function normalizeBlushBodyId(pose: string | undefined): string {
  if (!pose || pose === 'bust' || pose === 'classic-bust' || pose === 'Killer') {
    return 'jacket-2';
  }
  const clean = pose.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (clean === 'jacket2') return 'jacket-2';
  if (clean === 'jacket1') return 'jacket-1';
  if (clean === 'pointingup') return 'pointing-up';
  if (clean === 'whatever') return 'shrug';
  if (clean === 'stripedpocketee' || clean === 'pocket-shirt') return 'striped-pocket-tee';
  if (clean in BLUSH_BODIES) return clean;
  // Default fallback
  return 'jacket-2';
}

/** Normalize face expression key to clean Blush face dictionary ID */
export function normalizeBlushFaceId(face: string | undefined): string {
  if (!face) return 'smile-big';
  const clean = face.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (clean === 'smilebig' || clean === 'smile-big') return 'smile-big';
  if (clean === 'eatinghappy' || clean === 'eating-happy') return 'eating-happy';
  if (clean.startsWith('lovinggrin') || clean === 'loving-grin') return 'loving-grin';
  if (clean === 'smilelol' || clean === 'smileteethgap' || clean === 'smile-lol') return 'smile-lol';
  if (clean === 'eyesclosed' || clean === 'eyes-closed' || clean === 'calm' || clean === 'tired') return 'eyes-closed';
  if (clean === 'solemn' || clean === 'blank') return 'driven';
  if (clean === 'fear' || clean === 'angrywithfang' || clean === 'concerned') return 'hectic';
  if (clean === 'contempt') return 'suspicious';
  if (clean in BLUSH_FACES) return clean;
  return 'smile-big';
}

/** Colorize Blush Body SVG markup strictly by semantic positive ID whitelist */
function colorizeBodyMarkup(
  markup: string,
  skinColor: string,
  clothingColor: string,
  innerClothingColor: string = '#27272A'
): string {
  const safeClothing =
    clothingColor.toLowerCase() === '#181615' || clothingColor.toLowerCase() === '#000000'
      ? '#27272A'
      : clothingColor;

  const safeInnerClothing =
    innerClothingColor.toLowerCase() === '#181615' || innerClothingColor.toLowerCase() === '#000000'
      ? '#27272A'
      : innerClothingColor;

  const hasTwoLayers = markup.includes('id="Jacket"') && markup.includes('id="Top"');

  return markup.replace(/<(path|rect)\s+([^>]+)>/g, (match, tag, attrs) => {
    // 1. Absolute Guard for Stroke-Only / Outline / Ink Paths
    if (attrs.includes('fill="none"') || attrs.includes('id="OutlineStroke"')) {
      return match;
    }

    const idMatch = attrs.match(/id="([^"]+)"/);
    const id = idMatch ? idMatch[1] : '';

    // 2. Strict Positive ID Whitelist
    if (id === 'Skin') {
      return `<${tag} ${attrs.replace(/fill="[^"]*"/, `fill="${skinColor}"`)}>`;
    }
    if (id === 'Ink') {
      return `<${tag} ${attrs.replace(/fill="[^"]*"/, 'fill="#181615"')}>`;
    }
    if (id === 'Cup' || id === 'Mug') {
      return `<${tag} ${attrs.replace(/fill="[^"]*"/, 'fill="#FFFFFF"')}>`;
    }
    if (id === 'Computer') {
      return `<${tag} ${attrs.replace(/fill="[^"]*"/, 'fill="#E4E4E7"')}>`;
    }
    if (id === 'Squiggles') {
      return `<${tag} ${attrs.replace(/fill="[^"]*"/, `fill="${safeInnerClothing || '#FAF7F2'}"`)}>`;
    }
    if (id === 'Jacket') {
      return `<${tag} ${attrs.replace(/fill="[^"]*"/, `fill="${safeClothing}"`)}>`;
    }
    if (id === 'Top') {
      if (hasTwoLayers) {
        return `<${tag} ${attrs.replace(/fill="[^"]*"/, `fill="${safeInnerClothing}"`)}>`;
      }
      return `<${tag} ${attrs.replace(/fill="[^"]*"/, `fill="${safeClothing}"`)}>`;
    }

    // Any other element without one of the whitelisted IDs: leave untouched!
    return match;
  });
}

/** Colorize Blush Head SVG markup (Skin for face contour, Ink for hair/head outline) */
function colorizeHeadMarkup(markup: string, skinColor: string, hairColor: string): string {
  return markup.replace(/<path\s+([^>]+)>/g, (match, attrs) => {
    const idMatch = attrs.match(/id="([^"]+)"/);
    const id = idMatch ? idMatch[1] : '';

    if (id === 'Skin') {
      return `<path ${attrs.replace(/fill="[^"]*"/, `fill="${skinColor}"`)}>`;
    }
    if (id === 'Ink') {
      return `<path ${attrs.replace(/fill="[^"]*"/, `fill="${hairColor}"`)}>`;
    }
    return match;
  });
}

export function SmakrMascotRig({
  head = DEFAULT_MASCOT_CONFIG.head,
  face = DEFAULT_MASCOT_CONFIG.face,
  accessories = DEFAULT_MASCOT_CONFIG.accessories,
  facialHair = DEFAULT_MASCOT_CONFIG.facialHair,
  skinColor = DEFAULT_MASCOT_CONFIG.skinColor,
  clothingColor = DEFAULT_MASCOT_CONFIG.clothingColor,
  innerClothingColor = DEFAULT_MASCOT_CONFIG.innerClothingColor || '27272a',
  headContrastColor = DEFAULT_MASCOT_CONFIG.headContrastColor,
  stickerOutline = true,
  frameMode = 'bust-plus-bubble',
  bodyPose = DEFAULT_MASCOT_CONFIG.bodyPose,
  bubbleText = 'For the biscoff lovers',
  bubbleEyebrow = '✦ SMAKR VERDICT',
  bubbleStyle = 'round',
  circleBg = '#FAF7F2',
  customMascotDataUrl = null,
  flip = false,
  size = 340,
  className = '',
  bubbleOffsetX = 0,
  bubbleOffsetY = 0,
  bubbleSide = 'right',
  bubbleScale = 1,
  // Backward compatibility
  expression,
  eyewear,
  shirtColor,
}: SmakrMascotRigProps) {
  // Normalize color hex codes with '#'
  const resolvedSkin = skinColor.startsWith('#') ? skinColor : `#${skinColor}`;
  const resolvedShirt = (clothingColor || shirtColor || DEFAULT_MASCOT_CONFIG.clothingColor).startsWith('#')
    ? clothingColor || shirtColor || DEFAULT_MASCOT_CONFIG.clothingColor
    : `#${clothingColor || shirtColor || DEFAULT_MASCOT_CONFIG.clothingColor}`;
  const resolvedInnerShirt = (innerClothingColor || DEFAULT_MASCOT_CONFIG.innerClothingColor || '#27272A').startsWith('#')
    ? innerClothingColor || DEFAULT_MASCOT_CONFIG.innerClothingColor || '#27272A'
    : `#${innerClothingColor || DEFAULT_MASCOT_CONFIG.innerClothingColor || '27272a'}`;
  const resolvedHeadContrast = headContrastColor.startsWith('#')
    ? headContrastColor
    : `#${headContrastColor}`;

  // Normalize component keys
  const resolvedBodyId = normalizeBlushBodyId(bodyPose);
  const resolvedFaceId = normalizeBlushFaceId(expression || face);
  const resolvedHeadId = (head || 'afro').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const resolvedAccId = eyewear === 'none'
    ? 'none'
    : (accessories || eyewear || 'glasses-2').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const resolvedBeardId = (facialHair || 'none').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Lookup components from Blush dictionary with resilient fallbacks
  const bodyComp: BlushComponent = BLUSH_BODIES[resolvedBodyId] || BLUSH_BODIES['jacket-2'];
  const headComp: BlushComponent = BLUSH_HEADS[resolvedHeadId] || BLUSH_HEADS['afro'];
  const faceComp: BlushComponent = BLUSH_FACES[resolvedFaceId] || BLUSH_FACES['smile-big'];
  const accComp: BlushComponent | undefined =
    resolvedAccId !== 'none'
      ? BLUSH_ACCESSORIES[resolvedAccId] || BLUSH_ACCESSORIES['glasses-2']
      : undefined;
  const beardComp: BlushComponent | undefined =
    resolvedBeardId !== 'none'
      ? BLUSH_BEARDS[resolvedBeardId]
      : undefined;

  // Memoize colored SVG markup
  const coloredBody = useMemo(() => {
    return colorizeBodyMarkup(bodyComp.markup, resolvedSkin, resolvedShirt, resolvedInnerShirt);
  }, [bodyComp, resolvedSkin, resolvedShirt, resolvedInnerShirt]);

  const coloredHead = useMemo(() => {
    return colorizeHeadMarkup(headComp.markup, resolvedSkin, resolvedHeadContrast);
  }, [headComp, resolvedSkin, resolvedHeadContrast]);

  const coloredFace = useMemo(() => {
    // Face markup preserves teeth #FFF and ink #000
    return faceComp.markup;
  }, [faceComp]);

  const coloredAcc = useMemo(() => {
    if (!accComp) return null;
    return accComp.markup;
  }, [accComp]);

  const coloredBeard = useMemo(() => {
    if (!beardComp) return null;
    return beardComp.markup.replace(/fill="[^"]*"/g, `fill="${resolvedHeadContrast}"`);
  }, [beardComp, resolvedHeadContrast]);

  // White Die-Cut Vinyl Rim filter style
  const stickerFilterStyle = stickerOutline
    ? {
        filter:
          'drop-shadow(4px 0 0 #FFFFFF) drop-shadow(-4px 0 0 #FFFFFF) drop-shadow(0 4px 0 #FFFFFF) drop-shadow(0 -4px 0 #FFFFFF) drop-shadow(0 10px 20px rgba(0,0,0,0.22))',
      }
    : undefined;

  // Render Speech Bubble (Supporting optional uppercase orange eyebrow + bold quote)
  const renderSpeechBubble = (showTail = true) => {
    const bubbleRadius =
      bubbleStyle === 'round'
        ? 'rounded-[28px]'
        : bubbleStyle === 'shout'
        ? 'rounded-2xl border-2 border-[#181615]'
        : bubbleStyle === 'thought'
        ? 'rounded-[32px] border-2 border-dashed border-[#181615]'
        : 'rounded-xl';

    const side = bubbleSide || 'right';

    return (
      <div
        className={`relative px-7 py-4.5 bg-white text-[#181615] font-sans shadow-xl max-w-[340px] leading-snug tracking-tight ${bubbleRadius}`}
      >
        {showTail && bubbleStyle !== 'thought' && (
          side === 'right' ? (
            <svg
              className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-4 h-5 fill-white drop-shadow-sm"
              viewBox="0 0 16 20"
            >
              <polygon points="16,0 0,10 16,20" />
            </svg>
          ) : side === 'left' ? (
            <svg
              className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-4 h-5 fill-white drop-shadow-sm rotate-180"
              viewBox="0 0 16 20"
            >
              <polygon points="16,0 0,10 16,20" />
            </svg>
          ) : (
            <svg
              className="absolute left-1/2 -bottom-3.5 -translate-x-1/2 w-5 h-4 fill-white drop-shadow-sm"
              viewBox="0 0 20 16"
            >
              <polygon points="0,0 20,0 10,16" />
            </svg>
          )
        )}
        {showTail && bubbleStyle === 'thought' && (
          side === 'right' ? (
            <>
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-sm border border-[#181615]/20" />
              <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-sm border border-[#181615]/20" />
            </>
          ) : side === 'left' ? (
            <>
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-sm border border-[#181615]/20" />
              <div className="absolute -right-5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-sm border border-[#181615]/20" />
            </>
          ) : (
            <>
              <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-sm border border-[#181615]/20" />
              <div className="absolute left-1/2 -bottom-5 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-sm border border-[#181615]/20" />
            </>
          )
        )}
        {bubbleEyebrow && (
          <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#e84a27] mb-1 font-comico">
            {bubbleEyebrow}
          </span>
        )}
        <span className="block font-bold text-2xl text-[#181615]">
          {bubbleText || 'For the biscoff lovers'}
        </span>
      </div>
    );
  };

  // Render Unified Blush Pro Vector SVG
  const renderCharacterGraphic = () => {
    if (frameMode === 'custom-upload' && customMascotDataUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={customMascotDataUrl}
          alt="Custom Mascot"
          className="object-contain w-full h-full"
          style={{ transform: flip ? 'scaleX(-1)' : undefined }}
        />
      );
    }

    return (
      <svg
        viewBox="130 130 1050 1250"
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
        className="w-full h-full object-contain overflow-visible"
        style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      >
        <g id="Master/Character/Bust" stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
          {/* 1. Body */}
          <g id="Body" transform="translate(147.000000, 639.000000) scale(1 1)">
            <g
              id={`Body/${bodyComp.name}`}
              dangerouslySetInnerHTML={{ __html: coloredBody }}
            />
          </g>

          {/* 2. Head */}
          <g id="Head" transform="translate(372.000000, 180.000000) scale(0.9978902953586498 1)">
            <g
              id={`Head/${headComp.name}`}
              dangerouslySetInnerHTML={{ __html: coloredHead }}
            />
          </g>

          {/* 3. Face */}
          <g
            id="Face"
            transform={
              resolvedFaceId === 'smile-big'
                ? 'translate(531.000000, 366.000000) scale(1 1)'
                : 'translate(582.000000, 420.000000) scale(1 1)'
            }
          >
            <g
              id={`Face/${faceComp.name}`}
              dangerouslySetInnerHTML={{ __html: coloredFace }}
            />
          </g>

          {/* 4. Beard */}
          {coloredBeard && beardComp && (
            <g id="Beard" transform="translate(494.999934, 517.999659) scale(1 1)">
              <g
                id={`Beard/${beardComp.name}`}
                dangerouslySetInnerHTML={{ __html: coloredBeard }}
              />
            </g>
          )}

          {/* 5. Accessories */}
          {coloredAcc && accComp && (
            <g id="Accessories" transform="translate(419.000000, 421.000000) scale(1 1)">
              <g
                id={`Accessories/${accComp.name}`}
                dangerouslySetInnerHTML={{ __html: coloredAcc }}
              />
            </g>
          )}
        </g>
      </svg>
    );
  };

  const characterW = size;
  const characterH = Math.round(size * 1.19);

  // MODE: Bubble Only
  if (frameMode === 'bubble-only') {
    return (
      <div
        data-mascot-rig="true"
        className={`relative inline-block select-none ${className}`}
        style={stickerFilterStyle}
      >
        {renderSpeechBubble(false)}
      </div>
    );
  }

  // MODE: Circle Avatar
  if (frameMode === 'circle-avatar') {
    return (
      <div
        data-mascot-rig="true"
        className={`relative inline-block select-none ${className}`}
        style={stickerFilterStyle}
      >
        <div
          className="relative rounded-full border-4 border-white shadow-xl overflow-hidden flex items-center justify-center shrink-0"
          style={{
            width: size,
            height: size,
            backgroundColor: circleBg || '#FAF7F2',
          }}
        >
          <div
            className="w-[125%] h-[125%] flex items-center justify-center"
            style={{ transform: 'translateY(10%)' }}
          >
            {renderCharacterGraphic()}
          </div>
        </div>
      </div>
    );
  }

  // MODE: Bust Only
  if (frameMode === 'bust-only' || (frameMode === 'custom-upload' && !bubbleText)) {
    return (
      <div
        data-mascot-rig="true"
        className={`relative inline-block select-none ${className}`}
        style={{
          width: characterW,
          height: characterH,
          ...stickerFilterStyle,
        }}
      >
        {renderCharacterGraphic()}
      </div>
    );
  }

  // MODE: Bust + Bubble (Default)
  const side = bubbleSide || 'right';
  const flexLayout =
    side === 'left'
      ? 'flex-row-reverse items-start'
      : side === 'top'
      ? 'flex-col-reverse items-center'
      : 'flex-row items-start';

  const offsetX = bubbleOffsetX || 0;
  const offsetY = bubbleOffsetY || 0;
  const bScale = bubbleScale || 1;

  return (
    <div
      data-mascot-rig="true"
      className={`relative inline-flex ${flexLayout} gap-3 sm:gap-4 select-none ${className}`}
      style={stickerFilterStyle}
    >
      <div
        style={{ width: characterW, height: characterH }}
        className="shrink-0 flex items-center justify-center"
      >
        {renderCharacterGraphic()}
      </div>
      {bubbleText && (
        <div
          className={`shrink-0 ${side === 'top' ? 'mb-2' : 'mt-[14%]'}`}
          style={{
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${bScale})`,
            transformOrigin:
              side === 'left' ? 'top right' : side === 'top' ? 'bottom center' : 'top left',
            transition: 'transform 0.12s ease-out',
          }}
        >
          {renderSpeechBubble(true)}
        </div>
      )}
    </div>
  );
}
