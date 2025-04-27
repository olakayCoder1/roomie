export interface User {
  id: string;
  name: string;
  age: number;
  occupation: string;
  location: string;
  bio: string;
  avatarUrl: string;
  lifestylePreferences: string[];
  budget: {
    min: number;
    max: number;
  };
  moveInDate: string;
  compatibility?: number;
}

export interface Place {
  id: string;
  title: string;
  type: 'apartment' | 'house' | 'hostel' | 'dormitory';
  rent: number;
  location: string;
  imageUrl: string;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  description: string;
  availableFrom: string;
  owner: {
    id: string;
    name: string;
    avatarUrl: string;
  };
}

export type FeedItemType = 'roommate' | 'place';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  data: User | Place;
}