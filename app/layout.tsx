import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
const inter = Inter({variable:'--font-inter',subsets:['latin']});
export const metadata: Metadata = {title:'Bruno Samora — O teu próximo passo',description:'Responde a 5 perguntas rápidas e descobre o plano para transformares o teu corpo.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="pt-AO"><body className={inter.variable}>{children}</body></html>}
