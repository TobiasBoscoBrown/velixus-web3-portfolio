'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Block {
  number: number
  hash: string
  txCount: number
  gasUsed: number
  timestamp: number
  miner: string
}

function genHex(len: number): string {
  const c = '0123456789abcdef'
  let s = ''
  for (let i = 0; i < len; i++) s += c[Math.floor(Math.random() * 16)]
  return s
}

export default function BlockchainVisualizer() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [tps, setTps] = useState(0)
  const [totalTx, setTotalTx] = useState(0)

  useEffect(() => {
    const initial: Block[] = Array.from({ length: 6 }, (_, i) => ({
      number: 19840000 + i,
      hash: '0x' + genHex(64),
      txCount: Math.floor(Math.random() * 200 + 50),
      gasUsed: Math.floor(Math.random() * 15000000 + 5000000),
      timestamp: Date.now() - (5 - i) * 12000,
      miner: '0x' + genHex(40),
    }))
    setBlocks(initial)
    setTotalTx(initial.reduce((a, b) => a + b.txCount, 0))

    const interval = setInterval(() => {
      setBlocks(prev => {
        const last = prev[prev.length - 1]
        const newBlock: Block = {
          number: last.number + 1,
          hash: '0x' + genHex(64),
          txCount: Math.floor(Math.random() * 200 + 50),
          gasUsed: Math.floor(Math.random() * 15000000 + 5000000),
          timestamp: Date.now(),
          miner: '0x' + genHex(40),
        }
        setTotalTx(t => t + newBlock.txCount)
        setTps(Math.floor(newBlock.txCount / 12))
        return [...prev.slice(-7), newBlock]
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <p className="text-2xl font-bold text-neon-blue font-mono">{blocks[blocks.length - 1]?.number.toLocaleString() || '—'}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Latest Block</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <p className="text-2xl font-bold text-neon-green font-mono">{tps}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">TPS</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <p className="text-2xl font-bold text-neon-purple font-mono">{totalTx.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Total TX</p>
        </div>
      </div>

      {/* Block chain visualization */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <AnimatePresence mode="popLayout">
          {blocks.slice(-6).map((block, i) => (
            <motion.div
              key={block.number}
              initial={{ opacity: 0, scale: 0.8, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -50 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div className={`w-[130px] p-3 rounded-lg border transition-all duration-500 ${
                i === blocks.slice(-6).length - 1
                  ? 'border-neon-blue/40 bg-neon-blue/5 glow-blue'
                  : 'border-white/[0.06] bg-white/[0.02]'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-neon-blue">#{block.number}</span>
                  <div className={`w-2 h-2 rounded-full ${i === blocks.slice(-6).length - 1 ? 'bg-neon-green animate-pulse' : 'bg-gray-600'}`} />
                </div>
                <p className="text-[9px] font-mono text-gray-500 truncate">{block.hash.slice(0, 14)}...</p>
                <div className="flex justify-between mt-2">
                  <span className="text-[9px] text-gray-400">{block.txCount} txns</span>
                  <span className="text-[9px] text-gray-500">{(block.gasUsed / 1e6).toFixed(1)}M gas</span>
                </div>
              </div>
              {i < blocks.slice(-6).length - 1 && (
                <div className="flex-shrink-0">
                  <div className="w-4 h-[2px] bg-gradient-to-r from-neon-blue/40 to-neon-blue/10" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
