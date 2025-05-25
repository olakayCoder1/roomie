// components/TopNav.tsx
'use client';

import { Search, Bell, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { useAuth } from '@/lib/hooks/use-auth';
import Link from 'next/link';

export function TopNav() { 
  const { user } = useAuth();

  return (
    <motion.div
      className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`flex items-center px-4 py-3 border-b border-border ${
          user ? 'justify-center' : 'justify-between'
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-xl bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
            Roomie
          </span>
        </Link>

        {/* Right-side buttons */}
        <div className={`flex items-center gap-3 ${user ? 'absolute right-4' : ''}`}>
          {/* <Button variant="ghost" size="icon" className="text-foreground">
            <Search className="h-5 w-5" />
          </Button> */}
          {user ? (
            <>
              {/* <Button variant="ghost" size="icon" className="text-foreground">
                <Bell className="h-5 w-5" />
              </Button>
              <Link href="/profile">
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link> */}
            </>
          ) : (
            <AuthDialog />
          )}
        </div>
      </div>
    </motion.div>
  );
}