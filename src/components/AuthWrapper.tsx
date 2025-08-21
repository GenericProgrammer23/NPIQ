import React, { useState, useEffect, useRef } from 'react';
import { supabase, DatabaseService } from '../lib/supabase';
import { SetupWizard } from './SetupWizard';
import { DatabaseSetup } from './DatabaseSetup';
import { LogIn, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [needsDatabase, setNeedsDatabase] = useState(false);
  const [isOnline, setIsOnline] = useState(DatabaseService.isConfigured());
  const [authError, setAuthError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  // single-flight + watchdog used by init flow
  const setupInFlight = useRef(false);
  const initWatchdog = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkSetupNeeded = async () => {
    setLoading(true);
    setAuthError(null);
  
    // 10s timeout so the UI never hard-locks
    const timeout = (ms: number) =>
      new Promise((_r, rej) => setTimeout(() => rej(new Error('Setup check timed out')), ms));
  
    try {
      console.log('Checking setup status...');
      // If DatabaseService.hasUserOrganizations exists, use it; otherwise default true so you can proceed
      const hasOrgs = await Promise.race([
        (DatabaseService && typeof DatabaseService.hasUserOrganizations === 'function')
          ? DatabaseService.hasUserOrganizations()
          : Promise.resolve(true),
        timeout(10_000),
      ]);
  
      console.log('Has organizations:', hasOrgs);
      setNeedsSetup(!hasOrgs as boolean);
    } catch (err) {
      console.error('Failed to check setup status:', err);
      // Show setup instead of spinning forever
      setNeedsSetup(true);
    } finally {
      setLoading(false);
      setInitializing(false);
      if (initWatchdog.current) { clearTimeout(initWatchdog.current); initWatchdog.current = null; }
    }
  };

  useEffect(() => {
    // Start a watchdog so the UI can never get stuck indefinitely
    if (initWatchdog.current == null) {
      initWatchdog.current = window.setTimeout(() => {
        console.warn('Init watchdog fired → forcing UI out of initializing');
        setInitializing(false);
        setLoading(false);
        // Don't force needsSetup true/false here; just stop the spinner
      }, 10000); // 10s
    }

    // Check if database connection is needed
    if (!DatabaseService.isConfigured()) {
      setNeedsDatabase(true);
      setLoading(false);
      setInitializing(false);
      if (initWatchdog.current) { clearTimeout(initWatchdog.current); initWatchdog.current = null; }
      return;
    }

    if (!supabase) {
      setLoading(false);
      setInitializing(false);
      if (initWatchdog.current) { clearTimeout(initWatchdog.current); initWatchdog.current = null; }
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Auth session error:', error);
        setAuthError(error.message);
        setUser(null);
        setLoading(false);
        setInitializing(false);
        if (initWatchdog.current) { clearTimeout(initWatchdog.current); initWatchdog.current = null; }
      } else {
        setUser(session?.user ?? null);
        if (session?.user) {
          // single-flight guard
          if (!setupInFlight.current) {
            setupInFlight.current = true;
            checkSetupNeeded().finally(() => { setupInFlight.current = false; });
          }
        } else {
          setLoading(false);
          setInitializing(false);
          if (initWatchdog.current) { clearTimeout(initWatchdog.current); initWatchdog.current = null; }
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state change:', _event, session?.user?.email);
      setUser(session?.user ?? null);
      setAuthError(null);

      if (session?.user) {
        if (!setupInFlight.current) {
          setupInFlight.current = true;
          checkSetupNeeded().finally(() => { setupInFlight.current = false; });
        }
      } else {
        setNeedsSetup(false);
        setLoading(false);
        setInitializing(false);
        if (initWatchdog.current) { clearTimeout(initWatchdog.current); initWatchdog.current = null; }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (initWatchdog.current) { clearTimeout(initWatchdog.current); initWatchdog.current = null; }
    };
  }, []);


    return () => subscription.unsubscribe();
  }, []);

  const checkSetupNeeded = async () => {
    setLoading(true);
    try {
      console.log('Checking setup status...');
      const hasOrgs = await DatabaseService.hasUserOrganizations();
      console.log('Has organizations:', hasOrgs);
      setNeedsSetup(!hasOrgs);
    } catch (error) {
      console.error('Failed to check setup status:', error);
      setNeedsSetup(true);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    if (!supabase) return;
    
    setLoading(true);
    setAuthError(null);
    console.log('Attempting sign in for:', email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('Sign in error:', error);
      setAuthError(error.message);
      setLoading(false);
    }
    // Don't set loading to false here - let the auth state change handle it
  };

  const handleSignUp = async (email: string, password: string) => {
    if (!supabase) return;
    
    setLoading(true);
    setAuthError(null);
    console.log('Attempting sign up for:', email);
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) {
      console.error('Sign up error:', error);
      setAuthError(error.message);
      setLoading(false);
    } else {
      setAuthError('Check your email for the confirmation link!');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setLoading(true);
    await supabase.auth.signOut();
    // Auth state change will handle the rest
  };

  const handleSetupComplete = () => {
    console.log('Setup completed');
    setNeedsSetup(false);
  };

  const handleDatabaseSetupComplete = () => {
    setNeedsDatabase(false);
    setIsOnline(true);
    window.location.reload(); // Reload to reinitialize with new database connection
  };

  // Show loading state
  if (initializing || (loading && !authError)) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod mx-auto mb-4"></div>
          <p className="text-cream">
            {initializing ? 'Initializing...' : 'Loading...'}
          </p>
          <p className="text-cream/60 text-sm mt-2">
            {user ? 'Setting up your workspace...' : 'Connecting to database...'}
          </p>
        </div>
      </div>
    );
  }

  // Show database setup if Supabase not configured
  if (needsDatabase) {
    return <DatabaseSetup onComplete={handleDatabaseSetupComplete} />;
  }

  // Show offline/local mode banner but still allow app usage
  const showOfflineBanner = !isOnline;

  // Show setup wizard if user is authenticated but needs setup
  if (user && needsSetup) {
    return (
      <div className="min-h-screen bg-navy">
        {showOfflineBanner && (
          <div className="bg-goldenrod/20 border-b border-goldenrod/30 p-3">
            <div className="flex items-center justify-center">
              <WifiOff className="h-4 w-4 text-goldenrod mr-2" />
              <span className="text-goldenrod text-sm font-medium">
                Running in Local Mode - Supabase not configured
              </span>
            </div>
          </div>
        )}
        <SetupWizard onComplete={handleSetupComplete} />
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-navy">
        {showOfflineBanner && (
          <div className="bg-goldenrod/20 border-b border-goldenrod/30 p-3">
            <div className="flex items-center justify-center">
              <WifiOff className="h-4 w-4 text-goldenrod mr-2" />
              <span className="text-goldenrod text-sm font-medium">
                Running in Local Mode - Supabase not configured
              </span>
            </div>
          </div>
        )}
        <AuthForm onSignIn={handleSignIn} onSignUp={handleSignUp} error={authError} />
      </div>
    );
  }

  // Show main app with online indicator
  return (
    <div className="min-h-screen bg-navy">
      {isOnline ? (
        <div className="bg-dark-cyan/20 border-b border-dark-cyan/30 p-2">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-4">
            <div className="flex items-center">
              <Wifi className="h-4 w-4 text-dark-cyan mr-2" />
              <span className="text-dark-cyan text-sm">Connected to Supabase</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-cream/70 hover:text-cream text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-goldenrod/20 border-b border-goldenrod/30 p-2">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-4">
            <div className="flex items-center">
              <WifiOff className="h-4 w-4 text-goldenrod mr-2" />
              <span className="text-goldenrod text-sm">Running in Local Mode</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-cream/70 hover:text-cream text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

interface AuthFormProps {
  onSignIn: (email: string, password: string) => void;
  onSignUp: (email: string, password: string) => void;
  error: string | null;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSignIn, onSignUp, error }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      if (isSignUp) {
        await onSignUp(email, password);
      } else {
        await onSignIn(email, password);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cream mb-2">NPIQ</h1>
          <p className="text-cream/70">Healthcare Credentialing System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-600/20 border border-red-600/30 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-cream font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-cream font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-goldenrod hover:bg-goldenrod/90 disabled:bg-goldenrod/50 text-navy px-4 py-3 rounded-lg font-medium flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-navy mr-2"></div>
            ) : (
              <LogIn className="h-5 w-5 mr-2" />
            )}
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-dark-cyan hover:text-dark-cyan/80 text-sm"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-6 p-4 bg-goldenrod/10 border border-goldenrod/20 rounded-lg">
          <p className="text-goldenrod text-sm text-center">
            <strong>Getting Started:</strong><br />
            Create a new account with the Sign Up button above.<br />
            After signing up, you'll be guided through the setup process.
          </p>
        </div>
      </div>
    </div>
  );
};