'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getFeed } from '@/data/feed';
import { FeedItem } from '@/types';
import { FeedCard } from '@/components/feed-card';

export function HomeFeed() {
  const [activeTab, setActiveTab] = useState<'all' | 'roommates' | 'places'>('all');
  const [feedItems, setFeedItems] = useState<FeedItem[]>(getFeed());

  const filterFeed = (tab: 'all' | 'roommates' | 'places') => {
    setActiveTab(tab);
    if (tab === 'all') {
      setFeedItems(getFeed());
    } else if (tab === 'roommates') {
      setFeedItems(getFeed('roommate'));
    } else {
      setFeedItems(getFeed('place'));
    }
  };

  return (
    <div className="flex flex-col items-center pb-16">
      <div className="sticky top-16 z-30 w-full bg-background/80 backdrop-blur-sm pt-2 pb-3 px-4">
        <div className="flex space-x-2 justify-center">
          <Button
            onClick={() => filterFeed('all')}
            variant={activeTab === 'all' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
          >
            For You
          </Button>
          <Button
            onClick={() => filterFeed('roommates')}
            variant={activeTab === 'roommates' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
          >
            Roommates
          </Button>
          <Button
            onClick={() => filterFeed('places')}
            variant={activeTab === 'places' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
          >
            Places
          </Button>
        </div>
      </div>
      
      <div className="w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {feedItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ 
                duration: 0.5,
                delay: index * 0.1 > 0.5 ? 0.5 : index * 0.1 // Cap delay at 0.5s
              }}
              className="w-full"
            >
              <FeedCard item={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}