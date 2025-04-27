import { MessagesContent } from '@/components/messages-content';
import { TopNav } from '@/components/top-nav';

export default function MessagesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <MessagesContent />
    </div>
  );
}