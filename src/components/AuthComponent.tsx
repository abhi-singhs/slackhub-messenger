import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Github, AlertTriangle, Sun, Moon } from 'lucide-react'
import { GoogleLogo } from '@phosphor-icons/react'
import { useAuth } from '@/hooks/useAuth'
import { isSupabaseConfigured, getConfigurationMessage } from '@/lib/supabase'
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings'

export const AuthComponent = () => {
  const { signInWithGitHub, signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<'github' | 'google' | null>(null)
  const [error, setError] = useState('')
  const { isDarkMode, toggleDarkMode, updateColorTheme, theme } = useSupabaseSettings()

  const handleGitHubSignIn = async () => {
    setLoading(true)
    setProvider('github')
    setError('')

    try {
      const { error } = await signInWithGitHub()
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('Failed to sign in with GitHub')
    } finally {
      setLoading(false)
      setProvider(null)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setProvider('google')
    setError('')

    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('Failed to sign in with Google')
    } finally {
      setLoading(false)
      setProvider(null)
    }
  }

  const resetError = () => setError('')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[var(--color-bg)] to-[var(--color-bg-inset)] p-4">
      <Card className="w-full max-w-md border-accent-7/40 shadow-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <CardTitle className="text-2xl font-bold">Welcome to SlackHub Messenger</CardTitle>
              <CardDescription>Sign in with GitHub or Google</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle dark mode"
              onClick={toggleDarkMode}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
          
          {/* Configuration Warning */}
          {!isSupabaseConfigured() && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {getConfigurationMessage()}
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-center gap-2">
              {['blue','green','purple','orange','red'].map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Switch to ${c} theme`}
                  onClick={() => updateColorTheme(c)}
                  className={
                    `h-7 w-7 rounded-full ring-2 transition focus:outline-none focus:ring-2 focus:ring-accent-9 ` +
                    (theme === c ? 'ring-accent-9 scale-105' : 'ring-transparent hover:scale-105')
                  }
                  style={{
                    background:
                      c === 'blue' ? 'linear-gradient(135deg, #60a5fa, #2563eb)'
                      : c === 'green' ? 'linear-gradient(135deg, #34d399, #059669)'
                      : c === 'purple' ? 'linear-gradient(135deg, #a78bfa, #7c3aed)'
                      : c === 'orange' ? 'linear-gradient(135deg, #fb923c, #ea580c)'
                      : 'linear-gradient(135deg, #f87171, #dc2626)'
                  }}
                />
              ))}
            </div>
          </div>

          <div onFocus={resetError} className="mt-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Continue with
                </span>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <Button 
                variant="outline" 
                className="w-full border-border dark:border-accent-6 bg-background dark:bg-secondary/40 text-foreground hover:!bg-accent-9 hover:!text-accent-contrast hover:!border-accent-9 dark:hover:!bg-accent-9 dark:hover:!text-accent-contrast dark:hover:!border-accent-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-9 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleGitHubSignIn}
                disabled={loading}
              >
                {loading && provider === 'github' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Github className="mr-2 h-4 w-4" />
                )}
                GitHub
              </Button>

              <Button 
                variant="outline" 
                className="w-full border-border dark:border-accent-6 bg-background dark:bg-secondary/40 text-foreground hover:!bg-accent-9 hover:!text-accent-contrast hover:!border-accent-9 dark:hover:!bg-accent-9 dark:hover:!text-accent-contrast dark:hover:!border-accent-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-9 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                {loading && provider === 'google' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <GoogleLogo className="mr-2 h-4 w-4" />
                )}
                Google
              </Button>
            </div>
          </div>

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}