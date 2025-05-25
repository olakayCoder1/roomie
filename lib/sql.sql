-- Main users table
CREATE TABLE users (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  age integer,
  bio text,
  department text,
  level text,
  profile_url text,
  budget_low integer,
  budget_high integer,
  location text, -- For "Ilorin, Kwara"
  password_hash text,
  organization text, -- For "NYSC Corps Member"
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Roommate preferences table
CREATE TABLE roommate_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  preference_type text NOT NULL, -- 'lifestyle', 'habit', 'personality', etc.
  preference_value text NOT NULL, -- 'Non-smoker', 'Early riser', 'Clean', 'Quiet', 'Respectful'
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, preference_value)
);

-- User settings table
CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  privacy_settings jsonb DEFAULT '{}', -- Store privacy preferences as JSON
  notification_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for better performance
CREATE INDEX idx_users_location ON users(location);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_budget_range ON users(budget_low, budget_high);
CREATE INDEX idx_roommate_preferences_user_id ON roommate_preferences(user_id);
CREATE INDEX idx_roommate_preferences_type ON roommate_preferences(preference_type);

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roommate_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data and public profiles
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Public profiles policy (for roommate discovery)
CREATE POLICY "Users can view public profiles" ON users
  FOR SELECT USING (true); -- Adjust based on your privacy requirements

-- Roommate preferences policies
CREATE POLICY "Users can manage own preferences" ON roommate_preferences
  FOR ALL USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


  
-- Create conversations table to track conversations between users
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique conversation between two users (prevent duplicates)
  UNIQUE(user1_id, user2_id),
  
  -- Ensure user1_id is always less than user2_id for consistency
  CHECK (user1_id < user2_id)
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  
  -- Add indexes for better query performance
  INDEX idx_messages_conversation_id (conversation_id),
  INDEX idx_messages_sender_id (sender_id),
  INDEX idx_messages_receiver_id (receiver_id),
  INDEX idx_messages_created_at (created_at)
);

-- Create function to automatically update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation timestamp when new message is added
CREATE TRIGGER update_conversation_timestamp_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Create function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1 UUID, user2 UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  min_user UUID;
  max_user UUID;
BEGIN
  -- Ensure consistent ordering (smaller UUID first)
  IF user1 < user2 THEN
    min_user := user1;
    max_user := user2;
  ELSE
    min_user := user2;
    max_user := user1;
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE user1_id = min_user AND user2_id = max_user;
  
  -- If not found, create new conversation
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id)
    VALUES (min_user, max_user)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Create RLS (Row Level Security) policies for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations they're part of" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create RLS policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id 
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id 
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages read status" ON messages
  FOR UPDATE USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- Insert some sample conversations and messages for testing
-- (These would be created through your application normally)
INSERT INTO conversations (user1_id, user2_id) VALUES 
  ('user1-uuid', 'user2-uuid'),
  ('user1-uuid', 'user3-uuid');

INSERT INTO messages (conversation_id, sender_id, receiver_id, content) VALUES
  ((SELECT id FROM conversations LIMIT 1), 'user1-uuid', 'user2-uuid', 'Hello! Are you still looking for a roommate?'),
  ((SELECT id FROM conversations LIMIT 1), 'user2-uuid', 'user1-uuid', 'Yes, I am! Tell me more about yourself.');