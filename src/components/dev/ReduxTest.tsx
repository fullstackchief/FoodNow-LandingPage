'use client'

import { useAppSelector } from '@/store'

// Temporary test component to verify Redux setup
export default function ReduxTest() {
  // This will show empty state for now since we haven't added slices yet
  const state = useAppSelector((state) => state)

  return (
    <div className="hidden">
      {/* Hidden dev component - will be removed */}
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  )
}