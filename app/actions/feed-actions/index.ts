"use server";

import { createServerClient } from "@/lib/supabase/server";
import { FeedItem, User } from "@/types";

// Fetch all users excluding the current user
export async function fetchUsers(currentUserId?: string) {
  try {
    const supabase = createServerClient();

    console.log('Fetching users, excluding currentUserId:', currentUserId);

    let query = supabase
      .from('users')
      .select(`
        id,
        full_name,
        age,
        location,
        bio,
        budget_low,
        budget_high,
        profile_url,
        department,
        level,
        created_at,
        roommate_preferences (
          preference_type,
          preference_value
        )
      `);

    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data: users, error } = await query.limit(20);

    if (error) {
      console.error('Fetch users error:', error);
      return { error: 'Failed to fetch users' };
    }

    // Get current user's interests to check which users they've shown interest in
    let userInterests: string[] = [];
    if (currentUserId) {
      const { data: interests, error: interestsError } = await supabase
        .from('user_interests')
        .select('target_user_id')
        .eq('user_id', currentUserId);

      if (!interestsError && interests) {
        userInterests = interests.map(interest => interest.target_user_id);
      }
    }

    const userList: User[] = users.map(user => ({
      id: user.id,
      name: user.full_name,
      age: user.age,
      location: user.location || 'Location not specified',
      bio: user.bio || 'No bio available',
      occupation: user.department || 'Student',
      budget: {
        min: user.budget_low || 0,
        max: user.budget_high || 0,
      },
      avatarUrl: user.profile_url,
      lifestylePreferences: user.roommate_preferences?.map((pref: any) => pref.preference_value) || [],
      compatibility: Math.floor(Math.random() * 30) + 70,
      moveInDate: new Date().toISOString(),
      verified: true,
      hasShownInterest: userInterests.includes(user.id), // Add interest flag
    }));

    console.log('Fetched users count:', userList.length);
    console.log('User IDs:', userList.map(u => u.id));

    const filteredUsers = currentUserId 
      ? userList.filter(user => user.id !== currentUserId)
      : userList;

    console.log('Final filtered users count:', filteredUsers.length);

    return { data: filteredUsers };
  } catch (error) {
    console.error('Fetch users error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Main function to get users feed
export async function fetchFeed(
  type: 'users',
  currentUserId?: string
): Promise<{ data?: FeedItem[]; error?: string }> {
  try {
    if (!currentUserId) {
      return { error: 'User ID is required' };
    }

    const usersResult = await fetchUsers(currentUserId);
    if (usersResult.error) {
      return { error: usersResult.error };
    }

    console.log('Users received in fetchFeed:', usersResult.data?.length);

    const userFeedItems: FeedItem[] = usersResult.data?.map(user => ({
      id: `user-${user.id}`,
      type: 'roommate' as const,
      data: user,
      timestamp: new Date().toISOString(),
    })) || [];

    console.log('Feed items created:', userFeedItems.length);
    console.log('Feed item IDs:', userFeedItems.map(item => item.id));

    return { data: userFeedItems };
  } catch (error) {
    console.error('Fetch feed error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Get current user's data
export async function getCurrentUser(userId: string) {
  try {
    const supabase = createServerClient();

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        age,
        location,
        bio,
        budget_low,
        budget_high,
        profile_url,
        department,
        level,
        roommate_preferences (
          preference_type,
          preference_value
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Get current user error:', error);
      return { error: 'Failed to fetch user data' };
    }

    return {
      data: {
        id: user.id,
        full_name: user.full_name,
        age: user.age,
        location: user.location,
        bio: user.bio,
        budget_low: user.budget_low,
        budget_high: user.budget_high,
        profile_url: user.profile_url,
        department: user.department,
        level: user.level,
        lifestylePreferences: user.roommate_preferences?.map((pref: any) => pref.preference_value) || [],
      },
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Save user interest to database
export async function saveInterest(currentUserId: string, targetUserId: string) {
  try {
    const supabase = createServerClient();

    // Check if interest already exists
    const { data: existingInterest, error: checkError } = await supabase
      .from('user_interests')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('target_user_id', targetUserId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing interest:', checkError);
      return { error: 'Failed to check existing interest' };
    }

    if (existingInterest) {
      // Interest already exists, remove it (toggle off)
      const { error: deleteError } = await supabase
        .from('user_interests')
        .delete()
        .eq('id', existingInterest.id);

      if (deleteError) {
        console.error('Error removing interest:', deleteError);
        return { error: 'Failed to remove interest' };
      }

      return { data: { action: 'removed', hasShownInterest: false } };
    } else {
      // Interest doesn't exist, create it (toggle on)
      const { error: insertError } = await supabase
        .from('user_interests')
        .insert({
          user_id: currentUserId,
          target_user_id: targetUserId,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error saving interest:', insertError);
        return { error: 'Failed to save interest' };
      }

      return { data: { action: 'added', hasShownInterest: true } };
    }
  } catch (error) {
    console.error('Save interest error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Get user's interests
export async function getUserInterests(currentUserId: string) {
  try {
    const supabase = createServerClient();

    const { data: interests, error } = await supabase
      .from('user_interests')
      .select(`
        target_user_id,
        created_at,
        users:target_user_id (
          id,
          full_name,
          age,
          location,
          bio,
          budget_low,
          budget_high,
          profile_url,
          department,
          level,
          roommate_preferences (
            preference_type,
            preference_value
          )
        )
      `)
      .eq('user_id', currentUserId);

    if (error) {
      console.error('Get user interests error:', error);
      return { error: 'Failed to fetch user interests' };
    }

    const interestedUsers: User[] = interests
      ?.filter(interest => interest.users)
      .map(interest => {
        const user = interest.users;
        return {
          id: user.id,
          name: user.full_name,
          age: user.age,
          location: user.location || 'Location not specified',
          bio: user.bio || 'No bio available',
          occupation: user.department || 'Student',
          budget: {
            min: user.budget_low || 0,
            max: user.budget_high || 0,
          },
          avatarUrl: user.profile_url,
          lifestylePreferences: user.roommate_preferences?.map((pref: any) => pref.preference_value) || [],
          compatibility: Math.floor(Math.random() * 30) + 70,
          moveInDate: new Date().toISOString(),
          verified: true,
          hasShownInterest: true, // Always true for users in this list
        };
      }) || [];

    return { data: interestedUsers };
  } catch (error) {
    console.error('Get user interests error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Get users who have shown interest in the current user
export async function getUsersInterestedInMe(currentUserId: string) {
  try {
    const supabase = createServerClient();

    const { data: interests, error } = await supabase
      .from('user_interests')
      .select(`
        user_id,
        created_at,
        users:user_id (
          id,
          full_name,
          age,
          location,
          bio,
          budget_low,
          budget_high,
          profile_url,
          department,
          level,
          roommate_preferences (
            preference_type,
            preference_value
          )
        )
      `)
      .eq('target_user_id', currentUserId);

    if (error) {
      console.error('Get users interested in me error:', error);
      return { error: 'Failed to fetch users interested in you' };
    }

    // Get current user's interests to check if they've shown interest back
    const { data: currentUserInterests, error: interestsError } = await supabase
      .from('user_interests')
      .select('target_user_id')
      .eq('user_id', currentUserId);

    const userInterests = !interestsError && currentUserInterests 
      ? currentUserInterests.map(interest => interest.target_user_id)
      : [];

    const interestedUsers: User[] = interests
      ?.filter(interest => interest.users)
      .map(interest => {
        const user = interest.users;
        return {
          id: user.id,
          name: user.full_name,
          age: user.age,
          location: user.location || 'Location not specified',
          bio: user.bio || 'No bio available',
          occupation: user.department || 'Student',
          budget: {
            min: user.budget_low || 0,
            max: user.budget_high || 0,
          },
          avatarUrl: user.profile_url,
          lifestylePreferences: user.roommate_preferences?.map((pref: any) => pref.preference_value) || [],
          compatibility: Math.floor(Math.random() * 30) + 70,
          moveInDate: new Date().toISOString(),
          verified: true,
          hasShownInterest: userInterests.includes(user.id), // Check if current user has shown interest back
        };
      }) || [];

    return { data: interestedUsers };
  } catch (error) {
    console.error('Get users interested in me error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Check if two users have mutual interest
export async function checkMutualInterest(userId1: string, userId2: string) {
  try {
    const supabase = createServerClient();

    // Check if user1 is interested in user2
    const { data: interest1, error: error1 } = await supabase
      .from('user_interests')
      .select('id')
      .eq('user_id', userId1)
      .eq('target_user_id', userId2)
      .single();

    // Check if user2 is interested in user1
    const { data: interest2, error: error2 } = await supabase
      .from('user_interests')
      .select('id')
      .eq('user_id', userId2)
      .eq('target_user_id', userId1)
      .single();

    // Both errors should be "not found" (PGRST116) if no interest exists
    const hasInterest1 = interest1 && !error1;
    const hasInterest2 = interest2 && !error2;

    return {
      data: {
        mutualInterest: hasInterest1 && hasInterest2,
        user1InterestedInUser2: hasInterest1,
        user2InterestedInUser1: hasInterest2,
      }
    };
  } catch (error) {
    console.error('Check mutual interest error:', error);
    return { error: 'An unexpected error occurred' };
  }
}