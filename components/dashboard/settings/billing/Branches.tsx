import React from "react"

export function Branches() {
  const branches = [
    { name: "Main Branch", status: "Included" },
    { name: "North Branch", status: "Included" },
    { name: "East Branch", status: "Add-on" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {branches.map((b) => (
        <div key={b.name} className="border rounded-lg p-4">
          <div className="font-medium">{b.name}</div>
          <div className="text-xs text-gray-600 mb-3">{b.status}</div>
          <button className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">
            Configure
          </button>
        </div>
      ))}
    </div>
  )
}
