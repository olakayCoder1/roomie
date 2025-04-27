'use client';

import { User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function UserCard({ user }: { user: User }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            <div className="relative w-1/3">
              <img 
                src={user.avatarUrl} 
                alt={user.name}
                className="w-full h-full object-cover aspect-square"
              />
              {user.compatibility && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-primary/90 backdrop-blur-sm text-white">
                    {user.compatibility}% Match
                  </Badge>
                </div>
              )}
            </div>
            <div className="w-2/3 p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{user.name}, {user.age}</h3>
                  <p className="text-sm text-muted-foreground">{user.occupation}</p>
                  <p className="text-sm text-muted-foreground">{user.location}</p>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex flex-wrap gap-1 my-2">
                {user.lifestylePreferences.slice(0, 2).map((pref, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {pref}
                  </Badge>
                ))}
                {user.lifestylePreferences.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{user.lifestylePreferences.length - 2}
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {user.bio}
              </p>
              
              <div className="flex text-xs text-muted-foreground mb-3">
                <span className="mr-3">
                  <span className="font-medium">Budget:</span> ₦{user.budget.min}-₦{user.budget.max}
                </span>
                <span>
                  <span className="font-medium">Available:</span> {new Date(user.moveInDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-1" /> Message
                </Button>
                <Button size="sm" variant="outline">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}