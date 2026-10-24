export type AuthEmailKind = "confirmation" | "reset";
export type AuthEmailTheme = "auto" | "light" | "dark";

export interface AuthEmailMeta {
  subject: string;
  preheader: string;
}

const ACCENT = "#E84A27";
const INK = "#181615";
const MUTED = "#6B6459";
const SOFT = "#8A7F72";
const PAPER = "#FFFDF8";
const CANVAS = "#E9DFCC";
const BORDER = "#E6D9C6";

export function getAuthEmailMeta(kind: AuthEmailKind): AuthEmailMeta {
  if (kind === "reset") {
    return {
      subject: "Reset your Smakr password",
      preheader: "Pick a new password — your saved spots are still here.",
    };
  }
  return {
    subject: "You're in — welcome to Smakr",
    preheader: "One tap and the Oslo food radar is yours.",
  };
}

/**
 * Dark-mode overrides. `prefix` lets the same rules drive three surfaces:
 * - "" inside a prefers-color-scheme media query
 * - "[data-ogsc] " for Outlook.com's dark mode
 * - "" when the theme is forced (preview)
 */
function darkRules(prefix: string, mapDark: string) {
  return `
    ${prefix}.email-canvas { background-color:#141110 !important; }
    ${prefix}.email-shell {
      background-color:#141110 !important;
      background-image:url('${mapDark}') !important;
    }
    ${prefix}.email-card {
      background-color:rgba(34,27,23,0.9) !important;
      border-color:#3A302A !important;
    }
    ${prefix}.email-quote {
      background-color:rgba(36,29,24,0.92) !important;
      border-color:#3A302A !important;
    }
    ${prefix}.email-note {
      background-color:rgba(26,21,18,0.86) !important;
      border-color:#332A23 !important;
    }
    ${prefix}.email-chip {
      background-color:#3A241D !important;
      border-color:#4A2E24 !important;
      color:#FF8A68 !important;
    }
    ${prefix}.email-tag {
      background-color:#2A211C !important;
      border-color:#3A302A !important;
      color:#D8CBB8 !important;
    }
    ${prefix}.email-ink { color:#F6F0E7 !important; }
    ${prefix}.email-muted { color:#B4A797 !important; }
    ${prefix}.email-soft { color:#8E8274 !important; }
    ${prefix}.email-accent { color:#FF6A45 !important; }
    ${prefix}.email-strike { color:#8E8274 !important; }
    ${prefix}.email-divider { background-color:#3A302A !important; }
    ${prefix}.email-rule { border-color:#3A302A !important; }
    ${prefix}.email-cta {
      background-color:#FF6A45 !important;
      color:#1A1210 !important;
    }
    ${prefix}.img-light { display:none !important; }
    ${prefix}.img-dark { display:block !important; }
  `;
}

export function getAuthEmailHtml(
  kind: AuthEmailKind,
  actionUrl: string,
  assetBase = "https://smakr.no",
  theme: AuthEmailTheme = "auto"
): string {
  const isReset = kind === "reset";
  const meta = getAuthEmailMeta(kind);

  const asset = (name: string) => `${assetBase}/email/${name}`;
  const heroLight = asset(`hero-${isReset ? "reset" : "confirm"}-light.jpg`);
  const heroDark = asset(`hero-${isReset ? "reset" : "confirm"}-dark.jpg`);
  const mapLight = asset("map-light.jpg");
  const mapDark = asset("map-dark.jpg");
  const spot = asset("spot-ramen.jpg");
  const avatar = asset("mascot-avatar.png");
  const font = `${assetBase}/fonts/Comico-Regular.otf`;
  const initialMap = theme === "dark" ? mapDark : mapLight;

  const darkCss =
    theme === "light"
      ? ""
      : theme === "dark"
        ? darkRules("", mapDark)
        : `@media (prefers-color-scheme: dark) {${darkRules("", mapDark)}}${darkRules(
            "[data-ogsc] ",
            mapDark
          )}`;

  const eyebrow = isReset ? "PASSWORD RESET" : "CONFIRM YOUR EMAIL";
  const headline = isReset ? "Back to the feed." : "You're in.";
  const intro = isReset
    ? "Pick a new password and get straight back to the feed. Your saved spots, your shortlist and your radar haven't moved."
    : "You're one tap from the feed. Smakr is Oslo's live food radar — real dishes, honest verdicts and exact prices at the spots actually worth trying.";
  const cta = isReset ? "Set a new password" : "Confirm email";
  const note = isReset
    ? "This link works for one hour. If you didn't request a reset, ignore this email — your password stays the same."
    : "This link works for one hour. If you didn't sign up, ignore this email — nothing happens.";
  const reason = "You signed up for Smakr — Oslo's live food radar.";
  const spotBlurb = isReset
    ? "Your shortlist hasn't moved. The radar kept running while you were away."
    : "New drops land every day. Save this one, or follow the radar to your own corner of Oslo.";

  const heroAlt = isReset
    ? "Welcome back to Smakr — Oslo's live food radar"
    : "Welcome to Smakr — Oslo's live food radar";

  const heroImages = `
    <img class="img-light" src="${heroLight}" width="600" alt="${heroAlt}" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;">
    <img class="img-dark" src="${heroDark}" width="600" alt="${heroAlt}" style="display:none;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;mso-hide:all;">`;

  const steps = [
    { num: "01", title: "Browse the feed", icon: "live" },
    { num: "02", title: "Pick a dish", icon: "dishes" },
    { num: "03", title: "Tap the map", icon: "save" },
  ];

  const stepCell = (step: (typeof steps)[number]) => `
    <td class="email-step" width="33.33%" valign="top" style="width:33.33%;padding:0 5px;">
      <img class="img-light" src="${asset(`step-${step.icon}-light.png`)}" width="164" alt="${step.title}" style="display:block;width:100%;max-width:164px;height:auto;border:0;margin:0 auto;">
      <img class="img-dark" src="${asset(`step-${step.icon}-dark.png`)}" width="164" alt="${step.title}" style="display:none;width:100%;max-width:164px;height:auto;border:0;margin:0 auto;mso-hide:all;">
      <p class="email-accent" style="margin:9px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:11px;letter-spacing:1.8px;font-weight:700;color:${ACCENT};">${step.num}</p>
      <p class="email-ink email-step-title" style="margin:3px 0 0 0;font-family:'Comico','Arial Black',Arial,sans-serif;font-size:13px;line-height:16px;color:${INK};">${step.title}</p>
    </td>`;

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${meta.subject}</title>
  <style>
    @font-face {
      font-family: 'Comico';
      src: url('${font}') format('opentype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    @media only screen and (max-width: 520px) {
      .email-shell { width: 100% !important; border-radius: 0 !important; }
      .email-px { padding-left: 12px !important; padding-right: 12px !important; }
      .email-card-pad { padding-left: 18px !important; padding-right: 18px !important; }
      .email-step { padding: 0 3px !important; }
      .email-step-title { font-size: 11px !important; line-height: 14px !important; }
      .email-headline { font-size: 38px !important; line-height: 38px !important; }
      .email-h2 { font-size: 24px !important; line-height: 27px !important; }
      .email-cta { display: block !important; text-align: center !important; }
      .email-hide-mobile { display: none !important; }
    }
    ${darkCss}
  </style>
</head>
<body class="email-canvas ${theme === "dark" ? "force-dark" : ""}" style="margin:0;padding:0;background-color:${CANVAS};color:${INK};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${meta.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CANVAS}" class="email-canvas" style="background-color:${CANVAS};">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${CANVAS}" background="${initialMap}" class="email-shell" style="width:600px;max-width:600px;background-color:${CANVAS};background-image:url('${initialMap}');background-repeat:repeat-y;background-position:top center;">
          <tr>
            <td style="padding:18px 26px 14px 26px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="42" valign="middle" style="width:42px;">
                    <img src="${avatar}" width="38" height="38" alt="Smakr" style="display:block;width:38px;height:38px;border-radius:50%;border:2px solid ${PAPER};box-shadow:0 2px 6px rgba(24,22,21,0.18);">
                  </td>
                  <td style="padding-left:10px;font-family:'Comico','Arial Black',Arial,sans-serif;font-size:20px;line-height:20px;letter-spacing:.5px;" class="email-ink">
                    <span class="email-ink" style="color:${INK};">SMAKR</span><span class="email-accent" style="color:${ACCENT};">.</span>
                  </td>
                  <td align="right" class="email-hide-mobile" style="font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:12px;letter-spacing:2.2px;text-transform:uppercase;">
                    <span class="email-muted" style="color:${MUTED};">Oslo &middot; 59.91 N / 10.75 E</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0;line-height:0;font-size:0;">
              ${heroImages}
            </td>
          </tr>
          <tr>
            <td class="email-px" style="padding:22px 18px 0 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}" class="email-card" style="background-color:rgba(255,253,248,0.86);border:1px solid rgba(230,217,198,0.9);border-radius:22px;">
                <tr>
                  <td class="email-card-pad" style="padding:26px 26px 24px 26px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 13px 0;">
                      <tr>
                        <td width="9" height="9" bgcolor="${ACCENT}" style="width:9px;height:9px;background-color:${ACCENT};border-radius:50%;"></td>
                        <td class="email-accent" style="padding-left:9px;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:11px;letter-spacing:2.4px;font-weight:700;color:${ACCENT};text-transform:uppercase;">${eyebrow}</td>
                      </tr>
                    </table>
                    <h1 class="email-headline email-ink" style="margin:0;font-family:'Comico','Arial Black',Arial,sans-serif;font-size:40px;line-height:40px;letter-spacing:-1px;color:${INK};font-weight:400;">${headline}</h1>
                    <p class="email-muted" style="margin:14px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:23px;color:${MUTED};">${intro}</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:21px 0 0 0;">
                      <tr>
                        <td bgcolor="${ACCENT}" class="email-cta" style="background-color:${ACCENT};border-radius:12px;">
                          <a class="email-cta" href="${actionUrl}" target="_blank" style="display:inline-block;padding:15px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:16px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:12px;">${cta} &rarr;</a>
                        </td>
                      </tr>
                    </table>
                    <p class="email-soft" style="margin:13px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:16px;color:${SOFT};">Button not working? Paste this link into your browser:<br><span class="email-muted" style="font-family:'Courier New',Courier,monospace;font-size:9px;line-height:15px;color:${MUTED};word-break:break-all;">${actionUrl}</span></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-px" style="padding:22px 18px 0 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}" class="email-card" style="background-color:rgba(255,253,248,0.86);border:1px solid rgba(230,217,198,0.9);border-radius:22px;">
                <tr>
                  <td class="email-card-pad" style="padding:24px 24px 22px 24px;">
                    <p class="email-accent" style="margin:0 0 7px 0;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:11px;letter-spacing:2.4px;font-weight:700;color:${ACCENT};text-transform:uppercase;">How Smakr works</p>
                    <p class="email-h2 email-ink" style="margin:0 0 18px 0;font-family:'Comico','Arial Black',Arial,sans-serif;font-size:26px;line-height:29px;letter-spacing:-.5px;color:${INK};">From feed to table.</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        ${steps.map((step) => stepCell(step)).join("\n                        ")}
                      </tr>
                    </table>
                    <p class="email-muted" style="margin:16px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:${MUTED};">A live Oslo feed of dishes worth trying — real photos, honest verdicts and exact prices. Tap any dish and the map flies straight to the spot.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-px" style="padding:22px 18px 0 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}" class="email-card" style="background-color:rgba(255,253,248,0.9);border:1px solid rgba(230,217,198,0.9);border-radius:22px;">
                <tr>
                  <td class="email-card-pad" style="padding:22px 24px 6px 24px;">
                    <p class="email-accent" style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:11px;letter-spacing:2.4px;font-weight:700;color:${ACCENT};text-transform:uppercase;">Tonight's radar pick</p>
                    <p class="email-h2 email-ink" style="margin:0 0 16px 0;font-family:'Comico','Arial Black',Arial,sans-serif;font-size:26px;line-height:29px;letter-spacing:-.5px;color:${INK};">On the radar tonight.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 12px;line-height:0;font-size:0;">
                    <img src="${spot}" width="540" alt="Tonkotsu ramen at Miso Ramen, Sentrum" style="display:block;width:100%;max-width:540px;height:auto;border:0;border-radius:16px;">
                  </td>
                </tr>
                <tr>
                  <td class="email-card-pad" style="padding:18px 24px 22px 24px;">
                    <p class="email-accent" style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:11px;letter-spacing:2.2px;font-weight:700;color:${ACCENT};text-transform:uppercase;">Ramen / Sentrum</p>
                    <p class="email-ink" style="margin:6px 0 0 0;font-family:'Comico','Arial Black',Arial,sans-serif;font-size:25px;line-height:28px;letter-spacing:-.4px;color:${INK};">Tonkotsu Ramen</p>
                    <p class="email-ink" style="margin:5px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;font-weight:700;color:${INK};">Miso Ramen &middot; Sentrum</p>
                    <p class="email-muted" style="margin:4px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:17px;color:${MUTED};">215 kr &nbsp;&middot;&nbsp; 4.4 &#9733; &nbsp;&middot;&nbsp; 433 reviews</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:13px 0 0 0;">
                      <tr>
                        <td bgcolor="#F8F2E8" class="email-tag" style="background-color:#F8F2E8;border:1px solid ${BORDER};border-radius:999px;padding:5px 10px;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:12px;color:${MUTED};">Tonkotsu</td>
                        <td width="6" style="width:6px;">&nbsp;</td>
                        <td bgcolor="#F8F2E8" class="email-tag" style="background-color:#F8F2E8;border:1px solid ${BORDER};border-radius:999px;padding:5px 10px;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:12px;color:${MUTED};">Japanese</td>
                        <td width="6" style="width:6px;">&nbsp;</td>
                        <td bgcolor="#F8F2E8" class="email-tag" style="background-color:#F8F2E8;border:1px solid ${BORDER};border-radius:999px;padding:5px 10px;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:12px;color:${MUTED};">Comfort food</td>
                      </tr>
                    </table>
                    <p class="email-muted" style="margin:13px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:${MUTED};">${spotBlurb}</p>
                    <div class="email-divider" style="height:1px;background-color:#EFE4D4;line-height:1px;font-size:1px;margin:16px 0 13px 0;">&nbsp;</div>
                    <a class="email-accent" href="https://smakr.no" target="_blank" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;font-weight:700;color:${ACCENT};text-decoration:none;">See it on Smakr &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-px" style="padding:20px 18px 0 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}" class="email-quote" style="background-color:rgba(255,253,248,0.7);border:1px dashed rgba(232,74,39,0.38);border-radius:16px;">
                <tr>
                  <td style="padding:8px 12px 6px 12px;">
                    <img class="img-light" src="${asset("tagline-light.png")}" width="536" alt="for the big backs — foodies" style="display:block;width:100%;max-width:536px;height:auto;border:0;margin:0 auto;">
                    <img class="img-dark" src="${asset("tagline-dark.png")}" width="536" alt="for the big backs — foodies" style="display:none;width:100%;max-width:536px;height:auto;border:0;margin:0 auto;mso-hide:all;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-px" style="padding:16px 18px 24px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}" class="email-note" style="background-color:rgba(255,253,248,0.62);border:1px solid rgba(230,217,198,0.7);border-radius:12px;">
                <tr>
                  <td style="padding:11px 14px;">
                    <p class="email-muted" style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:16px;color:${MUTED};">${note}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td bgcolor="${INK}" style="background-color:${INK};padding:24px 30px 26px 30px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:'Comico','Arial Black',Arial,sans-serif;font-size:22px;letter-spacing:.5px;color:#FFFDF8;">SMAKR<span style="color:${ACCENT};">.</span></td>
                  <td align="right" class="email-hide-mobile" style="font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:14px;letter-spacing:1.8px;color:#A79B8C;text-transform:uppercase;">Oslo &middot; 59.91 N / 10.75 E</td>
                </tr>
              </table>
              <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:17px;color:#D8CDC0;">Oslo's live food radar. <a href="https://smakr.no" target="_blank" style="color:${ACCENT};text-decoration:none;font-weight:700;">smakr.no</a></p>
              <div style="height:1px;background-color:#332B26;line-height:1px;font-size:1px;margin:16px 0 14px 0;">&nbsp;</div>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:15px;color:#A79B8C;">${reason} Need a hand? <a href="mailto:hei@smakr.no" style="color:#F4EFE7;text-decoration:none;">hei@smakr.no</a></p>
              <p style="margin:6px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:15px;color:#6F655C;">Transactional email from Smakr Oslo. No marketing, no noise.</p>
            </td>
          </tr>
        </table>
        <p style="margin:14px 0 18px 0;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:14px;color:#9C8F7C;text-align:center;">Smakr Oslo &middot; Built for people who plan dinner before lunch.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
