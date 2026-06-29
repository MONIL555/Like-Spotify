import { Metadata } from 'next';
import { HomeDashboard } from '@/components/home/HomeDashboard';

export const metadata: Metadata = {
  title: 'Home',
};

export default function HomePage() {
  return (
    <div className="p-6 md:p-8">
      <HomeDashboard />
    </div>
  );
}
