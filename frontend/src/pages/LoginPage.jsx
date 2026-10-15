import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import Button from '../components/common/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/common/Card';
import client from '../api/client';

const LoginPage = () => {
  const [key, setKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await client.post('/auth/session', { api_key: key.trim() });
      if (response.ok) {
        setAuthenticated(true, key.trim());
      } else {
        setError(response.error?.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message || 'Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-purple-500">
              NARI
            </h1>
            <p className="text-secondary text-xs font-semibold uppercase tracking-widest text-center">
              Sovereign Personal AGI
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form id="login-form" onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="api-key" className="text-xs font-bold text-secondary uppercase tracking-wider px-1">
                API Key
              </label>
              <input
                id="api-key"
                type="password"
                placeholder="Paste your NARI_API_KEY"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-danger text-xs font-bold uppercase tracking-tight px-1">
                {error}
              </p>
            )}
          </form>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            form="login-form"
            className="w-full py-4 text-lg font-bold uppercase tracking-widest"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Initialize Neural Link'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
