import './globals.css';

export const metadata = {
  title: 'অক্ষরমালা | বাংলা ই-বুক রিডার',
  description: 'A modern, distraction-free Bengali eBook reading experience.',
  icons: {
    icon: '/icon.png',
  },
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
    <html lang="bn" suppressHydrationWarning>
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
