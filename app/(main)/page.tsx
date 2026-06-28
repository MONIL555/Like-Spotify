import { Metadata } from 'next';
import { getTimeGreeting } from '@/lib/utils';
import { HomeDashboard } from '@/components/home/HomeDashboard';

export const metadata: Metadata = {
  title: 'Home',
};

export default function HomePage() {
  const greeting = getTimeGreeting();

  return (
    <div className="p-6 md:p-8">
      <HomeDashboard greeting={greeting} />
    </div>
  );
}
