import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Senior Blockchain Developer | Web3 & Smart Contract Portfolio',
  description: 'Production-grade smart contracts, DeFi protocols, NFT platforms, and blockchain infrastructure. Solidity, EVM, Layer 2, cross-chain development.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
