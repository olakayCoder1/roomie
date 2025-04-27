import { ProfileContent } from '@/components/profile-content';
import { TopNav } from '@/components/top-nav';

export default function ProfilePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <ProfileContent />
    </div>
  );
}