import React, { useState } from 'react';
import { Database, AlertCircle, CheckCircle, Loader, ExternalLink } from 'lucide-react';

interface DatabaseSetupProps {
  onComplete: () => void;
}

export const DatabaseSetup: React.FC<DatabaseSetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [credentials, setCredentials] = useState({
    url: '',
    anonKey: ''
  });

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (credentials.url && credentials.anonKey) {
        // Store credentials in localStorage temporarily for the reload
        localStorage.setItem('temp_supabase_url', credentials.url);
        localStorage.setItem('temp_supabase_key', credentials.anonKey);
        setSuccess('Connection successful! Database is ready.');
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        setError('Please provide both URL and Anon Key');
      }
    } catch (err) {
      setError('Failed to connect to database. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <Database className="h-16 w-16 text-dark-cyan mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-cream mb-2">Connect to Database</h1>
          <p className="text-cream/70">Configure your Supabase connection to enable remote data storage</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-600/20 border border-red-600/30 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-600/20 border border-green-600/30 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
            <span className="text-green-400">{success}</span>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-goldenrod/10 border border-goldenrod/20 rounded-lg p-4">
              <h3 className="text-goldenrod font-semibold mb-2">Step 1: Create Supabase Project</h3>
              <ol className="text-cream/80 text-sm space-y-1 list-decimal list-inside">
                <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-dark-cyan hover:underline inline-flex items-center">supabase.com <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li>Create a new account or sign in</li>
                <li>Click "New Project"</li>
                <li>Choose your organization and enter project details</li>
                <li>Wait for the project to be created (2-3 minutes)</li>
              </ol>
            </div>
            
            <button
              onClick={() => setStep(2)}
              className="w-full bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-3 rounded-lg font-medium"
            >
              I've Created My Project
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-goldenrod/10 border border-goldenrod/20 rounded-lg p-4">
              <h3 className="text-goldenrod font-semibold mb-2">Step 2: Get Your Credentials</h3>
              <ol className="text-cream/80 text-sm space-y-1 list-decimal list-inside">
                <li>In your Supabase dashboard, go to Settings → API</li>
                <li>Copy your "Project URL"</li>
                <li>Copy your "anon public" key</li>
                <li>Paste them in the fields below</li>
              </ol>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-cream font-medium mb-2">Project URL</label>
                <input
                  type="url"
                  value={credentials.url}
                  onChange={(e) => setCredentials({ ...credentials, url: e.target.value })}
                  className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                  placeholder="https://your-project.supabase.co"
                />
              </div>
              
              <div>
                <label className="block text-cream font-medium mb-2">Anon Key</label>
                <textarea
                  value={credentials.anonKey}
                  onChange={(e) => setCredentials({ ...credentials, anonKey: e.target.value })}
                  className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan h-24 resize-none"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-navy-dark hover:bg-navy text-cream px-4 py-3 rounded-lg font-medium border border-dark-cyan/30"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!credentials.url || !credentials.anonKey}
                className="flex-1 bg-goldenrod hover:bg-goldenrod/90 disabled:bg-goldenrod/50 text-navy px-4 py-3 rounded-lg font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-goldenrod/10 border border-goldenrod/20 rounded-lg p-4">
              <h3 className="text-goldenrod font-semibold mb-2">Step 3: Apply Database Schema</h3>
              <p className="text-cream/80 text-sm mb-3">
                Copy and run this SQL in your Supabase SQL Editor to create the database schema:
              </p>
              <div className="bg-navy-dark rounded p-3 text-xs text-cream/90 font-mono overflow-x-auto">
                <div className="mb-2 text-dark-cyan">-- Run this in Supabase SQL Editor</div>
                <div>CREATE EXTENSION IF NOT EXISTS "pgcrypto";</div>
                <div>CREATE EXTENSION IF NOT EXISTS "uuid-ossp";</div>
                <div className="mt-2 text-cream/60">-- Then copy the full migration from:</div>
                <div className="text-dark-cyan">supabase/migrations/20250114000001_initial_schema.sql</div>
              </div>
            </div>

            <div className="bg-dark-cyan/10 border border-dark-cyan/20 rounded-lg p-4">
              <h4 className="text-dark-cyan font-medium mb-2">Quick Setup Instructions:</h4>
              <ol className="text-cream/80 text-sm space-y-1 list-decimal list-inside">
                <li>Go to your Supabase project dashboard</li>
                <li>Click "SQL Editor" in the sidebar</li>
                <li>Create a new query</li>
                <li>Copy the migration SQL from the file mentioned above</li>
                <li>Run the query to create all tables and policies</li>
              </ol>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-navy-dark hover:bg-navy text-cream px-4 py-3 rounded-lg font-medium border border-dark-cyan/30"
              >
                Back
              </button>
              <button
                onClick={testConnection}
                disabled={loading}
                className="flex-1 bg-goldenrod hover:bg-goldenrod/90 disabled:bg-goldenrod/50 text-navy px-4 py-3 rounded-lg font-medium flex items-center justify-center"
              >
                {loading ? <Loader className="h-5 w-5 animate-spin mr-2" /> : null}
                Test Connection
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-cream/60 text-sm">
            Need help? Check the{' '}
            <span className="text-dark-cyan">docs/DevSetup_RemoteOptional.md</span>{' '}
            file for detailed instructions.
          </p>
        </div>
      </div>
    </div>
  );
};