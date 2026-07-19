import { Metadata } from 'next';
import { HomeDashboard } from '@/components/home/HomeDashboard';

export const metadata: Metadata = {
  title: 'Home | MoniStream',
};

export default function HomePage() {
  return (
    <div className="py-6 animate-fade-in">
      <HomeDashboard />
    </div>
  );
}
