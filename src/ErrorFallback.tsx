import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Warning, ArrowClockwise } from "@phosphor-icons/react";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Enhanced error fallback component with better error reporting and user experience
 * Provides actionable feedback when the application encounters runtime errors
 */
export const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  // In development mode, let the error bubble up for better debugging experience
  if (import.meta.env.DEV) {
    console.error('Application Error:', error);
    throw error;
  }

  // Log error to console for production debugging
  console.error('Production Error:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-6">
          <Warning className="h-4 w-4" />
          <AlertTitle>Application Error</AlertTitle>
          <AlertDescription>
            SlackHub Messenger encountered an unexpected error. This has been logged for investigation. 
            You can try refreshing the page or contact support if the issue persists.
          </AlertDescription>
        </Alert>
        
        <div className="bg-card border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">Error Details:</h3>
          <pre className="text-xs text-destructive bg-muted/50 p-3 rounded border overflow-auto max-h-32">
            {error.message}
          </pre>
          {error.stack && (
            <details className="mt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                Show stack trace
              </summary>
              <pre className="text-xs text-muted-foreground bg-muted/30 p-2 rounded mt-2 overflow-auto max-h-40">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        
        <div className="space-y-2">
          <Button
            onClick={resetErrorBoundary}
            className="w-full"
            variant="outline"
          >
            <ArrowClockwise className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
            variant="secondary"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
}
