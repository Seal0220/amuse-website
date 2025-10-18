import '@/app/globals.css';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import TransitionLayout from '@/app/components/TransitionLayout';

import { Noto_Serif_SC } from 'next/font/google';

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata = {
  title: '阿木司 AMUSE',
  description: 'Amuse Art and Design 官方網站',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body className={`${notoSerifSC.className} bg-neutral-800 text-white`}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
