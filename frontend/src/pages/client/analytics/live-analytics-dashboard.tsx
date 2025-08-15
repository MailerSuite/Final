import React from 'react';

export default function LiveAnalyticsDashboard() {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Live Analytics Dashboard</h1>
      <div className="rounded-lg border bg-background p-4 sm:p-6">
        <p className="text-muted-foreground">Analytics dashboard content will be implemented here.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Total Campaigns</h3>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Delivery Rate</h3>
            <p className="text-2xl font-bold">0%</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Open Rate</h3>
            <p className="text-2xl font-bold">0%</p>
          </div>
        </div>
      </div>
    </div>
  );
}