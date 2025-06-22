import '@gravity-ui/uikit/styles/styles.css';
import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Steam Games Analysis',
  description: 'Analyze your Steam games with HowLongToBeat integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
} 