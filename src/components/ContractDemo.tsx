'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, CheckCircle, AlertCircle, Loader2, Terminal, Copy, Check } from 'lucide-react'

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  status: 'pending' | 'confirmed' | 'failed'
  gasUsed: string
  block: number
}

interface ContractDemoProps {
  title: string
  description: string
  contractCode: string
  language?: string
  actions: { label: string; action: string; params?: string }[]
  color: 'blue' | 'green' | 'purple' | 'orange'
}

const colorMap = {
  blue: { bg: 'from-neon-blue/10 to-neon-blue/5', border: 'border-neon-blue/20', text: 'text-neon-blue', glow: 'glow-blue' },
  green: { bg: 'from-neon-green/10 to-neon-green/5', border: 'border-neon-green/20', text: 'text-neon-green', glow: 'glow-green' },
  purple: { bg: 'from-neon-purple/10 to-neon-purple/5', border: 'border-neon-purple/20', text: 'text-neon-purple', glow: 'glow-purple' },
  orange: { bg: 'from-neon-orange/10 to-neon-orange/5', border: 'border-neon-orange/20', text: 'text-neon-orange', glow: '' },
}

function generateHash(): string {
  const chars = '0123456789abcdef'
  let hash = '0x'
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * chars.length)]
  return hash
}

function generateAddress(): string {
  const chars = '0123456789abcdef'
  let addr = '0x'
  for (let i = 0; i < 40; i++) addr += chars[Math.floor(Math.random() * chars.length)]
  return addr
}

export default function ContractDemo({ title, description, contractCode, actions, color }: ContractDemoProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'code' | 'console'>('code')
  const colors = colorMap[color]

  const simulateTransaction = useCallback(async (actionLabel: string) => {
    setIsRunning(true)
    setActiveTab('console')

    const txHash = generateHash()
    const fromAddr = generateAddress()
    const toAddr = generateAddress()

    setLogs(prev => [...prev, `> Executing ${actionLabel}...`])
    
    const newTx: Transaction = {
      hash: txHash,
      from: fromAddr,
      to: toAddr,
      value: (Math.random() * 5).toFixed(4) + ' ETH',
      status: 'pending',
      gasUsed: Math.floor(Math.random() * 150000 + 21000).toString(),
      block: Math.floor(Math.random() * 1000000 + 19000000),
    }

    setTransactions(prev => [newTx, ...prev])
    setLogs(prev => [...prev, `  TX Hash: ${txHash.slice(0, 22)}...`])

    await new Promise(r => setTimeout(r, 800))
    setLogs(prev => [...prev, `  Compiling contract...`])

    await new Promise(r => setTimeout(r, 600))
    setLogs(prev => [...prev, `  Gas estimation: ${newTx.gasUsed} gas`])

    await new Promise(r => setTimeout(r, 500))
    setLogs(prev => [...prev, `  Broadcasting to network...`])

    await new Promise(r => setTimeout(r, 1200))
    
    const success = Math.random() > 0.1
    setTransactions(prev =>
      prev.map(tx =>
        tx.hash === txHash ? { ...tx, status: success ? 'confirmed' : 'failed' } : tx
      )
    )

    setLogs(prev => [
      ...prev,
      success
        ? `  ✓ Confirmed in block #${newTx.block}`
        : `  ✗ Transaction reverted`,
      `  Gas used: ${newTx.gasUsed}`,
      '',
    ])

    setIsRunning(false)
  }, [])

  const copyCode = () => {
    navigator.clipboard.writeText(contractCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} overflow-hidden`}
    >
      <div className="p-6 border-b border-white/[0.06]">
        <div className="flex items-start justify-between">
          <div>
            <h3 className={`text-xl font-bold ${colors.text}`}>{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-yellow-400 animate-pulse' : 'bg-neon-green'}`} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06]">
        <button
          onClick={() => setActiveTab('code')}
          className={`px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'code' ? `${colors.text} border-b-2 border-current` : 'text-gray-500 hover:text-gray-300'}`}
        >
          Contract Code
        </button>
        <button
          onClick={() => setActiveTab('console')}
          className={`px-4 py-2 text-xs font-medium transition-colors flex items-center gap-1 ${activeTab === 'console' ? `${colors.text} border-b-2 border-current` : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Terminal className="w-3 h-3" />
          Console
          {logs.length > 0 && (
            <span className="ml-1 w-4 h-4 rounded-full bg-neon-blue/20 text-neon-blue text-[10px] flex items-center justify-center">
              {logs.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === 'code' ? (
            <motion.div
              key="code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <button
                onClick={copyCode}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-neon-green" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
              </button>
              <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto max-h-[300px] overflow-y-auto text-gray-300">
                <code>{contractCode}</code>
              </pre>
            </motion.div>
          ) : (
            <motion.div
              key="console"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#0a0b0f] p-4 max-h-[300px] overflow-y-auto font-mono text-xs"
            >
              {logs.length === 0 ? (
                <p className="text-gray-600">No transactions yet. Click an action below to simulate.</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`${log.includes('✓') ? 'text-neon-green' : log.includes('✗') ? 'text-red-400' : log.startsWith('>') ? colors.text : 'text-gray-400'}`}>
                    {log || '\u00A0'}
                  </div>
                ))
              )}
              {isRunning && (
                <div className="flex items-center gap-2 text-yellow-400 mt-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing...
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-white/[0.06] flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => simulateTransaction(action.label)}
            disabled={isRunning}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${isRunning
                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                : `bg-white/5 ${colors.text} hover:bg-white/10 hover:scale-105`
              }`}
          >
            <Play className="w-3 h-3" />
            {action.label}
          </button>
        ))}
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Recent Transactions</p>
          <div className="space-y-1">
            {transactions.slice(0, 3).map((tx) => (
              <div key={tx.hash} className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  {tx.status === 'confirmed' ? (
                    <CheckCircle className="w-3 h-3 text-neon-green" />
                  ) : tx.status === 'failed' ? (
                    <AlertCircle className="w-3 h-3 text-red-400" />
                  ) : (
                    <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
                  )}
                  <span className="font-mono text-gray-400">{tx.hash.slice(0, 14)}...</span>
                </div>
                <span className="text-gray-500">{tx.gasUsed} gas</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
