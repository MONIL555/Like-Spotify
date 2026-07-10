'use client';

import { SettingsDashboard } from '@/components/settings/SettingsDashboard';

export default function SettingsPage() {
  return (
    <div className="py-6 flex flex-col gap-8 animate-fade-in">
      <h1 className="text-4xl font-bold text-foreground">Settings</h1>
      <SettingsDashboard />
    </div>
  );
}
