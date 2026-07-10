'use client';

import { useState } from 'react';
import { User, Lock, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SettingsDashboard() {
  const [activeTab, setActiveTab] = useState('account');

  return (
    <div className="flex flex-col md:flex-row gap-8 animate-fade-in">
      {/* Sidebar */}
      <div className="w-full md:w-64 flex flex-row md:flex-col gap-2 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all ${
            activeTab === 'account' ? 'clay-inset text-brand-primary' : 'text-muted-foreground hover:bg-surface-hover'
          }`}
        >
          <User className="h-5 w-5" /> Account
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all ${
            activeTab === 'password' ? 'clay-inset text-brand-primary' : 'text-muted-foreground hover:bg-surface-hover'
          }`}
        >
          <Lock className="h-5 w-5" /> Password
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all ${
            activeTab === 'data' ? 'clay-inset text-brand-primary' : 'text-muted-foreground hover:bg-surface-hover'
          }`}
        >
          <Database className="h-5 w-5" /> Data & Privacy
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="clay-panel p-8">
          {activeTab === 'account' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold">Account Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">Display Name</label>
                  <Input placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">Email Address</label>
                  <Input placeholder="name@example.com" type="email" />
                </div>
                <Button variant="brand" className="mt-4">Save Changes</Button>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold">Change Password</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">Current Password</label>
                  <Input type="password" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">New Password</label>
                  <Input type="password" />
                </div>
                <Button variant="brand" className="mt-4">Update Password</Button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold">Data & Privacy</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                  <div>
                    <h3 className="font-bold">Clear Listening History</h3>
                    <p className="text-sm text-muted-foreground">Remove all tracks from your recent history.</p>
                  </div>
                  <Button variant="ghost" className="text-destructive hover:bg-destructive/10">Clear</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
