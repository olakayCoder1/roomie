'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getConversationWithUser, startConversation } from '@/app/actions/message-actions';
import { useToast } from '@/hooks/use-toast';

interface MessageButtonProps {
  userId: string;
  userName: string;
  initialMessage?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function MessageButton({ 
  userId, 
  userName, 
  initialMessage,
  variant = 'default',
  size = 'default',
  className = ''
}: MessageButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleStartConversation = async () => {
    try {
      setLoading(true);

      // First check if conversation already exists
      const existingResult = await getConversationWithUser(userId);
      
      if (existingResult.error) {
        toast({
          title: "Error",
          description: existingResult.error,
          variant: "destructive",
        });
        return;
      }

      // If conversation exists, navigate to messages with conversation ID
      if (existingResult.conversationId) {
        router.push(`/messages?conversation=${existingResult.conversationId}`);
        return;
      }

      // Create new conversation with optional initial message
      const defaultMessage = initialMessage || `Hi ${userName}! I saw your profile and think we might be compatible roommates. Would you like to chat?`;
      
      const result:any = await startConversation(userId, defaultMessage);
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Conversation started with ${userName}!`,
      });

      // Navigate to messages page with the new conversation ID
      if (result.conversationId) {
        router.push(`/messages?conversation=${result.conversationId}`);
      } else {
        // Fallback: navigate with user ID to find and open conversation
        router.push(`/messages?user=${userId}`);
      }
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleStartConversation}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <MessageCircle className="h-4 w-4 mr-2" />
      )}
      {loading ? 'Starting...' : 'Message'}
    </Button>
  );
}

// Quick message component for sending predefined messages
interface QuickMessageButtonProps {
  userId: string;
  userName: string;
  message: string;
  buttonText: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function QuickMessageButton({
  userId,
  userName,
  message,
  buttonText,
  variant = 'outline',
  size = 'sm',
  className = ''
}: QuickMessageButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleQuickMessage = async () => {
    try {
      setLoading(true);

      const result:any = await startConversation(userId, message);
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Message Sent",
        description: `Your message was sent to ${userName}!`,
      });

      // Navigate to messages page with conversation ID
      if (result.conversationId) {
        router.push(`/messages?conversation=${result.conversationId}`);
      } else {
        router.push(`/messages?user=${userId}`);
      }
      
    } catch (error) {
      console.error('Error sending quick message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleQuickMessage}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-1" />
      ) : null}
      {loading ? 'Sending...' : buttonText}
    </Button>
  );
}