import { Anek_Bangla, Noto_Serif_Bengali } from 'next/font/google';
import './globals.css';

// ── Fonts loaded via next/font — eliminates render-blocking @import ──────────
// next/font injects optimised @font-face at build time and automatically
// adds a <link rel="preload"> for each font file. No external request blocks paint.
const anekBangla = Anek_Bangla({
  subsets: ['bengali'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-anek-bangla',
  display: 'swap',
});

const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-noto-serif-bengali',
  display: 'swap',
});

export const metadata = {
  title: 'অক্ষরমালা | বাংলা ই-বুক রিডার',
  description: 'A modern, distraction-free Bengali eBook reading experience.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Runs synchronously before paint — eliminates dark mode flash (FOUC)
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('ebook_theme');
    var isDark = t === 'dark' || (!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var d = document.documentElement;
    if (isDark) {
      d.setAttribute('data-theme', 'dark');
      d.style.setProperty('--bg', '#0c0e14');
      d.style.setProperty('--text', '#f3f4f6');
      d.style.background = '#0c0e14';
      d.style.colorScheme = 'dark';
    } else {
      d.setAttribute('data-theme', 'light');
      d.style.setProperty('--bg', '#faf9f5');
      d.style.setProperty('--text', '#1c1917');
      d.style.background = '#faf9f5';
      d.style.colorScheme = 'light';
    }
  } catch(e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="bn"
      suppressHydrationWarning
      className={`${anekBangla.variable} ${notoSerifBengali.variable}`}
    >
      <head>
        {/* Blocking script: must run before any rendering to prevent FOUC */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased" style={{ backgroundColor: 'var(--bg, #faf9f5)', color: 'var(--text, #1c1917)' }}>
        {children}
      </body>
    </html>
  );
}
