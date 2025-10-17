import React from 'react'

const Goals = () => {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Goals</h1>
        <p className="text-muted-foreground">Plan and track goals to achieve.</p>
      </header>

      <section className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold mb-4">Create a new goal</h2>
        <p className="text-muted-foreground">Simple goal creation form will be added shortly.</p>
      </section>

      <section className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold mb-4">Your goals</h2>
        <p className="text-muted-foreground">Goal list will appear here once created.</p>
      </section>
    </div>
  )
}

export default Goals