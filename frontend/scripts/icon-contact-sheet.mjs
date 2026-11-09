import sharp from 'sharp';
const n = ['hot_cocoa', 'masala_chai', 'basque_cheesecake', 'tacos', 'manakish', 'falafel', 'burger', 'noodles'];
const tiles = await Promise.all(n.map((x) => sharp(`public/icons/food/${x}.webp`).resize(256, 256).flatten({ background: '#8a8a8a' }).png().toBuffer()));
await sharp({ create: { width: 1024, height: 512, channels: 3, background: '#8a8a8a' } })
  .composite(tiles.map((t, i) => ({ input: t, left: (i % 4) * 256, top: Math.floor(i / 4) * 256 })))
  .png()
  .toFile('public/test-icons/contact_sheet.png');
console.log('sheet ok');
