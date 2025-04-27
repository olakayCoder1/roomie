import { HomeFeed } from '@/components/home-feed';
import { TopNav } from '@/components/top-nav';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <HomeFeed />
    </div>
  );
}