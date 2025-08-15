import React from 'react'

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground">Test Page</h1>
      <p className="text-muted-foreground mt-4">
        If you can see this page, the routing is working correctly!
      </p>
      <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <h2 className="text-lg font-semibold text-primary">Routing Status</h2>
        <p className="text-sm text-muted-foreground mt-2">
          ✅ React Router is functioning
          <br />
          ✅ Page components are loading
          <br />
          ✅ Layout system is working
        </p>
      </div>
    </div>
  )
}