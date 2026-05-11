import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'AsaFood - Otimizador de Vendas iFood',
  description: 'Aumente suas vendas no iFood com diagnósticos e planos de ação baseados em IA.',
  icons: {
    icon: 'https://firebasestorage.googleapis.com/v0/b/studio-8790382792-31236.firebasestorage.app/o/diagnostics%2Fuploads%2FL7jV9uB1qaW0M7TpRLpe7Z5muiB2%2Flogoaba.png?alt=media&token=04692041-acfe-4377-8794-0930d8506a0a',
    apple: 'https://firebasestorage.googleapis.com/v0/b/studio-8790382792-31236.firebasestorage.app/o/diagnostics%2Fuploads%2FL7jV9uB1qaW0M7TpRLpe7Z5muiB2%2Flogoaba.png?alt=media&token=04692041-acfe-4377-8794-0930d8506a0a',
  },
  appleWebApp: {
    title: 'AsaFood',
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Saira:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
