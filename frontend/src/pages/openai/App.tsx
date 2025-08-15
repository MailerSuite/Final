import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"

const Placeholder: React.FC<{ title: string; desc?: string }> = ({ title, desc }) => (
    <div className="mx-auto max-w-3xl">
        <div className="rounded-xl p-8">
            <h1 className="text-2xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">{desc || "This is a placeholder inside the new OpenAI-style layout."}</p>
        </div>
    </div>
)

export const OpenAIApp: React.FC = () => {
    return (
        <Routes>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<Placeholder title="OpenAI Shell" desc="Use the sidebar to navigate. Press ⌘K to search." />} />
            <Route path="playground" element={<Placeholder title="Playground" />} />
            <Route path="settings" element={<Placeholder title="Settings" />} />
            <Route path="*" element={<Navigate to="home" replace />} />
        </Routes>
    )
}

export default OpenAIApp

