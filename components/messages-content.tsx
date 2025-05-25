// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { ArrowLeft, SendHorizontal, Loader2 } from 'lucide-react';
// import { Badge } from '@/components/ui/badge';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { useSearchParams } from 'next/navigation';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// import SafeTime from './SafeTime';
// import { useToast } from '@/hooks/use-toast';
// import {
//   Conversation,
//   getConversationMessages,
//   getUserConversations,
//   markMessagesAsRead,
//   Message,
//   sendMessage,
//   startConversation,
//   getCurrentUserId,
//   handleStartNewConversation, // Import the standalone function
// } from '@/app/actions/message-actions';

// export function MessagesContent() {
//   const [activeChat, setActiveChat] = useState<string | null>(null);
//   const [conversations, setConversations] = useState<Conversation[]>([]);
//   const [activeMessages, setActiveMessages] = useState<Message[]>([]);
//   const [messageText, setMessageText] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [sending, setSending] = useState(false);
//   const [loadingMessages, setLoadingMessages] = useState(false);
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null);
//   const scrollAreaRef = useRef<HTMLDivElement>(null);
//   const { toast } = useToast();
//   const searchParams = useSearchParams();
//   const supabase = createClientComponentClient();

//   // Get current user ID
//   useEffect(() => {
//     const getUserId = async () => {
//       const userId = await getCurrentUserId();
//       setCurrentUserId(userId);
//     };
//     getUserId();
//   }, []);

//   // Load conversations on component mount
//   useEffect(() => {
//     loadConversations();
//   }, []);

//   // Set up real-time subscriptions
//   useEffect(() => {
//     if (!currentUserId) return;

//     const messagesSubscription = supabase
//       .channel('messages')
//       .on(
//         'postgres_changes',
//         {
//           event: 'INSERT',
//           schema: 'public',
//           table: 'messages',
//           filter: `receiver_id=eq.${currentUserId}`,
//         },
//         (payload) => {
//           const newMessage = payload.new as Message;
//           if (activeChat && newMessage.conversation_id === activeChat) {
//             setActiveMessages((prev) => [...prev, newMessage]);
//             markMessagesAsRead(activeChat);
//           }
//           updateConversationWithNewMessage(newMessage);
//         }
//       )
//       .subscribe();

//     const messageUpdatesSubscription = supabase
//       .channel('message_updates')
//       .on(
//         'postgres_changes',
//         {
//           event: 'UPDATE',
//           schema: 'public',
//           table: 'messages',
//         },
//         (payload) => {
//           const updatedMessage = payload.new as Message;
//           if (activeChat && updatedMessage.conversation_id === activeChat) {
//             setActiveMessages((prev) =>
//               prev.map((msg) =>
//                 msg.id === updatedMessage.id ? updatedMessage : msg
//               )
//             );
//           }
//         }
//       )
//       .subscribe();

//     const conversationsSubscription = supabase
//       .channel('conversations')
//       .on(
//         'postgres_changes',
//         {
//           event: 'UPDATE',
//           schema: 'public',
//           table: 'conversations',
//           filter: `or(user1_id.eq.${currentUserId},user2_id.eq.${currentUserId})`,
//         },
//         () => {
//           loadConversations();
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(messagesSubscription);
//       supabase.removeChannel(messageUpdatesSubscription);
//       supabase.removeChannel(conversationsSubscription);
//     };
//   }, [currentUserId, activeChat, supabase]);

//   // Handle URL parameters to auto-open specific conversations
//   useEffect(() => {
//     if (conversations.length === 0) return;

//     const conversationId = searchParams.get('conversation');
//     const userId = searchParams.get('user');

//     if (conversationId) {
//       const conversation = conversations.find((c) => c.id === conversationId);
//       if (conversation) {
//         handleSelectConversation(conversationId);
//       }
//     } else if (userId) {
//       const conversation = conversations.find((c) => c.other_user?.id === userId);
//       if (conversation) {
//         handleSelectConversation(conversation.id);
//       } else {
//         // Start a new conversation if none exists
//         handleStartNewConversation(userId);
//       }
//     }
//   }, [conversations, searchParams]);

//   // Auto-scroll to bottom when new messages arrive
//   useEffect(() => {
//     if (scrollAreaRef.current) {
//       const scrollElement = scrollAreaRef.current.querySelector(
//         '[data-radix-scroll-area-viewport]'
//       );
//       if (scrollElement) {
//         scrollElement.scrollTop = scrollElement.scrollHeight;
//       }
//     }
//   }, [activeMessages]);

//   const updateConversationWithNewMessage = (newMessage: Message) => {
//     setConversations((prev) =>
//       prev.map((conv) => {
//         if (conv.id === newMessage.conversation_id) {
//           return {
//             ...conv,
//             last_message: newMessage,
//             updated_at: newMessage.created_at,
//             unread_count: activeChat === conv.id ? 0 : conv.unread_count + 1,
//           };
//         }
//         return conv;
//       })
//     );
//   };

//   const loadConversations = async () => {
//     try {
//       setLoading(true);
//       const result = await getUserConversations();

//       if (result.error) {
//         toast({
//           title: 'Error',
//           description: result.error,
//           variant: 'destructive',
//         });
//         return;
//       }

//       setConversations(result.conversations || []);
//     } catch (error) {
//       console.error('Error loading conversations:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to load conversations',
//         variant: 'destructive',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadMessages = async (conversationId: string) => {
//     try {
//       setLoadingMessages(true);
//       const result = await getConversationMessages(conversationId);

//       if (result.error) {
//         toast({
//           title: 'Error',
//           description: result.error,
//           variant: 'destructive',
//         });
//         return;
//       }

//       setActiveMessages(result.messages || []);

//       await markMessagesAsRead(conversationId);

//       setConversations((prev) =>
//         prev.map((conv) =>
//           conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
//         )
//       );
//     } catch (error) {
//       console.error('Error loading messages:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to load messages',
//         variant: 'destructive',
//       });
//     } finally {
//       setLoadingMessages(false);
//     }
//   };

//   const handleSendMessage = async () => {
//     if (!messageText.trim() || !activeChat || sending) return;

//     const activeConversation = conversations.find((c) => c.id === activeChat);
//     if (!activeConversation?.other_user) return;

//     try {
//       setSending(true);
//       const result = await sendMessage(
//         activeConversation.other_user.id,
//         messageText
//       );

//       if (result.error) {
//         toast({
//           title: 'Error',
//           description: result.error,
//           variant: 'destructive',
//         });
//         return;
//       }

//       if (result.message) {
//         setActiveMessages((prev) => [...prev, result.message]);
//         setConversations((prev) =>
//           prev.map((conv) =>
//             conv.id === activeChat
//               ? {
//                   ...conv,
//                   last_message: result.message,
//                   updated_at: result.message.created_at,
//                 }
//               : conv
//           )
//         );
//       }

//       setMessageText('');
//     } catch (error) {
//       console.error('Error sending message:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to send message',
//         variant: 'destructive',
//       });
//     } finally {
//       setSending(false);
//     }
//   };

//   const handleSelectConversation = async (conversationId: string) => {
//     setActiveChat(conversationId);
//     await loadMessages(conversationId);
//     window.history.replaceState({}, '', `/messages?conversation=${conversationId}`);
//   };

//   const handleBackToConversations = () => {
//     setActiveChat(null);
//     setActiveMessages([]);
//     window.history.replaceState({}, '', '/messages');
//   };

//   // Modified to use the imported handleStartNewConversation
//   const startNewConversation = async (userId: string, initialMessage?: string) => {
//     try {
//       const result = await handleStartNewConversation(userId, initialMessage);

//       if (result.error) {
//         toast({
//           title: 'Error',
//           description: result.error,
//           variant: 'destructive',
//         });
//         return;
//       }

//       // Reload conversations to include the new one
//       await loadConversations();

//       if (result.conversationId) {
//         setActiveChat(result.conversationId);
//         await loadMessages(result.conversationId);
//         window.history.replaceState({}, '', `/messages?conversation=${result.conversationId}`);
//       }
//     } catch (error) {
//       console.error('Error starting conversation:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to start conversation',
//         variant: 'destructive',
//       });
//     }
//   };

//   const activeConversation = conversations.find((c) => c.id === activeChat);

//   if (loading) {
//     return (
//       <div className="container max-w-md mx-auto px-4 py-8 h-[calc(100vh-8rem)] flex items-center justify-center">
//         <div className="flex items-center space-x-2">
//           <Loader2 className="h-6 w-6 animate-spin" />
//           <span>Loading conversations...</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container max-w-md mx-auto px-0 py-4 h-[calc(100vh-8rem)]">
//       <AnimatePresence mode="wait">
//         {!activeChat ? (
//           <motion.div
//             key="conversations"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}
//             className="px-4"
//           >
//             <h1 className="text-2xl font-bold mb-6">Messages</h1>

//             {conversations.length === 0 ? (
//               <div className="text-center py-8">
//                 <p className="text-muted-foreground mb-4">No conversations yet</p>
//                 <p className="text-sm text-muted-foreground">
//                   Start browsing roommate profiles to begin conversations
//                 </p>
//               </div>
//             ) : (
//               <div className="space-y-2">
//                 {conversations.map((conversation) => (
//                   <div
//                     key={conversation.id}
//                     className="flex items-center p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
//                     onClick={() => handleSelectConversation(conversation.id)}
//                   >
//                     <Avatar className="h-12 w-12 mr-3">
//                       <AvatarImage
//                         src={conversation.other_user?.profile_url}
//                         alt={conversation.other_user?.full_name}
//                       />
//                       <AvatarFallback>
//                         {conversation.other_user?.full_name?.charAt(0) || '?'}
//                       </AvatarFallback>
//                     </Avatar>
//                     <div className="flex-1 min-w-0">
//                       <div className="flex justify-between items-center">
//                         <h3 className="font-medium truncate">
//                           {conversation.other_user?.full_name || 'Unknown User'}
//                         </h3>
//                         {conversation.last_message && (
//                           <span className="text-xs text-muted-foreground">
//                             <SafeTime
//                               date={new Date(conversation.last_message.created_at)}
//                             />
//                           </span>
//                         )}
//                       </div>
//                       {conversation.last_message ? (
//                         <p className="text-sm text-muted-foreground truncate">
//                           {conversation.last_message.sender_id ===
//                           conversation.other_user?.id
//                             ? ''
//                             : 'You: '}
//                           {conversation.last_message.content}
//                         </p>
//                       ) : (
//                         <p className="text-sm text-muted-foreground">
//                           No messages yet
//                         </p>
//                       )}
//                     </div>
//                     {conversation.unread_count > 0 && (
//                       <Badge className="ml-2 bg-primary">
//                         {conversation.unread_count}
//                       </Badge>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </motion.div>
//         ) : (
//           <motion.div
//             key="chat"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}
//             className="flex flex-col h-full"
//           >
//             {/* Chat Header */}
//             <div className="flex items-center p-3 border-b border-border">
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={handleBackToConversations}
//                 className="mr-2"
//               >
//                 <ArrowLeft className="h-5 w-5" />
//               </Button>
//               {activeConversation?.other_user && (
//                 <>
//                   <Avatar className="h-9 w-9 mr-2">
//                     <AvatarImage
//                       src={activeConversation.other_user.profile_url}
//                       alt={activeConversation.other_user.full_name}
//                     />
//                     <AvatarFallback>
//                       {activeConversation.other_user.full_name.charAt(0)}
//                     </AvatarFallback>
//                   </Avatar>
//                   <div>
//                     <h3 className="font-medium">
//                       {activeConversation.other_user.full_name}
//                     </h3>
//                     {activeConversation.other_user.location && (
//                       <p className="text-xs text-muted-foreground">
//                         {activeConversation.other_user.location}
//                       </p>
//                     )}
//                   </div>
//                 </>
//               )}
//             </div>

//             {/* Messages */}
//             <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
//               {loadingMessages ? (
//                 <div className="flex items-center justify-center py-8">
//                   <div className="flex items-center space-x-2">
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                     <span className="text-sm text-muted-foreground">
//                       Loading messages...
//                     </span>
//                   </div>
//                 </div>
//               ) : activeMessages.length === 0 ? (
//                 <div className="text-center py-8">
//                   <p className="text-muted-foreground">No messages yet</p>
//                   <p className="text-sm text-muted-foreground mt-1">
//                     Start the conversation!
//                   </p>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {activeMessages.map((message) => {
//                     const isOwnMessage =
//                       message.sender_id !== activeConversation?.other_user?.id;

//                     return (
//                       <motion.div
//                         key={message.id}
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ duration: 0.2 }}
//                         className={`flex ${
//                           isOwnMessage ? 'justify-end' : 'justify-start'
//                         }`}
//                       >
//                         <div
//                           className={`max-w-[80%] px-4 py-2 rounded-lg ${
//                             isOwnMessage
//                               ? 'bg-primary text-primary-foreground'
//                               : 'bg-secondary'
//                           }`}
//                         >
//                           <p className="whitespace-pre-wrap">
//                             {message.content}
//                           </p>
//                           <p
//                             className={`text-xs mt-1 ${
//                               isOwnMessage
//                                 ? 'text-primary-foreground/70'
//                                 : 'text-muted-foreground'
//                             }`}
//                           >
//                             <SafeTime
//                               date={new Date(message.created_at)}
//                               type="time"
//                               options={{ hour: '2-digit', minute: '2-digit' }}
//                             />
//                           </p>
//                         </div>
//                       </motion.div>
//                     );
//                   })}
//                 </div>
//               )}
//             </ScrollArea>

//             {/* Message Input */}
//             <div className="p-3 border-t border-border">
//               <form
//                 onSubmit={(e) => {
//                   e.preventDefault();
//                   handleSendMessage();
//                 }}
//                 className="flex gap-2"
//               >
//                 <Input
//                   placeholder="Type a message..."
//                   value={messageText}
//                   onChange={(e) => setMessageText(e.target.value)}
//                   className="flex-1"
//                   disabled={sending}
//                 />
//                 <Button
//                   type="submit"
//                   size="icon"
//                   disabled={!messageText.trim() || sending}
//                 >
//                   {sending ? (
//                     <Loader2 className="h-5 w-5 animate-spin" />
//                   ) : (
//                     <SendHorizontal className="h-5 w-5" />
//                   )}
//                 </Button>
//               </form>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// // Export the component only
// export default MessagesContent;



// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { ArrowLeft, SendHorizontal, Loader2 } from 'lucide-react';
// import { Badge } from '@/components/ui/badge';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { useSearchParams } from 'next/navigation';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// import SafeTime from './SafeTime';
// import { useToast } from '@/hooks/use-toast';
// import {
//   Conversation,
//   getConversationMessages,
//   getUserConversations,
//   markMessagesAsRead,
//   Message,
//   sendMessage,
//   startConversation,
//   getCurrentUserId,
//   handleStartNewConversation, // Import the standalone function
// } from '@/app/actions/message-actions';

// export function MessagesContent() {
//   const [activeChat, setActiveChat] = useState<string | null>(null);
//   const [conversations, setConversations] = useState<Conversation[]>([]);
//   const [activeMessages, setActiveMessages] = useState<Message[]>([]);
//   const [messageText, setMessageText] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [sending, setSending] = useState(false);
//   const [loadingMessages, setLoadingMessages] = useState(false);
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null);
//   const scrollAreaRef = useRef<HTMLDivElement>(null);
//   const { toast } = useToast();
//   const searchParams = useSearchParams();
//   const supabase = createClientComponentClient();

//   // Refs for polling intervals
//   const conversationsIntervalRef = useRef<NodeJS.Timeout | null>(null);
//   const messagesIntervalRef = useRef<NodeJS.Timeout | null>(null);

//   // Constants for polling intervals
//   const CONVERSATIONS_POLL_INTERVAL = 5000; // 5 seconds
//   const MESSAGES_POLL_INTERVAL = 3000; // 3 seconds

//   // Get current user ID
//   useEffect(() => {
//     const getUserId = async () => {
//       const userId = await getCurrentUserId();
//       setCurrentUserId(userId);
//     };
//     getUserId();
//   }, []);

//   // Load conversations on component mount
//   useEffect(() => {
//     loadConversations();
//   }, []);

//   // Set up polling for conversations
//   useEffect(() => {
//     // Start conversations polling
//     conversationsIntervalRef.current = setInterval(() => {
//       loadConversations();
//     }, CONVERSATIONS_POLL_INTERVAL);

//     // Cleanup interval on unmount
//     return () => {
//       if (conversationsIntervalRef.current) {
//         clearInterval(conversationsIntervalRef.current);
//       }
//     };
//   }, []);

//   // Set up polling for active chat messages
//   useEffect(() => {
//     if (activeChat) {
//       // Start messages polling when a chat is active
//       messagesIntervalRef.current = setInterval(() => {
//         loadMessages(activeChat, true); // true flag for silent loading
//       }, MESSAGES_POLL_INTERVAL);
//     } else {
//       // Clear messages polling when no active chat
//       if (messagesIntervalRef.current) {
//         clearInterval(messagesIntervalRef.current);
//       }
//     }

//     // Cleanup interval
//     return () => {
//       if (messagesIntervalRef.current) {
//         clearInterval(messagesIntervalRef.current);
//       }
//     };
//   }, [activeChat]);

//   // Set up real-time subscriptions
//   useEffect(() => {
//     if (!currentUserId) return;

//     const messagesSubscription = supabase
//       .channel('messages')
//       .on(
//         'postgres_changes',
//         {
//           event: 'INSERT',
//           schema: 'public',
//           table: 'messages',
//           filter: `receiver_id=eq.${currentUserId}`,
//         },
//         (payload) => {
//           const newMessage = payload.new as Message;
//           if (activeChat && newMessage.conversation_id === activeChat) {
//             setActiveMessages((prev) => {
//               // Avoid duplicates
//               if (prev.some(msg => msg.id === newMessage.id)) {
//                 return prev;
//               }
//               return [...prev, newMessage];
//             });
//             markMessagesAsRead(activeChat);
//           }
//           updateConversationWithNewMessage(newMessage);
//         }
//       )
//       .subscribe();

//     const messageUpdatesSubscription = supabase
//       .channel('message_updates')
//       .on(
//         'postgres_changes',
//         {
//           event: 'UPDATE',
//           schema: 'public',
//           table: 'messages',
//         },
//         (payload) => {
//           const updatedMessage = payload.new as Message;
//           if (activeChat && updatedMessage.conversation_id === activeChat) {
//             setActiveMessages((prev) =>
//               prev.map((msg) =>
//                 msg.id === updatedMessage.id ? updatedMessage : msg
//               )
//             );
//           }
//         }
//       )
//       .subscribe();

//     const conversationsSubscription = supabase
//       .channel('conversations')
//       .on(
//         'postgres_changes',
//         {
//           event: 'UPDATE',
//           schema: 'public',
//           table: 'conversations',
//           filter: `or(user1_id.eq.${currentUserId},user2_id.eq.${currentUserId})`,
//         },
//         () => {
//           loadConversations();
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(messagesSubscription);
//       supabase.removeChannel(messageUpdatesSubscription);
//       supabase.removeChannel(conversationsSubscription);
//     };
//   }, [currentUserId, activeChat, supabase]);

//   // Handle URL parameters to auto-open specific conversations
//   useEffect(() => {
//     if (conversations.length === 0) return;

//     const conversationId = searchParams.get('conversation');
//     const userId = searchParams.get('user');

//     if (conversationId) {
//       const conversation = conversations.find((c) => c.id === conversationId);
//       if (conversation) {
//         handleSelectConversation(conversationId);
//       }
//     } else if (userId) {
//       const conversation = conversations.find((c) => c.other_user?.id === userId);
//       if (conversation) {
//         handleSelectConversation(conversation.id);
//       } else {
//         // Start a new conversation if none exists
//         handleStartNewConversation(userId);
//       }
//     }
//   }, [conversations, searchParams]);

//   // Auto-scroll to bottom when new messages arrive
//   useEffect(() => {
//     if (scrollAreaRef.current) {
//       const scrollElement = scrollAreaRef.current.querySelector(
//         '[data-radix-scroll-area-viewport]'
//       );
//       if (scrollElement) {
//         scrollElement.scrollTop = scrollElement.scrollHeight;
//       }
//     }
//   }, [activeMessages]);

//   const updateConversationWithNewMessage = (newMessage: Message) => {
//     setConversations((prev) =>
//       prev.map((conv) => {
//         if (conv.id === newMessage.conversation_id) {
//           return {
//             ...conv,
//             last_message: newMessage,
//             updated_at: newMessage.created_at,
//             unread_count: activeChat === conv.id ? 0 : conv.unread_count + 1,
//           };
//         }
//         return conv;
//       })
//     );
//   };

//   const loadConversations = async (silent = false) => {
//     try {
//       if (!silent) {
//         setLoading(true);
//       }
      
//       const result = await getUserConversations();

//       if (result.error) {
//         if (!silent) {
//           toast({
//             title: 'Error',
//             description: result.error,
//             variant: 'destructive',
//           });
//         }
//         return;
//       }

//       setConversations(result.conversations || []);
//     } catch (error) {
//       console.error('Error loading conversations:', error);
//       if (!silent) {
//         toast({
//           title: 'Error',
//           description: 'Failed to load conversations',
//           variant: 'destructive',
//         });
//       }
//     } finally {
//       if (!silent) {
//         setLoading(false);
//       }
//     }
//   };

//   const loadMessages = async (conversationId: string, silent = false) => {
//     try {
//       if (!silent) {
//         setLoadingMessages(true);
//       }
      
//       const result = await getConversationMessages(conversationId);

//       if (result.error) {
//         if (!silent) {
//           toast({
//             title: 'Error',
//             description: result.error,
//             variant: 'destructive',
//           });
//         }
//         return;
//       }

//       // Only update if we have new messages or different message count
//       const newMessages = result.messages || [];
//       if (silent) {
//         setActiveMessages((prevMessages) => {
//           // Only update if the message count or content has changed
//           if (prevMessages.length !== newMessages.length || 
//               JSON.stringify(prevMessages.map(m => m.id)) !== JSON.stringify(newMessages.map(m => m.id))) {
//             return newMessages;
//           }
//           return prevMessages;
//         });
//       } else {
//         setActiveMessages(newMessages);
//       }

//       await markMessagesAsRead(conversationId);

//       setConversations((prev) =>
//         prev.map((conv) =>
//           conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
//         )
//       );
//     } catch (error) {
//       console.error('Error loading messages:', error);
//       if (!silent) {
//         toast({
//           title: 'Error',
//           description: 'Failed to load messages',
//           variant: 'destructive',
//         });
//       }
//     } finally {
//       if (!silent) {
//         setLoadingMessages(false);
//       }
//     }
//   };

//   const handleSendMessage = async () => {
//     if (!messageText.trim() || !activeChat || sending) return;

//     const activeConversation = conversations.find((c) => c.id === activeChat);
//     if (!activeConversation?.other_user) return;

//     try {
//       setSending(true);
//       const result = await sendMessage(
//         activeConversation.other_user.id,
//         messageText
//       );

//       if (result.error) {
//         toast({
//           title: 'Error',
//           description: result.error,
//           variant: 'destructive',
//         });
//         return;
//       }

//       if (result.message) {
//         setActiveMessages((prev) => {
//           // Avoid duplicates
//           if (prev.some(msg => msg.id === result.message.id)) {
//             return prev;
//           }
//           return [...prev, result.message];
//         });
        
//         setConversations((prev) =>
//           prev.map((conv) =>
//             conv.id === activeChat
//               ? {
//                   ...conv,
//                   last_message: result.message,
//                   updated_at: result.message.created_at,
//                 }
//               : conv
//           )
//         );
//       }

//       setMessageText('');
//     } catch (error) {
//       console.error('Error sending message:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to send message',
//         variant: 'destructive',
//       });
//     } finally {
//       setSending(false);
//     }
//   };

//   const handleSelectConversation = async (conversationId: string) => {
//     setActiveChat(conversationId);
//     await loadMessages(conversationId);
//     window.history.replaceState({}, '', `/messages?conversation=${conversationId}`);
//   };

//   const handleBackToConversations = () => {
//     setActiveChat(null);
//     setActiveMessages([]);
//     window.history.replaceState({}, '', '/messages');
//   };

//   // Modified to use the imported handleStartNewConversation
//   const startNewConversation = async (userId: string, initialMessage?: string) => {
//     try {
//       const result = await handleStartNewConversation(userId, initialMessage);

//       if (result.error) {
//         toast({
//           title: 'Error',
//           description: result.error,
//           variant: 'destructive',
//         });
//         return;
//       }

//       // Reload conversations to include the new one
//       await loadConversations();

//       if (result.conversationId) {
//         setActiveChat(result.conversationId);
//         await loadMessages(result.conversationId);
//         window.history.replaceState({}, '', `/messages?conversation=${result.conversationId}`);
//       }
//     } catch (error) {
//       console.error('Error starting conversation:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to start conversation',
//         variant: 'destructive',
//       });
//     }
//   };

//   const activeConversation = conversations.find((c) => c.id === activeChat);

//   if (loading) {
//     return (
//       <div className="container max-w-md mx-auto px-4 py-8 h-[calc(100vh-8rem)] flex items-center justify-center">
//         <div className="flex items-center space-x-2">
//           <Loader2 className="h-6 w-6 animate-spin" />
//           <span>Loading conversations...</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container max-w-md mx-auto px-0 py-4 h-[calc(100vh-8rem)]">
//       <AnimatePresence mode="wait">
//         {!activeChat ? (
//           <motion.div
//             key="conversations"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}
//             className="px-4"
//           >
//             <h1 className="text-2xl font-bold mb-6">Messages</h1>

//             {conversations.length === 0 ? (
//               <div className="text-center py-8">
//                 <p className="text-muted-foreground mb-4">No conversations yet</p>
//                 <p className="text-sm text-muted-foreground">
//                   Start browsing roommate profiles to begin conversations
//                 </p>
//               </div>
//             ) : (
//               <div className="space-y-2">
//                 {conversations.map((conversation) => (
//                   <div
//                     key={conversation.id}
//                     className="flex items-center p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
//                     onClick={() => handleSelectConversation(conversation.id)}
//                   >
//                     <Avatar className="h-12 w-12 mr-3">
//                       <AvatarImage
//                         src={conversation.other_user?.profile_url}
//                         alt={conversation.other_user?.full_name}
//                       />
//                       <AvatarFallback>
//                         {conversation.other_user?.full_name?.charAt(0) || '?'}
//                       </AvatarFallback>
//                     </Avatar>
//                     <div className="flex-1 min-w-0">
//                       <div className="flex justify-between items-center">
//                         <h3 className="font-medium truncate">
//                           {conversation.other_user?.full_name || 'Unknown User'}
//                         </h3>
//                         {conversation.last_message && (
//                           <span className="text-xs text-muted-foreground">
//                             <SafeTime
//                               date={new Date(conversation.last_message.created_at)}
//                             />
//                           </span>
//                         )}
//                       </div>
//                       {conversation.last_message ? (
//                         <p className="text-sm text-muted-foreground truncate">
//                           {conversation.last_message.sender_id ===
//                           conversation.other_user?.id
//                             ? ''
//                             : 'You: '}
//                           {conversation.last_message.content}
//                         </p>
//                       ) : (
//                         <p className="text-sm text-muted-foreground">
//                           No messages yet
//                         </p>
//                       )}
//                     </div>
//                     {conversation.unread_count > 0 && (
//                       <Badge className="ml-2 bg-primary">
//                         {conversation.unread_count}
//                       </Badge>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </motion.div>
//         ) : (
//           <motion.div
//             key="chat"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}
//             className="flex flex-col h-full"
//           >
//             {/* Chat Header */}
//             <div className="flex items-center p-3 border-b border-border">
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={handleBackToConversations}
//                 className="mr-2"
//               >
//                 <ArrowLeft className="h-5 w-5" />
//               </Button>
//               {activeConversation?.other_user && (
//                 <>
//                   <Avatar className="h-9 w-9 mr-2">
//                     <AvatarImage
//                       src={activeConversation.other_user.profile_url}
//                       alt={activeConversation.other_user.full_name}
//                     />
//                     <AvatarFallback>
//                       {activeConversation.other_user.full_name.charAt(0)}
//                     </AvatarFallback>
//                   </Avatar>
//                   <div>
//                     <h3 className="font-medium">
//                       {activeConversation.other_user.full_name}
//                     </h3>
//                     {activeConversation.other_user.location && (
//                       <p className="text-xs text-muted-foreground">
//                         {activeConversation.other_user.location}
//                       </p>
//                     )}
//                   </div>
//                 </>
//               )}
//             </div>

//             {/* Messages */}
//             <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
//               {loadingMessages ? (
//                 <div className="flex items-center justify-center py-8">
//                   <div className="flex items-center space-x-2">
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                     <span className="text-sm text-muted-foreground">
//                       Loading messages...
//                     </span>
//                   </div>
//                 </div>
//               ) : activeMessages.length === 0 ? (
//                 <div className="text-center py-8">
//                   <p className="text-muted-foreground">No messages yet</p>
//                   <p className="text-sm text-muted-foreground mt-1">
//                     Start the conversation!
//                   </p>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {activeMessages.map((message) => {
//                     const isOwnMessage =
//                       message.sender_id !== activeConversation?.other_user?.id;

//                     return (
//                       <motion.div
//                         key={message.id}
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ duration: 0.2 }}
//                         className={`flex ${
//                           isOwnMessage ? 'justify-end' : 'justify-start'
//                         }`}
//                       >
//                         <div
//                           className={`max-w-[80%] px-4 py-2 rounded-lg ${
//                             isOwnMessage
//                               ? 'bg-primary text-primary-foreground'
//                               : 'bg-secondary'
//                           }`}
//                         >
//                           <p className="whitespace-pre-wrap">
//                             {message.content}
//                           </p>
//                           <p
//                             className={`text-xs mt-1 ${
//                               isOwnMessage
//                                 ? 'text-primary-foreground/70'
//                                 : 'text-muted-foreground'
//                             }`}
//                           >
//                             <SafeTime
//                               date={new Date(message.created_at)}
//                               type="time"
//                               options={{ hour: '2-digit', minute: '2-digit' }}
//                             />
//                           </p>
//                         </div>
//                       </motion.div>
//                     );
//                   })}
//                 </div>
//               )}
//             </ScrollArea>

//             {/* Message Input */}
//             <div className="p-3 border-t border-border">
//               <form
//                 onSubmit={(e) => {
//                   e.preventDefault();
//                   handleSendMessage();
//                 }}
//                 className="flex gap-2"
//               >
//                 <Input
//                   placeholder="Type a message..."
//                   value={messageText}
//                   onChange={(e) => setMessageText(e.target.value)}
//                   className="flex-1"
//                   disabled={sending}
//                 />
//                 <Button
//                   type="submit"
//                   size="icon"
//                   disabled={!messageText.trim() || sending}
//                 >
//                   {sending ? (
//                     <Loader2 className="h-5 w-5 animate-spin" />
//                   ) : (
//                     <SendHorizontal className="h-5 w-5" />
//                   )}
//                 </Button>
//               </form>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// // Export the component only
// export default MessagesContent;






'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, SendHorizontal, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import SafeTime from './SafeTime';
import { useToast } from '@/hooks/use-toast';
import {
  Conversation,
  getConversationMessages,
  getUserConversations,
  markMessagesAsRead,
  Message,
  sendMessage,
  startConversation,
  getCurrentUserId,
  handleStartNewConversation, // Import the standalone function
} from '@/app/actions/message-actions';

export function MessagesContent() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Track if initial loads have completed
  const [conversationsInitialLoaded, setConversationsInitialLoaded] = useState(false);
  const [messagesInitialLoaded, setMessagesInitialLoaded] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  // Refs for polling intervals
  const conversationsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Constants for polling intervals
  const CONVERSATIONS_POLL_INTERVAL = 5000; // 5 seconds
  const MESSAGES_POLL_INTERVAL = 3000; // 3 seconds

  // Get current user ID
  useEffect(() => {
    const getUserId = async () => {
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
    };
    getUserId();
  }, []);

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Set up polling for conversations
  useEffect(() => {
    // Only start polling after initial load is complete
    if (!conversationsInitialLoaded) return;

    // Start conversations polling
    conversationsIntervalRef.current = setInterval(() => {
      loadConversations(true); // Always silent for polling
    }, CONVERSATIONS_POLL_INTERVAL);

    // Cleanup interval on unmount
    return () => {
      if (conversationsIntervalRef.current) {
        clearInterval(conversationsIntervalRef.current);
      }
    };
  }, [conversationsInitialLoaded]);

  // Set up polling for active chat messages
  useEffect(() => {
    if (activeChat && messagesInitialLoaded) {
      // Start messages polling when a chat is active and initial load is done
      messagesIntervalRef.current = setInterval(() => {
        loadMessages(activeChat, true); // true flag for silent loading
      }, MESSAGES_POLL_INTERVAL);
    } else {
      // Clear messages polling when no active chat
      if (messagesIntervalRef.current) {
        clearInterval(messagesIntervalRef.current);
      }
    }

    // Cleanup interval
    return () => {
      if (messagesIntervalRef.current) {
        clearInterval(messagesIntervalRef.current);
      }
    };
  }, [activeChat, messagesInitialLoaded]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentUserId) return;

    const messagesSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (activeChat && newMessage.conversation_id === activeChat) {
            setActiveMessages((prev) => {
              // Avoid duplicates
              if (prev.some(msg => msg.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
            markMessagesAsRead(activeChat);
          }
          updateConversationWithNewMessage(newMessage);
        }
      )
      .subscribe();

    const messageUpdatesSubscription = supabase
      .channel('message_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          if (activeChat && updatedMessage.conversation_id === activeChat) {
            setActiveMessages((prev) =>
              prev.map((msg) =>
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            );
          }
        }
      )
      .subscribe();

    const conversationsSubscription = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `or(user1_id.eq.${currentUserId},user2_id.eq.${currentUserId})`,
        },
        () => {
          // Always silent for real-time updates
          loadConversations(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(messageUpdatesSubscription);
      supabase.removeChannel(conversationsSubscription);
    };
  }, [currentUserId, activeChat, supabase]);

  // Handle URL parameters to auto-open specific conversations
  useEffect(() => {
    if (conversations.length === 0) return;

    const conversationId = searchParams.get('conversation');
    const userId = searchParams.get('user');

    if (conversationId) {
      const conversation = conversations.find((c) => c.id === conversationId);
      if (conversation) {
        handleSelectConversation(conversationId);
      }
    } else if (userId) {
      const conversation = conversations.find((c) => c.other_user?.id === userId);
      if (conversation) {
        handleSelectConversation(conversation.id);
      } else {
        // Start a new conversation if none exists
        handleStartNewConversation(userId);
      }
    }
  }, [conversations, searchParams]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [activeMessages]);

  const updateConversationWithNewMessage = (newMessage: Message) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === newMessage.conversation_id) {
          return {
            ...conv,
            last_message: newMessage,
            updated_at: newMessage.created_at,
            unread_count: activeChat === conv.id ? 0 : conv.unread_count + 1,
          };
        }
        return conv;
      })
    );
  };

  const loadConversations = async (silent = false) => {
    try {
      // Only show loading state for initial load
      if (!silent && !conversationsInitialLoaded) {
        setLoading(true);
      }
      
      const result = await getUserConversations();

      if (result.error) {
        if (!silent) {
          toast({
            title: 'Error',
            description: result.error,
            variant: 'destructive',
          });
        }
        return;
      }

      setConversations(result.conversations || []);
      
      // Mark initial load as complete
      if (!conversationsInitialLoaded) {
        setConversationsInitialLoaded(true);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      if (!silent) {
        toast({
          title: 'Error',
          description: 'Failed to load conversations',
          variant: 'destructive',
        });
      }
    } finally {
      // Only update loading state for initial load
      if (!silent && !conversationsInitialLoaded) {
        setLoading(false);
      }
    }
  };

  const loadMessages = async (conversationId: string, silent = false) => {
    try {
      // Only show loading state for initial load of messages
      if (!silent && !messagesInitialLoaded) {
        setLoadingMessages(true);
      }
      
      const result = await getConversationMessages(conversationId);

      if (result.error) {
        if (!silent) {
          toast({
            title: 'Error',
            description: result.error,
            variant: 'destructive',
          });
        }
        return;
      }

      // Only update if we have new messages or different message count
      const newMessages = result.messages || [];
      if (silent) {
        setActiveMessages((prevMessages) => {
          // Only update if the message count or content has changed
          if (prevMessages.length !== newMessages.length || 
              JSON.stringify(prevMessages.map(m => m.id)) !== JSON.stringify(newMessages.map(m => m.id))) {
            return newMessages;
          }
          return prevMessages;
        });
      } else {
        setActiveMessages(newMessages);
      }

      await markMessagesAsRead(conversationId);

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      );

      // Mark initial messages load as complete
      if (!messagesInitialLoaded) {
        setMessagesInitialLoaded(true);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      if (!silent) {
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive',
        });
      }
    } finally {
      // Only update loading state for initial load
      if (!silent && !messagesInitialLoaded) {
        setLoadingMessages(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeChat || sending) return;

    const activeConversation = conversations.find((c) => c.id === activeChat);
    if (!activeConversation?.other_user) return;

    try {
      setSending(true);
      const result = await sendMessage(
        activeConversation.other_user.id,
        messageText
      );

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      if (result.message) {
        setActiveMessages((prev) => {
          // Avoid duplicates
          if (prev.some(msg => msg.id === result.message.id)) {
            return prev;
          }
          return [...prev, result.message];
        });
        
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeChat
              ? {
                  ...conv,
                  last_message: result.message,
                  updated_at: result.message.created_at,
                }
              : conv
          )
        );
      }

      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    setActiveChat(conversationId);
    // Reset messages initial loaded state for new conversation
    setMessagesInitialLoaded(false);
    await loadMessages(conversationId);
    window.history.replaceState({}, '', `/messages?conversation=${conversationId}`);
  };

  const handleBackToConversations = () => {
    setActiveChat(null);
    setActiveMessages([]);
    // Reset messages initial loaded state
    setMessagesInitialLoaded(false);
    window.history.replaceState({}, '', '/messages');
  };

  // Modified to use the imported handleStartNewConversation
  const startNewConversation = async (userId: string, initialMessage?: string) => {
    try {
      const result = await handleStartNewConversation(userId, initialMessage);

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      // Reload conversations to include the new one (silent since we've already loaded once)
      await loadConversations(conversationsInitialLoaded);

      if (result.conversationId) {
        setActiveChat(result.conversationId);
        // Reset messages initial loaded state for new conversation
        setMessagesInitialLoaded(false);
        await loadMessages(result.conversationId);
        window.history.replaceState({}, '', `/messages?conversation=${result.conversationId}`);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive',
      });
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeChat);

  // Only show initial loading state
  if (loading && !conversationsInitialLoaded) {
    return (
      <div className="container max-w-md mx-auto px-4 py-8 h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading conversations...</span>
        </div>
      </div>
    );
  }

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

            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No conversations yet</p>
                <p className="text-sm text-muted-foreground">
                  Start browsing roommate profiles to begin conversations
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                    onClick={() => handleSelectConversation(conversation.id)}
                  >
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarImage
                        src={conversation.other_user?.profile_url}
                        alt={conversation.other_user?.full_name}
                      />
                      <AvatarFallback>
                        {conversation.other_user?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium truncate">
                          {conversation.other_user?.full_name || 'Unknown User'}
                        </h3>
                        {conversation.last_message && (
                          <span className="text-xs text-muted-foreground">
                            <SafeTime
                              date={new Date(conversation.last_message.created_at)}
                            />
                          </span>
                        )}
                      </div>
                      {conversation.last_message ? (
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.last_message.sender_id ===
                          conversation.other_user?.id
                            ? ''
                            : 'You: '}
                          {conversation.last_message.content}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No messages yet
                        </p>
                      )}
                    </div>
                    {conversation.unread_count > 0 && (
                      <Badge className="ml-2 bg-primary">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
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
            {/* Chat Header */}
            <div className="flex items-center p-3 border-b border-border">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToConversations}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              {activeConversation?.other_user && (
                <>
                  <Avatar className="h-9 w-9 mr-2">
                    <AvatarImage
                      src={activeConversation.other_user.profile_url}
                      alt={activeConversation.other_user.full_name}
                    />
                    <AvatarFallback>
                      {activeConversation.other_user.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">
                      {activeConversation.other_user.full_name}
                    </h3>
                    {activeConversation.other_user.location && (
                      <p className="text-xs text-muted-foreground">
                        {activeConversation.other_user.location}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              {loadingMessages && !messagesInitialLoaded ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Loading messages...
                    </span>
                  </div>
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start the conversation!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeMessages.map((message) => {
                    const isOwnMessage =
                      message.sender_id !== activeConversation?.other_user?.id;

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">
                            {message.content}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwnMessage
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            }`}
                          >
                            <SafeTime
                              date={new Date(message.created_at)}
                              type="time"
                              options={{ hour: '2-digit', minute: '2-digit' }}
                            />
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
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
                  disabled={sending}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!messageText.trim() || sending}
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <SendHorizontal className="h-5 w-5" />
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export the component only
export default MessagesContent;