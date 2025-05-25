
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FeedItem } from '@/types';
import { FeedCard } from '@/components/feed-card';
import { Loader2, RefreshCw } from 'lucide-react';
import { fetchFeed } from '@/app/actions/feed-actions';
import { useAuth } from '@/lib/hooks/use-auth';

export function HomeFeed() {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadFeed();
    }
  }, [user?.id]);

  const loadFeed = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // console.log('Loading feed for user:', user?.id);
      const result = await fetchFeed('users', user?.id);

      if (result.error) {
        setError(result.error);
        console.error('Fetch feed result error:', result.error);
        return;
      }

      // console.log('Feed items received:', result.data?.length);
      // console.log('Feed item IDs:', result.data?.map(item => item.id));
      setFeedItems(result.data || []);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Feed loading error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadFeed(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-center mb-4">
          <p className="text-red-500 mb-2">Failed to load users</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
        <Button onClick={() => loadFeed()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center pb-16">
      <div className="w-full max-w-md mx-auto px-4">
        {feedItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No users available</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {feedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: Math.min(index * 0.1, 0.5),
                  }}
                  className="w-full mb-4"
                >
                  <FeedCard item={item} currentUserId={user?.id ?? ''}/>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
        {feedItems.length > 0 && (
          <div className="text-center py-8">
            <Button
              variant="outline"
              onClick={() => loadFeed()}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}