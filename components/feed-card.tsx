'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Place, User, FeedItem } from '@/types';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';

export function FeedCard({ item }: { item: FeedItem }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });

  const isRoommate = item.type === 'roommate';

  if (isRoommate && isUser(item.data)) {
    const roommate = item.data;
    return (
      <RoommateCard roommate={roommate} isInView={isInView} containerRef={ref} />
    );
  } else if (!isRoommate && isPlace(item.data)) {
    const place = item.data;
    return (
      <PlaceCard place={place} isInView={isInView} containerRef={ref} />
    );
  }

  return null;

  function isUser(data: any): data is User {
    return data && typeof data.name === 'string' && typeof data.age === 'number';
  }

  function isPlace(data: any): data is Place {
    return data && typeof data.title === 'string' && typeof data.rent === 'number';
  }
}

function RoommateCard({ 
  roommate, 
  isInView, 
  containerRef 
}: { 
  roommate: User;
  isInView: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div 
      ref={containerRef} 
      className={cn(
        "w-full border border-border rounded-xl mb-4 overflow-hidden bg-card transition-opacity",
        isInView ? "opacity-100" : "opacity-40"
      )}
    >
      <div className="relative">
        <AspectRatio ratio={4/5}>
          <img
            src={roommate.avatarUrl}
            alt={roommate.name}
            className="w-full h-full object-cover"
          />
        </AspectRatio>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{roommate.name}, {roommate.age}</h3>
              <p className="text-sm opacity-90">{roommate.occupation}</p>
              <p className="text-sm opacity-90">{roommate.location}</p>
            </div>
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-none">
              {roommate.compatibility}% Match
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex flex-wrap gap-1 mb-3">
          {roommate.lifestylePreferences.map((pref, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {pref}
            </Badge>
          ))}
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{roommate.bio}</p>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            <span className="font-semibold">Budget:</span> ${roommate.budget.min} - ${roommate.budget.max}
          </div>
          <div>
            <span className="font-semibold">Available:</span> {new Date(roommate.moveInDate).toLocaleDateString()}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between p-3 border-t border-border">
        <CardActions />
      </div>
    </div>
  );
}

function PlaceCard({ 
  place, 
  isInView, 
  containerRef 
}: { 
  place: Place;
  isInView: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div 
      ref={containerRef} 
      className={cn(
        "w-full border border-border rounded-xl mb-4 overflow-hidden bg-card transition-opacity",
        isInView ? "opacity-100" : "opacity-40"
      )}
    >
      <div className="relative">
        <AspectRatio ratio={16/9}>
          <img
            src={place.imageUrl}
            alt={place.title}
            className="w-full h-full object-cover"
          />
        </AspectRatio>
        <div className="absolute top-3 right-3">
          <Badge className="bg-primary text-primary-foreground">
            ${place.rent}/mo
          </Badge>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          <h3 className="text-lg font-semibold">{place.title}</h3>
          <p className="text-sm opacity-90">{place.location}</p>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between mb-3 text-sm">
          <div>
            <span className="font-semibold">{place.bedrooms}</span> Bed • <span className="font-semibold">{place.bathrooms}</span> Bath
          </div>
          <div>
            <span className="capitalize">{place.type}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {place.amenities.slice(0, 4).map((amenity, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {amenity}
            </Badge>
          ))}
          {place.amenities.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{place.amenities.length - 4} more
            </Badge>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{place.description}</p>
        
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={place.owner.avatarUrl} alt={place.owner.name} />
            <AvatarFallback>{place.owner.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p className="font-medium">{place.owner.name}</p>
            <p className="text-muted-foreground">Available from {new Date(place.availableFrom).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between p-3 border-t border-border">
        <CardActions />
      </div>
    </div>
  );
}

function CardActions() {
  return (
    <div className="flex justify-between w-full">
      <div className="flex gap-4">
        <Button variant="ghost" size="icon" className="group">
          <Heart className="h-5 w-5 group-hover:fill-red-500 group-hover:text-red-500 transition-colors" />
        </Button>
        <Button variant="ghost" size="icon" className="group">
          <MessageCircle className="h-5 w-5 group-hover:text-primary transition-colors" />
        </Button>
        <Button variant="ghost" size="icon" className="group">
          <Share className="h-5 w-5 group-hover:text-primary transition-colors" />
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" className="group">
          <Info className="h-5 w-5 group-hover:text-primary transition-colors" />
        </Button>
        <Button variant="ghost" size="icon" className="group">
          <Bookmark className="h-5 w-5 group-hover:fill-primary group-hover:text-primary transition-colors" />
        </Button>
      </div>
    </div>
  );
}