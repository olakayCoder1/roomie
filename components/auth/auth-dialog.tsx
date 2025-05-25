'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { User, LogOut } from 'lucide-react';

export function AuthDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const { toast } = useToast();

  // Auto-show modal if user is not logged in (after loading is complete)
  useEffect(() => {
    console.log(loading)
    console.log(user)
    if (!loading && !user) {
      setIsOpen(true);
    }
  }, [user, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password, username);
        if (result.success) {
          toast({
            title: 'Account created!',
            description: 'Welcome! You have successfully created your account.',
          });
          // Explicitly close modal on success
          setIsOpen(false);
          // Reset form
          setEmail('');
          setPassword('');
          setUsername('');
          setIsSignUp(false);
        }
      } else {
        result = await signIn(email, password);
        if (result.success) {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully signed in.',
          });
          // Explicitly close modal on success
          setIsOpen(false);
          // Reset form
          setEmail('');
          setPassword('');
          setUsername('');
          setIsSignUp(false);
        }
      }

      // Only show error if authentication failed
      if (!result.success && result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    // Only allow closing if user is authenticated
    if (!open && !user) {
      return;
    }
    setIsOpen(open);
  };

  // Show loading state
  if (loading) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  // If user is logged in, show user menu
  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {user.username || user.full_name || user.email}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-sm text-muted-foreground">
            {user.email}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // If user is not logged in, show sign in button and modal
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Sign In</Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-md"
        // Prevent closing with escape key if user is not authenticated
        onEscapeKeyDown={(e) => {
          if (!user) {
            e.preventDefault();
          }
        }}
        // Prevent closing by clicking outside if user is not authenticated
        onInteractOutside={(e) => {
          if (!user) {
            e.preventDefault();
          }
        }}
        // Hide the close button when user is not authenticated
        //@ts-ignore
        // hideCloseButton={!user}
      >
        <DialogHeader>
          <DialogTitle>{isSignUp ? 'Create Account' : 'Welcome Back'}</DialogTitle>
          <DialogDescription>
            {isSignUp
              ? 'Create an account to start finding your perfect match'
              : 'Sign in to your account to continue'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="username">Full Name</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your full name"
                required
                disabled={isSubmitting}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={6}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isSubmitting}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}