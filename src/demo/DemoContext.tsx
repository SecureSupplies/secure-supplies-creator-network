import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type Role = 'visitor' | 'creator' | 'admin'

interface DemoState {
  role: Role
  setRole: (r: Role) => void
  demoMode: boolean
}

const DemoContext = createContext<DemoState | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('visitor')
  const value = useMemo(() => ({ role, setRole, demoMode: true }), [role])
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo(): DemoState {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider')
  return ctx
}
