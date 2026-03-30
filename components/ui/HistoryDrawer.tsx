'use client'

import { useEffect, useRef } from 'react'
import { StageResult } from '@/lib/types/analysis'

export interface HistoryEntry {
  id: string
  timestamp: number
  input_preview: string
  result: StageResult
}

const STORAGE_KEY = 'sbd_history'
const MAX_ENTRIES = 5

export function saveToHistory(input: string, result: StageResult): HistoryEntry {
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    input_preview: input.slice(0, 80),
    result,
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const existing: HistoryEntry[] = raw ? JSON.parse(raw) : []
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}
  return entry
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function formatTimestamp(ts: number) {
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

interface HistoryDrawerProps {
  entries: HistoryEntry[]
  onSelect: (entry: HistoryEntry) => void
  onClose: () => void
}

export function HistoryDrawer({ entries, onSelect, onClose }: HistoryDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Small timeout so the open click doesn't immediately close
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 100)
    return () => {
      clearTimeout(id)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        style={{ animation: 'sectionReveal 300ms ease both' }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 h-full z-50 w-80 border-l border-white/[0.07] flex flex-col"
        style={{
          background: '#0d0d14',
          animation: 'drawerSlideIn 350ms cubic-bezier(0.16,1,0.3,1) forwards',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-semibold text-white">Past Sessions</h2>
            <p className="text-[10px] text-white/30 font-mono mt-0.5">{entries.length} saved</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all duration-200"
          >
            ✕
          </button>
        </div>

        {/* Entry list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#6366f1]/40 text-2xl mb-3">🧠</p>
              <p className="text-white/25 text-xs font-mono">No sessions yet</p>
            </div>
          ) : (
            entries.map((entry, i) => (
              <button
                key={entry.id}
                onClick={() => { onSelect(entry); onClose() }}
                className="w-full text-left rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-[#6366f1]/08 hover:border-[#6366f1]/20 p-3 transition-all duration-200"
                style={{
                  animation: `sectionReveal 300ms ${i * 50}ms cubic-bezier(0.16,1,0.3,1) both`,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-[#6366f1]/60">
                    #{entry.id.slice(-5)}
                  </span>
                  <span className="text-[9px] font-mono text-white/25">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed line-clamp-2 font-mono">
                  {entry.input_preview}
                  {entry.input_preview.length >= 80 && '…'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {entry.result.parse && (
                    <span className="text-[9px] text-white/20 bg-white/[0.04] rounded px-1.5 py-0.5 font-mono">
                      {entry.result.parse.thoughts.length} thoughts
                    </span>
                  )}
                  {entry.result.conflicts && (
                    <span className="text-[9px] text-[#ef4444]/40 bg-[#ef4444]/[0.05] rounded px-1.5 py-0.5 font-mono">
                      {entry.result.conflicts.conflicts.length} conflicts
                    </span>
                  )}
                  {entry.result.reflect && (
                    <span className="text-[9px] text-[#8b5cf6]/40 bg-[#8b5cf6]/[0.05] rounded px-1.5 py-0.5 font-mono">
                      {entry.result.reflect.questions.length} ?s
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <p className="text-[9px] text-white/20 font-mono text-center">
            Max {MAX_ENTRIES} sessions · oldest dropped automatically
          </p>
        </div>
      </div>
    </>
  )
}
