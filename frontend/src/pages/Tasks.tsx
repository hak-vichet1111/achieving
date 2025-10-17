import React from 'react'

const Tasks = () => {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Tasks</h1>
        <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">Coming soon</span>
      </header>

      <section className="bg-card rounded-lg p-6 border border-border">
        <p className="text-muted-foreground">Tasks feature is under construction. Stay tuned!</p>
      </section>
    </div>
  )
}

export default Tasks