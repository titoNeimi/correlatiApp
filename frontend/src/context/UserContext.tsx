"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type User = { id: string; email: string; role: string } | null

type Context = {
	user: User
  isLoading: boolean
  isLoggedIn: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const UserContext = createContext<Context | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function refresh() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        setUser(null)
        return
      }
      const data = await res.json()
      setUser({ id: data.id, email: data.email, role: data.role })
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  const value: Context = {
    user,
    isLoading,
    isLoggedIn: !!user,
    refresh,
    logout,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
