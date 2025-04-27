'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, SendHorizontal } from 'lucide-react';
import { roommates } from '@/data/roommates';
import { User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import SafeTime from './SafeTime';

type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
};

// Mock conversation data
const mockConversations: Record<string, Message[]> = {
  '1': [
    {
      id: 'm1',
      senderId: '1',
      text: 'Hi there! I saw your profile and I think we might be compatible roommates.',
      timestamp: new Date('2023-05-20T10:30:00'),
      isRead: true,
    },
    {
      id: 'm2',
      senderId: 'current-user',
      text: 'Hey Alex! Thanks for reaching out. I liked your profile too. What are you looking for in a roommate?',
      timestamp: new Date('2023-05-20T10:35:00'),
      isRead: true,
    },
    {
      id: 'm3',
      senderId: '1',
      text: "I'm looking for someone clean, respectful of space, and okay with occasional guests. I'm pretty easygoing otherwise.",
      timestamp: new Date('2023-05-20T10:40:00'),
      isRead: true,
    },
    {
      id: 'm4',
      senderId: 'current-user',
      text: "That sounds perfect! I'm the same way. Would you like to meet up and discuss more details?",
      timestamp: new Date('2023-05-20T10:45:00'),
      isRead: true,
    },
  ],
  '2': [
    {
      id: 'm5',
      senderId: '2',
      text: 'Hello! I noticed we have similar budget ranges and move-in dates. Are you still looking for a roommate?',
      timestamp: new Date('2023-05-21T14:20:00'),
      isRead: false,
    },
  ],
};

export function MessagesContent() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Record<string, Message[]>>(mockConversations);
  const [messageText, setMessageText] = useState('');

  const handleSendMessage = () => {
    if (!messageText.trim() || !activeChat) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      senderId: 'current-user',
      text: messageText,
      timestamp: new Date(),
      isRead: true,
    };

    setConversations(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMessage],
    }));

    setMessageText('');
  };

  const getUnreadCount = (userId: string) => {
    return conversations[userId]?.filter(m => !m.isRead && m.senderId !== 'current-user').length || 0;
  };

  const markAsRead = (userId: string) => {
    if (!conversations[userId]) return;

    setConversations(prev => ({
      ...prev,
      [userId]: prev[userId].map(message => ({
        ...message,
        isRead: true,
      })),
    }));
  };

  const conversationList = Object.keys(conversations).map(userId => {
    const user = roommates.find(r => r.id === userId) as User;
    const lastMessage = conversations[userId][conversations[userId].length - 1];
    const unreadCount = getUnreadCount(userId);

    return { userId, user, lastMessage, unreadCount };
  });

  const activeUser = activeChat ? roommates.find(r => r.id === activeChat) : null;
  const activeMessages = activeChat ? conversations[activeChat] || [] : [];

  return (
    <div className="container max-w-md mx-auto px-0 py-4 h-[calc(100vh-8rem)]">
      <AnimatePresence mode="wait">
        {!activeChat ? (
          <motion.div
            key="conversations"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4"
          >
            <h1 className="text-2xl font-bold mb-6">Messages</h1>
            <div className="space-y-2">
              {conversationList.map(({ userId, user, lastMessage, unreadCount }) => (
                <div
                  key={userId}
                  className="flex items-center p-3 rounded-lg hover:bg-secondary cursor-pointer"
                  onClick={() => {
                    setActiveChat(userId);
                    markAsRead(userId);
                  }}
                >
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium truncate">{user.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        <SafeTime date={new Date(lastMessage.timestamp)} />
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {lastMessage.senderId === 'current-user' ? 'You: ' : ''}{lastMessage.text}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <Badge className="ml-2 bg-primary">{unreadCount}</Badge>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full"
          >
            <div className="flex items-center p-3 border-b border-border">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveChat(null)}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              {activeUser && (
                <>
                  <Avatar className="h-9 w-9 mr-2">
                    <AvatarImage src={activeUser.avatarUrl} alt={activeUser.name} />
                    <AvatarFallback>{activeUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{activeUser.name}</h3>
                    <p className="text-xs text-muted-foreground">{activeUser.location}</p>
                  </div>
                </>
              )}
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {activeMessages.map((message) => {
                  const isOwnMessage = message.senderId === 'current-user';
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] px-4 py-2 rounded-lg ${
                          isOwnMessage 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary'
                        }`}
                      >
                        <p>{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          <SafeTime date={message.timestamp} type="time" options={{ hour: '2-digit', minute: '2-digit' }} />
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <SendHorizontal className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}