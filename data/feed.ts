import { FeedItem } from '@/types';
import { roommates } from './roommates';
import { places } from './places';

export const generateFeed = (): FeedItem[] => {
  const roommateItems = roommates.map((roommate) => ({
    id: `roommate-${roommate.id}`,
    type: 'roommate' as const,
    data: roommate,
  }));

  const placeItems = places.map((place) => ({
    id: `place-${place.id}`,
    type: 'place' as const,
    data: place,
  }));

  // Combine and shuffle the feed items
  const combinedItems = [...roommateItems, ...placeItems];
  
  // Fisher-Yates shuffle algorithm
  for (let i = combinedItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combinedItems[i], combinedItems[j]] = [combinedItems[j], combinedItems[i]];
  }

  return combinedItems;
};

export const getFeed = (type?: 'roommate' | 'place'): FeedItem[] => {
  const allItems = generateFeed();
  
  if (type) {
    return allItems.filter(item => item.type === type);
  }
  
  return allItems;
};