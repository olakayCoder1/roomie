

export interface User {
  id: string; // UUID from Supabase
  email: string; // Required, as per users table
  full_name?: string; // Optional, from users table
  age?: number; // Optional, from users table
  occupation?: string; // Optional, from users table (used in ProfileContent)
  location?: string; // Optional, from users table
  bio?: string; // Optional, from users table
  budget_low?: number; // Optional, from users table (should be number for consistency)
  budget_high?: number; // Optional, from users table (should be number for consistency)
  profile_url?: string; // Optional, from users table
  department?: string; // Optional, from users table
  level?: string; // Optional, from users table
  lifestylePreferences?: string[]; // Optional, derived from roommate_preferences table
};

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