"use client"

import { RoommatesFeed } from '@/components/roommates-feed';
import { TopNav } from '@/components/top-nav';
import { useAuth } from '@/lib/hooks/use-auth';
import { useEffect, useState } from 'react';
import { fetchUsers } from '../actions/feed-actions';
import { toast } from '@/hooks/use-toast';

export default function RoommatesPage() {
  const { user } = useAuth();

  const [ roommates, setRoommates] = useState([])

  useEffect(() => {
    loadRoommates();
  }, []);

  const loadRoommates = async () => {
    try {
      // setLoading(true);
      const result = await fetchUsers(user?.id); // fetch users from API
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        // @ts-ignore
        setRoommates(result.data || []);
      }
    } finally {
      // setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <div className="flex-1 px-4 pt-4 pb-16">
        <h1 className="text-2xl font-bold mb-6">Find Your Roommate</h1>
        <RoommatesFeed roommates={roommates} currentUserId={user?.id} />
      </div>
    </div>
  );
}

function setLoading(arg0: boolean) {
  throw new Error('Function not implemented.');
}
