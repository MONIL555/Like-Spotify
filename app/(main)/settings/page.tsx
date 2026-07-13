'use client';

import { SettingsDashboard } from '@/components/settings/SettingsDashboard';

export default function SettingsPage() {
  return (
    <div className="py-2 md:py-6 px-4 md:px-8 flex flex-col gap-6 animate-fade-in pb-32">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
      <SettingsDashboard />
    </div>
  );
}
