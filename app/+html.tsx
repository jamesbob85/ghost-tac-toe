import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#f0e6d2" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,700;0,900;1,400;1,700&family=Special+Elite&family=Yeseva+One&display=swap"
        />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const PAPER_NOISE_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='4' stitchTiles='stitch'/>
    <feColorMatrix values='0 0 0 0 0.36   0 0 0 0 0.28   0 0 0 0 0.16   0 0 0 0.18 0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(%23n)'/>
</svg>`;

const PAPER_FIBERS_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='340' height='340'>
  <filter id='f'>
    <feTurbulence type='turbulence' baseFrequency='0.012' numOctaves='2' seed='9'/>
    <feColorMatrix values='0 0 0 0 0.42   0 0 0 0 0.34   0 0 0 0 0.18   0 0 0 0.06 0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(%23f)'/>
</svg>`;

const GLOBAL_CSS = `
  html, body, #root { height: 100%; background: #f0e6d2; }
  body {
    margin: 0;
    font-family: "Crimson Pro", "Iowan Old Style", serif;
    color: #1a1611;
    background-color: #f0e6d2;
    background-image:
      url("${PAPER_NOISE_SVG}"),
      url("${PAPER_FIBERS_SVG}"),
      radial-gradient(circle at 20% 0%, rgba(184, 146, 77, 0.08), transparent 50%),
      radial-gradient(circle at 100% 100%, rgba(94, 19, 32, 0.05), transparent 55%);
    background-blend-mode: multiply, multiply, normal, normal;
    background-attachment: fixed, fixed, fixed, fixed;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    overflow-x: hidden;
  }
  #root { background: transparent !important; }
  ::selection { background: #8b1e2d; color: #f0e6d2; }
  * { -webkit-tap-highlight-color: transparent; }
`;
