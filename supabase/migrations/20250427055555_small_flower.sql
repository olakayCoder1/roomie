/*
  # Initial Schema Setup for Roomie App

  1. New Tables
    - `profiles`
      - User profiles with extended information
    - `places`
      - Available accommodations
    - `reviews`
      - Reviews for places and users
    - `likes`
      - Likes on places and profiles
    - `comments`
      - Comments on places and profiles
    - `messages`
      - Chat messages between users
    - `chats`
      - Chat rooms/conversations
    - `chat_participants`
      - Users in chat conversations
    - `saved_items`
      - Bookmarked places and profiles

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create custom types
CREATE TYPE public.item_type AS ENUM ('place', 'profile');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  bio text,
  occupation text,
  location text,
  budget_min integer,
  budget_max integer,
  move_in_date date,
  lifestyle_preferences text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create places table
CREATE TABLE public.places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL,
  rent integer NOT NULL,
  location text NOT NULL,
  image_url text,
  bedrooms integer,
  bathrooms integer,
  amenities text[],
  description text,
  available_from date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type item_type NOT NULL,
  item_id uuid NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Create likes table
CREATE TABLE public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type item_type NOT NULL,
  item_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Create comments table
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type item_type NOT NULL,
  item_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chats table
CREATE TABLE public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

-- Create chat_participants table
CREATE TABLE public.chat_participants (
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (chat_id, profile_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create saved_items table
CREATE TABLE public.saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type item_type NOT NULL,
  item_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Places policies
CREATE POLICY "Places are viewable by everyone"
  ON public.places
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own places"
  ON public.places
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own places"
  ON public.places
  FOR UPDATE
  USING (auth.uid() = owner_id);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone"
  ON public.likes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage their likes"
  ON public.likes
  FOR ALL
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Chat policies
CREATE POLICY "Users can view their chats"
  ON public.chats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = id AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create chats"
  ON public.chats
  FOR INSERT
  WITH CHECK (true);

-- Chat participants policies
CREATE POLICY "Users can view chat participants"
  ON public.chat_participants
  FOR SELECT
  USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = chat_participants.chat_id AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can join chats"
  ON public.chat_participants
  FOR INSERT
  WITH CHECK (true);

-- Messages policies
CREATE POLICY "Chat participants can view messages"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = messages.chat_id AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Chat participants can insert messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = messages.chat_id AND profile_id = auth.uid()
    )
  );

-- Saved items policies
CREATE POLICY "Users can manage their saved items"
  ON public.saved_items
  FOR ALL
  USING (auth.uid() = user_id);

-- Create functions for real-time features
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- Create trigger for new user profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get chat ID between two users
CREATE OR REPLACE FUNCTION get_or_create_chat(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_chat_id uuid;
  new_chat_id uuid;
BEGIN
  -- Check if chat already exists
  SELECT c.id INTO existing_chat_id
  FROM chats c
  JOIN chat_participants p1 ON c.id = p1.chat_id
  JOIN chat_participants p2 ON c.id = p2.chat_id
  WHERE 
    (p1.profile_id = user1_id AND p2.profile_id = user2_id) OR
    (p1.profile_id = user2_id AND p2.profile_id = user1_id)
  LIMIT 1;

  -- Return existing chat if found
  IF existing_chat_id IS NOT NULL THEN
    RETURN existing_chat_id;
  END IF;

  -- Create new chat and add participants
  INSERT INTO chats DEFAULT VALUES
  RETURNING id INTO new_chat_id;

  INSERT INTO chat_participants (chat_id, profile_id)
  VALUES
    (new_chat_id, user1_id),
    (new_chat_id, user2_id);

  RETURN new_chat_id;
END;
$$;