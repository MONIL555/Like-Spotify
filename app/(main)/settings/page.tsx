import { Metadata } from 'next';
import { SettingsDashboard } from '@/components/settings/SettingsDashboard';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto animate-fade-in-up">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>
      <SettingsDashboard />
    </div>
  );
}
