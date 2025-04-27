import { RoommatesFeed } from '@/components/roommates-feed';
import { TopNav } from '@/components/top-nav';

export default function RoommatesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <div className="flex-1 px-4 pt-4 pb-16">
        <h1 className="text-2xl font-bold mb-6">Find Your Roommate</h1>
        <RoommatesFeed />
      </div>
    </div>
  );
}