import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Counsel | Secure Legal Case Management',
  description: 'Zero-trust cryptographic legal case management system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="animate-fade-in">
          {children}
        </main>
      </body>
    </html>
  );
}
