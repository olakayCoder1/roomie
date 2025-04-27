'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Home, Users, Building2, MessageCircle, User } from 'lucide-react';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Roommates', href: '/roommates', icon: Users },
  { name: 'Places', href: '/places', icon: Building2 },
  { name: 'Messages', href: '/messages', icon: MessageCircle },
  { name: 'Profile', href: '/profile', icon: User },
];

export function NavigationBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'h-6 w-6 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                {isActive && (
                  <motion.div
                    layoutId="navigation-indicator"
                    className="absolute -bottom-3 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </div>
              <span className="mt-1 text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}