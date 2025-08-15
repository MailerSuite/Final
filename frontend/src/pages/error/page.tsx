import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertTriangle, Home, Mail, RotateCw, LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

function useErrorInfo() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const code = params.get('code') || '404'
  const title = params.get('title') || (code === '404' ? 'Page not found' : 'Something went wrong')
  const message =
    params.get('message') ||
    (code === '404'
      ? "The page you’re looking for doesn’t exist or has moved."
      : 'An unexpected error occurred. Please try again or contact support.')
  return { code, title, message }
}

export default function ErrorPage() {
  const { code, title, message } = useErrorInfo()

  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground">
      <div className="relative w-full max-w-2xl mx-auto px-6">
        <div className="absolute -top-8 left-6 right-6 h-px bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />

        <Card className="border border-border/40 shadow-xl">
          <CardContent className="p-8 md:p-10">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold tracking-wide">Error {code}</span>
            </div>

            <h1 className="mt-3 text-2xl md:text-3xl font-bold">
              {title}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {message}
            </p>

            <ul className="mt-6 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>Check the URL for typos</li>
              <li>Use the navigation to find what you need</li>
              <li>If the issue persists, contact support</li>
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/">
                <Button className="btn-cyber">
                  <Home className="h-4 w-4 mr-2" />
                  Go home
                </Button>
              </Link>
              <Link to="/auth/login">
                <Button variant="secondary">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
              <Link to="/auth/sign-up">
                <Button variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create account
                </Button>
              </Link>
              <a href="mailto:support@example.com" className="inline-flex">
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact support
                </Button>
              </a>
              <Button variant="ghost" onClick={() => window.location.reload()}>
                <RotateCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          If you continue seeing this, include the code <span className="font-mono">{code}</span> when contacting support.
        </div>
      </div>
    </div>
  )
}
