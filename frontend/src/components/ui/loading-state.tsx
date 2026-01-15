'use client'

import React from 'react'

type LoadingStateProps = {
  title?: string
  description?: string
}

const LoadingState = ({ title = 'Cargando...', description }: LoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-10">
      <div className="h-10 w-10 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
      <div>
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        {description && <p className="text-sm text-slate-600 mt-1">{description}</p>}
      </div>
    </div>
  )
}

export { LoadingState }
