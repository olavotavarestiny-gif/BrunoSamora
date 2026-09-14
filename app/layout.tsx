import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
const inter = Inter({variable:'--font-inter',subsets:['latin']});
export const metadata: Metadata = {title:'Bruno Samora — Fit 90',description:'Conhece o Fit 90 de Bruno Samora. Responde a 5 perguntas e recebe o contacto da nossa equipa.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="pt-AO"><body className={inter.variable}>{children}</body></html>}
