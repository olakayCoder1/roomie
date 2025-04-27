'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

const supabase = createClient();

export function useSupabaseRealtime<T>(
  channel: string,
  event: string,
  callback: (payload: T) => void
) {
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const newSubscription = supabase
      .channel(channel)
      .on('broadcast', { event }, (payload) => callback(payload.payload as T))
      .subscribe();

    setSubscription(newSubscription);

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [channel, event, callback]);

  return subscription;
}

export function useMessages(chatId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles(*)')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();

    const subscription = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: sender } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', payload.new.sender_id)
              .single();

            setMessages((current) => [
              ...current,
              { ...payload.new, sender },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [chatId]);

  return { messages, loading };
}

export function useLikes(itemType: 'place' | 'profile', itemId: string) {
  const [likes, setLikes] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);

  useEffect(() => {
    const fetchLikes = async () => {
      const { data: likesData } = await supabase
        .from('likes')
        .select('count', { count: 'exact' })
        .eq('item_type', itemType)
        .eq('item_id', itemId);

      const { data: userLike } = await supabase
        .from('likes')
        .select()
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .eq('user_id', supabase.auth.getUser())
        .single();

      if (likesData) setLikes(likesData.length);
      setHasLiked(!!userLike);
    };

    fetchLikes();

    const subscription = supabase
      .channel(`likes:${itemType}:${itemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `item_id=eq.${itemId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLikes((current) => current + 1);
          } else if (payload.eventType === 'DELETE') {
            setLikes((current) => current - 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [itemType, itemId]);

  const toggleLike = async () => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    if (hasLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .eq('user_id', user.data.user.id);
      setHasLiked(false);
    } else {
      await supabase.from('likes').insert({
        item_type: itemType,
        item_id: itemId,
        user_id: user.data.user.id,
      });
      setHasLiked(true);
    }
  };

  return { likes, hasLiked, toggleLike };
}

export function useComments(itemType: 'place' | 'profile', itemId: string) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:profiles(*)')
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setComments(data);
      }
      setLoading(false);
    };

    fetchComments();

    const subscription = supabase
      .channel(`comments:${itemType}:${itemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${itemId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: user } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', payload.new.user_id)
              .single();

            setComments((current) => [
              { ...payload.new, user },
              ...current,
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [itemType, itemId]);

  const addComment = async (content: string) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    await supabase.from('comments').insert({
      item_type: itemType,
      item_id: itemId,
      user_id: user.data.user.id,
      content,
    });
  };

  return { comments, loading, addComment };
}

export function useReviews(itemType: 'place' | 'profile', itemId: string) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles(*)')
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReviews(data);
        const avg = data.reduce((acc, review) => acc + review.rating, 0) / data.length;
        setAverageRating(avg || 0);
      }
      setLoading(false);
    };

    fetchReviews();

    const subscription = supabase
      .channel(`reviews:${itemType}:${itemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `item_id=eq.${itemId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: reviewer } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', payload.new.reviewer_id)
              .single();

            setReviews((current) => [
              { ...payload.new, reviewer },
              ...current,
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [itemType, itemId]);

  const addReview = async (rating: number, comment: string) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    await supabase.from('reviews').insert({
      item_type: itemType,
      item_id: itemId,
      reviewer_id: user.data.user.id,
      rating,
      comment,
    });
  };

  return { reviews, loading, averageRating, addReview };
}