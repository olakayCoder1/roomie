import { PlacesFeed } from '@/components/places-feed';
import { TopNav } from '@/components/top-nav';

export default function PlacesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <div className="flex-1 px-4 pt-4 pb-16">
        <h1 className="text-2xl font-bold mb-6">Find Your Place</h1>
        <PlacesFeed />
      </div>
    </div>
  );
}