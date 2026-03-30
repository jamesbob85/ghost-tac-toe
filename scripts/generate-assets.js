const sharp = require('sharp');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

// Ghost Tac Toe icon: dark background with a stylized ghost + X/O marks
// Design: centered ghost silhouette with an X and O floating beside it

async function generateIcon() {
  const size = 1024;
  const svg = `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#1a1a3a"/>
        <stop offset="100%" stop-color="#0f0f23"/>
      </radialGradient>
      <radialGradient id="ghostGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <!-- Background -->
    <rect width="${size}" height="${size}" fill="url(#bg)" rx="200"/>

    <!-- Glow behind ghost -->
    <ellipse cx="512" cy="480" rx="280" ry="300" fill="url(#ghostGlow)"/>

    <!-- Ghost body -->
    <path d="
      M 512 180
      C 340 180, 280 320, 280 460
      L 280 700
      C 280 730, 310 730, 330 700
      C 350 670, 370 700, 390 730
      C 410 760, 430 730, 450 700
      C 470 670, 490 700, 512 730
      C 534 700, 554 670, 574 700
      C 594 730, 614 760, 634 730
      C 654 700, 674 670, 694 700
      C 714 730, 744 730, 744 700
      L 744 460
      C 744 320, 684 180, 512 180
      Z
    " fill="#e8e0f0" opacity="0.92"/>

    <!-- Ghost eyes -->
    <ellipse cx="420" cy="400" rx="42" ry="50" fill="#1a1a3a"/>
    <ellipse cx="604" cy="400" rx="42" ry="50" fill="#1a1a3a"/>

    <!-- Eye shine -->
    <ellipse cx="432" cy="385" rx="14" ry="16" fill="#ffffff" opacity="0.9"/>
    <ellipse cx="616" cy="385" rx="14" ry="16" fill="#ffffff" opacity="0.9"/>

    <!-- Ghost mouth (small o) -->
    <ellipse cx="512" cy="500" rx="28" ry="30" fill="#1a1a3a"/>

    <!-- X mark (top-left, purple) -->
    <g transform="translate(160, 120)" opacity="0.95">
      <line x1="0" y1="0" x2="100" y2="100" stroke="#8b5cf6" stroke-width="22" stroke-linecap="round"/>
      <line x1="100" y1="0" x2="0" y2="100" stroke="#8b5cf6" stroke-width="22" stroke-linecap="round"/>
    </g>

    <!-- O mark (top-right, cyan) -->
    <circle cx="800" cy="170" r="52" fill="none" stroke="#06b6d4" stroke-width="20" opacity="0.95"/>

    <!-- Small tic tac toe grid lines (bottom right, subtle) -->
    <g transform="translate(720, 640)" opacity="0.25">
      <line x1="0" y1="60" x2="180" y2="60" stroke="#94a3b8" stroke-width="4"/>
      <line x1="0" y1="120" x2="180" y2="120" stroke="#94a3b8" stroke-width="4"/>
      <line x1="60" y1="0" x2="60" y2="180" stroke="#94a3b8" stroke-width="4"/>
      <line x1="120" y1="0" x2="120" y2="180" stroke="#94a3b8" stroke-width="4"/>
    </g>
  </svg>`;

  // Full icon (1024x1024 with rounded corners baked in)
  await sharp(Buffer.from(svg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS_DIR, 'icon.png'));
  console.log('✅ icon.png (1024x1024)');

  // Adaptive icon foreground — ghost only, no background, centered with padding
  // Android adaptive icons use a 108dp canvas with 72dp safe zone (66.67%)
  const adaptiveSvg = `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <!-- Transparent background — Android will add adaptive bg -->
    <rect width="1024" height="1024" fill="none"/>

    <!-- Ghost body (scaled to fit inside the 66% safe zone) -->
    <g transform="translate(100, 60) scale(0.8)">
      <path d="
        M 512 180
        C 340 180, 280 320, 280 460
        L 280 700
        C 280 730, 310 730, 330 700
        C 350 670, 370 700, 390 730
        C 410 760, 430 730, 450 700
        C 470 670, 490 700, 512 730
        C 534 700, 554 670, 574 700
        C 594 730, 614 760, 634 730
        C 654 700, 674 670, 694 700
        C 714 730, 744 730, 744 700
        L 744 460
        C 744 320, 684 180, 512 180
        Z
      " fill="#e8e0f0" opacity="0.95"/>
      <ellipse cx="420" cy="400" rx="42" ry="50" fill="#1a1a3a"/>
      <ellipse cx="604" cy="400" rx="42" ry="50" fill="#1a1a3a"/>
      <ellipse cx="432" cy="385" rx="14" ry="16" fill="#ffffff" opacity="0.9"/>
      <ellipse cx="616" cy="385" rx="14" ry="16" fill="#ffffff" opacity="0.9"/>
      <ellipse cx="512" cy="500" rx="28" ry="30" fill="#1a1a3a"/>
    </g>

    <!-- X mark -->
    <g transform="translate(180, 150)" opacity="0.9">
      <line x1="0" y1="0" x2="80" y2="80" stroke="#8b5cf6" stroke-width="18" stroke-linecap="round"/>
      <line x1="80" y1="0" x2="0" y2="80" stroke="#8b5cf6" stroke-width="18" stroke-linecap="round"/>
    </g>

    <!-- O mark -->
    <circle cx="770" cy="200" r="42" fill="none" stroke="#06b6d4" stroke-width="16" opacity="0.9"/>
  </svg>`;

  await sharp(Buffer.from(adaptiveSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));
  console.log('✅ adaptive-icon.png (1024x1024)');

  // Splash screen — ghost centered on dark bg
  const splashSvg = `
  <svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
    <rect width="1284" height="2778" fill="#0f0f23"/>
    <g transform="translate(392, 1039) scale(0.5)">
      <path d="
        M 512 180
        C 340 180, 280 320, 280 460
        L 280 700
        C 280 730, 310 730, 330 700
        C 350 670, 370 700, 390 730
        C 410 760, 430 730, 450 700
        C 470 670, 490 700, 512 730
        C 534 700, 554 670, 574 700
        C 594 730, 614 760, 634 730
        C 654 700, 674 670, 694 700
        C 714 730, 744 730, 744 700
        L 744 460
        C 744 320, 684 180, 512 180
        Z
      " fill="#e8e0f0" opacity="0.9"/>
      <ellipse cx="420" cy="400" rx="42" ry="50" fill="#1a1a3a"/>
      <ellipse cx="604" cy="400" rx="42" ry="50" fill="#1a1a3a"/>
      <ellipse cx="432" cy="385" rx="14" ry="16" fill="#ffffff" opacity="0.9"/>
      <ellipse cx="616" cy="385" rx="14" ry="16" fill="#ffffff" opacity="0.9"/>
      <ellipse cx="512" cy="500" rx="28" ry="30" fill="#1a1a3a"/>
    </g>
    <text x="642" y="1500" font-family="sans-serif" font-size="72" font-weight="900"
          fill="#f1f5f9" text-anchor="middle" letter-spacing="-2">Ghost Tac Toe</text>
  </svg>`;

  await sharp(Buffer.from(splashSvg))
    .resize(1284, 2778)
    .png()
    .toFile(path.join(ASSETS_DIR, 'splash.png'));
  console.log('✅ splash.png (1284x2778)');

  // Feature graphic for Play Store (1024x500)
  const featureSvg = `
  <svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fbg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1a1a3a"/>
        <stop offset="100%" stop-color="#0f0f23"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="500" fill="url(#fbg)"/>

    <!-- Ghost (left side) -->
    <g transform="translate(50, 40) scale(0.42)">
      <path d="
        M 512 180
        C 340 180, 280 320, 280 460
        L 280 700
        C 280 730, 310 730, 330 700
        C 350 670, 370 700, 390 730
        C 410 760, 430 730, 450 700
        C 470 670, 490 700, 512 730
        C 534 700, 554 670, 574 700
        C 594 730, 614 760, 634 730
        C 654 700, 674 670, 694 700
        C 714 730, 744 730, 744 700
        L 744 460
        C 744 320, 684 180, 512 180
        Z
      " fill="#e8e0f0" opacity="0.9"/>
      <ellipse cx="420" cy="400" rx="42" ry="50" fill="#1a1a3a"/>
      <ellipse cx="604" cy="400" rx="42" ry="50" fill="#1a1a3a"/>
      <ellipse cx="432" cy="385" rx="14" ry="16" fill="#ffffff"/>
      <ellipse cx="616" cy="385" rx="14" ry="16" fill="#ffffff"/>
      <ellipse cx="512" cy="500" rx="28" ry="30" fill="#1a1a3a"/>
    </g>

    <!-- Title text -->
    <text x="560" y="200" font-family="sans-serif" font-size="64" font-weight="900"
          fill="#f1f5f9" text-anchor="left" letter-spacing="-1">Ghost Tac Toe</text>

    <!-- Tagline -->
    <text x="560" y="260" font-family="sans-serif" font-size="28" font-weight="600"
          fill="#94a3b8" text-anchor="left">Your marks vanish. Outsmart the ghost.</text>

    <!-- X and O marks -->
    <g transform="translate(560, 300)" opacity="0.8">
      <line x1="0" y1="0" x2="60" y2="60" stroke="#8b5cf6" stroke-width="14" stroke-linecap="round"/>
      <line x1="60" y1="0" x2="0" y2="60" stroke="#8b5cf6" stroke-width="14" stroke-linecap="round"/>
    </g>
    <circle cx="700" cy="330" r="32" fill="none" stroke="#06b6d4" stroke-width="12" opacity="0.8"/>

    <!-- Mini grid -->
    <g transform="translate(790, 290)" opacity="0.4">
      <line x1="0" y1="50" x2="150" y2="50" stroke="#94a3b8" stroke-width="3"/>
      <line x1="0" y1="100" x2="150" y2="100" stroke="#94a3b8" stroke-width="3"/>
      <line x1="50" y1="0" x2="50" y2="150" stroke="#94a3b8" stroke-width="3"/>
      <line x1="100" y1="0" x2="100" y2="150" stroke="#94a3b8" stroke-width="3"/>
    </g>
  </svg>`;

  await sharp(Buffer.from(featureSvg))
    .resize(1024, 500)
    .png()
    .toFile(path.join(ASSETS_DIR, 'feature-graphic.png'));
  console.log('✅ feature-graphic.png (1024x500)');

  // Play Store icon (512x512, no alpha, no rounded corners)
  const storeIconSvg = `
  <svg width="512" height="512" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg2" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#1a1a3a"/>
        <stop offset="100%" stop-color="#0f0f23"/>
      </radialGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#bg2)"/>
    <g transform="translate(100, 60) scale(0.8)">
      <path d="
        M 512 180
        C 340 180, 280 320, 280 460
        L 280 700
        C 280 730, 310 730, 330 700
        C 350 670, 370 700, 390 730
        C 410 760, 430 730, 450 700
        C 470 670, 490 700, 512 730
        C 534 700, 554 670, 574 700
        C 594 730, 614 760, 634 730
        C 654 700, 674 670, 694 700
        C 714 730, 744 730, 744 700
        L 744 460
        C 744 320, 684 180, 512 180
        Z
      " fill="#e8e0f0" opacity="0.95"/>
      <ellipse cx="420" cy="400" rx="42" ry="50" fill="#1a1a3a"/>
      <ellipse cx="604" cy="400" rx="42" ry="50" fill="#1a1a3a"/>
      <ellipse cx="432" cy="385" rx="14" ry="16" fill="#ffffff" opacity="0.9"/>
      <ellipse cx="616" cy="385" rx="14" ry="16" fill="#ffffff" opacity="0.9"/>
      <ellipse cx="512" cy="500" rx="28" ry="30" fill="#1a1a3a"/>
    </g>
    <g transform="translate(180, 150)" opacity="0.9">
      <line x1="0" y1="0" x2="80" y2="80" stroke="#8b5cf6" stroke-width="18" stroke-linecap="round"/>
      <line x1="80" y1="0" x2="0" y2="80" stroke="#8b5cf6" stroke-width="18" stroke-linecap="round"/>
    </g>
    <circle cx="770" cy="200" r="42" fill="none" stroke="#06b6d4" stroke-width="16" opacity="0.9"/>
  </svg>`;

  await sharp(Buffer.from(storeIconSvg))
    .resize(512, 512)
    .flatten({ background: { r: 15, g: 15, b: 35 } }) // No alpha for Play Store
    .png()
    .toFile(path.join(ASSETS_DIR, 'play-store-icon.png'));
  console.log('✅ play-store-icon.png (512x512, no alpha)');
}

generateIcon().catch(console.error);
