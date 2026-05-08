import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import Button from '../components/common/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/common/Card';

const LoginPage = () => {
  const [key, setKey] = useState('');
  const setApiKey = useAuthStore((state) => state.setApiKey);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (key.trim()) {
      setApiKey(key.trim());
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
            <p className="text-secondary text-sm font-medium uppercase tracking-widest">
              Access Intelligence
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
              />
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            form="login-form"
            className="w-full py-4 text-lg font-bold uppercase tracking-widest"
          >
            Unlock NARI
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
