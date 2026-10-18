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
  BLUSH_MASKS,
  BLUSH_ACCESSORIES,
  BLUSH_BEARDS,
  BLUSH_PRESETS,
  type BlushBody,
  type BlushComponent,
} from '@/lib/blushMascotCatalog';

export {
  BLUSH_BODIES,
  BLUSH_HEADS,
  BLUSH_FACES,
  BLUSH_MASKS,
  BLUSH_ACCESSORIES,
  BLUSH_BEARDS,
  BLUSH_PRESETS,
  type BlushBody,
};

export interface SmakrMascotRigProps {
  head?: string;
  face?: string;
  accessories?: string;
  facialHair?: string;
  mask?: string;
  skinColor?: string;
  clothingColor?: string;
  innerClothingColor?: string;
  shoeColor?: string;
  hatColor?: string;
  propColor?: string;
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
  if (clean === 'sitting' || clean === 'one-leg-up' || clean === 'sitting-one-leg-up') return 'sitting-one-leg-up-2';
  if (clean === 'sitting-mid' || clean === 'relaxed') return 'sitting-mid-1';
  if (clean === 'standing' || clean === 'walking') return 'standing-walking-3';
  if (clean === 'doctor' || clean === 'nurse' || clean === 'standing-doctor') return 'standing-doctor-nurse-3';
  if (clean in BLUSH_BODIES) return clean;
  // Default fallback
  return 'jacket-2';
}

/** Normalize face expression key to clean Blush face dictionary ID */
export function normalizeBlushFaceId(face: string | undefined): string {
  if (!face) return 'smile-big';
  const clean = face.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (clean in BLUSH_FACES) return clean;
  if (clean === 'smilebig') return 'smile-big';
  if (clean === 'eatinghappy') return 'eating-happy';
  if (clean.startsWith('lovinggrin') || clean === 'loving-grin') return 'loving-grin';
  if (clean === 'smilelol' || clean === 'smile-lol') return 'smile-lol';
  if (clean === 'smileteeth' || clean === 'smileteethgap') return 'smile-teeth-gap';
  if (clean === 'eyesclosed') return 'eyes-closed';
  if (clean === 'oldaged') return 'old';
  if (clean === 'veryangry') return 'very-angry';
  return 'smile-big';
}

/** Colorize Blush Body SVG markup strictly by semantic positive ID whitelist */
function colorizeBodyMarkup(
  markup: string,
  skinColor: string,
  clothingColor: string,
  innerClothingColor: string = '#27272A',
  shoeColor: string = '#FFFFFF',
  hatColor: string = '#e84a27'
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

  return markup.replace(/<(path|rect|polygon)\s+([^>]+)>/g, (match, tag, attrs) => {
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
    if (id === 'Seams') {
      return `<${tag} ${attrs.replace(/fill="[^"]*"/, 'fill="#FAF7F2"')}>`;
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
    if (id === 'Jacket' || id === 'Clothes') {
      return `<${tag} ${attrs.replace(/fill="[^"]*"/, `fill="${safeClothing}"`)}>`;
    }
    if (id === 'Top') {
      if (hasTwoLayers) {
        return `<${tag} ${attrs.replace(/fill="[^"]*"/, `fill="${safeInnerClothing}"`)}>`;
      }
      return `<${tag} ${attrs.replace(/fill="[^"]*"/, `fill="${safeClothing}"`)}>`;
    }
    if (id === 'Bottom' || id === 'Pants') {
      return `<${tag} ${attrs.replace(/fill="[^"]*"/, `fill="${safeInnerClothing}"`)}>`;
    }
    if (id === 'Shoes' || id === 'Footwear' || id === 'Sneakers') {
      return `<${tag} ${attrs.replace(/fill="[^"]*"/, `fill="${shoeColor}"`)}>`;
    }
    if (id === 'Hat') {
      return `<${tag} ${attrs.replace(/fill="[^"]*"/, `fill="${hatColor}"`)}>`;
    }

    // Any other element without one of the whitelisted IDs: leave untouched!
    return match;
  });
}

/** Colorize Blush Head SVG markup (Skin for face contour, Ink for hair/head outline, Hat for cap) */
function colorizeHeadMarkup(
  markup: string,
  skinColor: string,
  hairColor: string,
  hatColor: string = '#e84a27'
): string {
  return markup.replace(/<(path|rect)\s+([^>]+)>/g, (match, tag, attrs) => {
    const idMatch = attrs.match(/id="([^"]+)"/);
    const id = idMatch ? idMatch[1] : '';

    if (id === 'Skin') {
      return `<${tag} ${attrs.replace(/fill="[^"]*"/, `fill="${skinColor}"`)}>`;
    }
    if (id === 'Ink') {
      return `<${tag} ${attrs.replace(/fill="[^"]*"/, `fill="${hairColor}"`)}>`;
    }
    if (id === 'Hat' || id === 'HatBrim') {
      return `<${tag} ${attrs.replace(/fill="[^"]*"/, `fill="${hatColor}"`)}>`;
    }
    return match;
  });
}

export function SmakrMascotRig({
  head = DEFAULT_MASCOT_CONFIG.head,
  face = DEFAULT_MASCOT_CONFIG.face,
  accessories = DEFAULT_MASCOT_CONFIG.accessories,
  facialHair = DEFAULT_MASCOT_CONFIG.facialHair,
  mask = DEFAULT_MASCOT_CONFIG.mask || 'none',
  skinColor = DEFAULT_MASCOT_CONFIG.skinColor,
  clothingColor = DEFAULT_MASCOT_CONFIG.clothingColor,
  innerClothingColor = DEFAULT_MASCOT_CONFIG.innerClothingColor || '27272a',
  shoeColor = DEFAULT_MASCOT_CONFIG.shoeColor || 'ffffff',
  hatColor = DEFAULT_MASCOT_CONFIG.hatColor || 'e84a27',
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
  const resolvedShoe = (shoeColor || DEFAULT_MASCOT_CONFIG.shoeColor || '#FFFFFF').startsWith('#')
    ? shoeColor || DEFAULT_MASCOT_CONFIG.shoeColor || '#FFFFFF'
    : `#${shoeColor || DEFAULT_MASCOT_CONFIG.shoeColor || 'FFFFFF'}`;
  const resolvedHat = (hatColor || DEFAULT_MASCOT_CONFIG.hatColor || '#e84a27').startsWith('#')
    ? hatColor || DEFAULT_MASCOT_CONFIG.hatColor || '#e84a27'
    : `#${hatColor || DEFAULT_MASCOT_CONFIG.hatColor || 'e84a27'}`;
  const resolvedHeadContrast = headContrastColor.startsWith('#')
    ? headContrastColor
    : `#${headContrastColor}`;

  // Normalize component keys
  const resolvedBodyId = normalizeBlushBodyId(bodyPose);
  const resolvedFaceId = normalizeBlushFaceId(expression || face);
  const resolvedHeadId = (head || 'afro').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const resolvedMaskId = (mask || 'none').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const resolvedAccId = eyewear === 'none'
    ? 'none'
    : (accessories || eyewear || 'glasses-2').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const resolvedBeardId = (facialHair || 'none').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Lookup components from Blush dictionary with resilient fallbacks
  const bodyComp: BlushBody = BLUSH_BODIES[resolvedBodyId] || BLUSH_BODIES['jacket-2'];
  const headComp: BlushComponent = BLUSH_HEADS[resolvedHeadId] || BLUSH_HEADS['afro'];
  const faceComp: BlushComponent = BLUSH_FACES[resolvedFaceId] || BLUSH_FACES['smile-big'];
  const maskComp: BlushComponent | undefined =
    resolvedMaskId !== 'none' ? BLUSH_MASKS[resolvedMaskId] : undefined;
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
    return colorizeBodyMarkup(bodyComp.markup, resolvedSkin, resolvedShirt, resolvedInnerShirt, resolvedShoe, resolvedHat);
  }, [bodyComp, resolvedSkin, resolvedShirt, resolvedInnerShirt, resolvedShoe, resolvedHat]);

  const coloredHead = useMemo(() => {
    return colorizeHeadMarkup(headComp.markup, resolvedSkin, resolvedHeadContrast, resolvedHat);
  }, [headComp, resolvedSkin, resolvedHeadContrast, resolvedHat]);

  const coloredFace = useMemo(() => {
    return faceComp.markup;
  }, [faceComp]);

  const coloredMask = useMemo(() => {
    if (!maskComp) return null;
    return maskComp.markup;
  }, [maskComp]);

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
          {bubbleText || 'Oslo Food Radar'}
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

    const [headX, headY] = bodyComp.headAnchor || [372, 180];
    const bodyCategoryTag =
      bodyComp.category === 'sitting'
        ? 'Sitting'
        : bodyComp.category === 'standing'
        ? 'Standing'
        : 'Body';

    return (
      <svg
        viewBox={bodyComp.viewBox || '130 130 1050 1250'}
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
        className="w-full h-full object-contain overflow-visible"
        style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      >
        <g id={`Master/Character/${bodyComp.category}`} stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
          {/* 1. Body Slot */}
          <g id={bodyCategoryTag} transform={bodyComp.bodyTransform}>
            <g
              id={`${bodyCategoryTag}/${bodyComp.name}`}
              dangerouslySetInnerHTML={{ __html: coloredBody }}
            />
          </g>

          {/* 2. Head Slot */}
          <g id="Head" transform={`translate(${headX}.000000, ${headY}.000000) scale(0.9978902953586498 1)`}>
            <g
              id={`Head/${headComp.name}`}
              dangerouslySetInnerHTML={{ __html: coloredHead }}
            />
          </g>

          {/* 3. Face Slot */}
          <g
            id="Face"
            transform={`translate(${headX + 159}.000000, ${headY + 186}.000000) scale(1 1)`}
          >
            <g
              id={`Face/${faceComp.name}`}
              dangerouslySetInnerHTML={{ __html: coloredFace }}
            />
          </g>

          {/* 4. Mask Slot */}
          {coloredMask && maskComp && maskComp.id !== 'none' && (
            <g id="Mask" transform={`translate(${headX + 28}.000000, ${headY + 300}.000000) scale(1 1)`}>
              <g
                id={`Mask/${maskComp.name}`}
                dangerouslySetInnerHTML={{ __html: coloredMask }}
              />
            </g>
          )}

          {/* 5. Beard Slot */}
          {coloredBeard && beardComp && beardComp.id !== 'none' && (
            <g id="Beard" transform={`translate(${headX + 123}.000000, ${headY + 338}.000000) scale(1 1)`}>
              <g
                id={`Beard/${beardComp.name}`}
                dangerouslySetInnerHTML={{ __html: coloredBeard }}
              />
            </g>
          )}

          {/* 6. Accessories / Glasses Slot */}
          {coloredAcc && accComp && accComp.id !== 'none' && (
            <g id="Accessories" transform={`translate(${headX + 47}.000000, ${headY + 241}.000000) scale(1 1)`}>
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

  const [vbX, vbY, vbW, vbH] = (bodyComp.viewBox || '130 130 1050 1250')
    .split(' ')
    .map(Number);

  const isStanding = bodyComp.category === 'standing';
  const isSitting = bodyComp.category === 'sitting';
  let characterW: number;
  let characterH: number;

  if (isStanding) {
    // Standing pose: scale height so full body fits gracefully inside stage (max ~510px)
    const targetH = Math.min(size * 1.32, 510);
    characterH = targetH;
    characterW = Math.round(targetH * (vbW / (vbH || 1)));
  } else if (isSitting) {
    const targetH = Math.min(size * 1.22, 470);
    characterH = targetH;
    characterW = Math.round(targetH * (vbW / (vbH || 1)));
  } else {
    // Bust poses: Lock height to `size` so all busts (pointing-up, jacket-2, shrug, coffee)
    // share the exact same head size, shoulder baseline, and character scale.
    const targetH = size;
    characterH = targetH;
    characterW = Math.round(targetH * (vbW / (vbH || 1)));
  }

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
        className={`relative inline-block shrink-0 select-none ${className}`}
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
