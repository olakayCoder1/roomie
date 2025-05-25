"use server";

import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    id: string;
    full_name: string;
    profile_url?: string;
  };
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  other_user?: {
    id: string;
    full_name: string;
    profile_url?: string;
    location?: string;
  };
  last_message?: Message;
  unread_count: number;
}

// Get current user ID from cookies - now exported for client use
export async function getCurrentUserId() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.getAll().find(cookie => cookie.name.endsWith('_id'));
  return userCookie?.value || null;
}

// Get all conversations for the current user
export async function getUserConversations() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: "Not authenticated" };
    }

    const supabase = createServerClient();

    // Get conversations with other user details and last message
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        user1_id,
        user2_id,
        created_at,
        updated_at
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return { error: "Failed to fetch conversations" };
    }

    if (!conversations || conversations.length === 0) {
      return { success: true, conversations: [] };
    }

    // For each conversation, get the other user's details and last message
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;

        // Get other user details
        const { data: otherUser } = await supabase
          .from('users')
          .select('id, full_name, profile_url, location')
          .eq('id', otherUserId)
          .single();

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('receiver_id', userId)
          .eq('is_read', false);

        return {
          ...conv,
          other_user: otherUser,
          last_message: lastMessage,
          unread_count: unreadCount || 0,
        };
      })
    );

    return { success: true, conversations: conversationsWithDetails };
  } catch (error) {
    console.error("Get conversations error:", error);
    return { error: "Failed to fetch conversations" };
  }
}

// Get messages for a specific conversation
export async function getConversationMessages(conversationId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: "Not authenticated" };
    }

    const supabase = createServerClient();

    // Verify user is part of this conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single();

    if (!conversation) {
      return { error: "Conversation not found or access denied" };
    }

    // Get messages with sender details
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        receiver_id,
        content,
        created_at,
        is_read,
        sender:users!sender_id (
          id,
          full_name,
          profile_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return { error: "Failed to fetch messages" };
    }

    return { success: true, messages: messages || [] };
  } catch (error) {
    console.error("Get messages error:", error);
    return { error: "Failed to fetch messages" };
  }
}

// Send a new message
export async function sendMessage(receiverId: string, content: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: "Not authenticated" };
    }

    if (!content.trim()) {
      return { error: "Message content cannot be empty" };
    }

    const supabase = createServerClient();

    // Get or create conversation
    const { data: conversationId, error: convError } = await supabase
      .rpc('get_or_create_conversation', {
        user1: userId,
        user2: receiverId
      });

    if (convError || !conversationId) {
      console.error("Error creating/getting conversation:", convError);
      return { error: "Failed to create conversation" };
    }

    // Insert the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        receiver_id: receiverId,
        content: content.trim(),
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        receiver_id,
        content,
        created_at,
        is_read
      `)
      .single();

    if (messageError) {
      console.error("Error sending message:", messageError);
      return { error: "Failed to send message" };
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return { success: true, message };
  } catch (error) {
    console.error("Send message error:", error);
    return { error: "Failed to send message" };
  }
}

// Mark messages as read
export async function markMessagesAsRead(conversationId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: "Not authenticated" };
    }

    const supabase = createServerClient();

    // Mark all unread messages in this conversation for the current user as read
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error("Error marking messages as read:", error);
      return { error: "Failed to mark messages as read" };
    }

    return { success: true };
  } catch (error) {
    console.error("Mark as read error:", error);
    return { error: "Failed to mark messages as read" };
  }
}

// Start a new conversation with a user
export async function startConversation(receiverId: string, initialMessage?: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: "Not authenticated" };
    }

    if (userId === receiverId) {
      return { error: "Cannot start conversation with yourself" };
    }

    const supabase = createServerClient();

    // Check if receiver exists
    const { data: receiver } = await supabase
      .from('users')
      .select('id')
      .eq('id', receiverId)
      .single();

    if (!receiver) {
      return { error: "User not found" };
    }

    // Get or create conversation
    const { data: conversationId, error: convError } = await supabase
      .rpc('get_or_create_conversation', {
        user1: userId,
        user2: receiverId
      });

    if (convError || !conversationId) {
      console.error("Error creating conversation:", convError);
      return { error: "Failed to create conversation" };
    }

    // Send initial message if provided
    if (initialMessage && initialMessage.trim()) {
      const messageResult = await sendMessage(receiverId, initialMessage);
      if (!messageResult.success) {
        return messageResult;
      }
    }

    return { success: true, conversationId };
  } catch (error) {
    console.error("Start conversation error:", error);
    return { error: "Failed to start conversation" };
  }
}

// Get conversation between current user and another user
export async function getConversationWithUser(otherUserId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: "Not authenticated" };
    }

    const supabase = createServerClient();

    // Find existing conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`)
      .single();

    if (conversation) {
      return { success: true, conversationId: conversation.id };
    }

    return { success: true, conversationId: null };
  } catch (error) {
    console.error("Get conversation error:", error);
    return { error: "Failed to get conversation" };
  }
}


// New standalone function for starting conversations
export async function handleStartNewConversation(userId: string, initialMessage?: string) {
  try {
    const result:any = await startConversation(userId, initialMessage);
    
    if (result.error) {
      return { error: result.error };
    }
    
    return { success: true, conversationId: result.conversationId };
  } catch (error) {
    console.error('Error starting conversation:', error);
    return { error: "An unexpected error occurred" };
  }
}