import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
const inter = Inter({variable:'--font-inter',subsets:['latin']});
export const metadata: Metadata = {title:'Bruno Samora — Fit 90',description:'Conhece o Fit 90 de Bruno Samora. Descobre o teu plano: Light, Performance ou Gold. Responde a 6 perguntas e escolhe o teu ritmo.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="pt-AO"><body className={inter.variable}>{children}</body></html>}
