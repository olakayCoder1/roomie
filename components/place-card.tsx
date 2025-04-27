'use client';

import { Place } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, MapPin, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export function PlaceCard({ place }: { place: Place }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div>
            <div className="relative">
              <AspectRatio ratio={16/9}>
                <img 
                  src={place.imageUrl} 
                  alt={place.title}
                  className="w-full h-full object-cover"
                />
              </AspectRatio>
              <div className="absolute top-2 right-2">
                <Badge className="bg-primary text-primary-foreground">
                  ${place.rent}/mo
                </Badge>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold line-clamp-1">{place.title}</h3>
                <Badge variant="outline" className="capitalize ml-2">
                  {place.type}
                </Badge>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground mt-1 mb-2">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                <span>{place.location}</span>
              </div>
              
              <div className="flex flex-wrap gap-2 my-2">
                <Badge variant="secondary" className="text-xs">
                  {place.bedrooms} Bed
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {place.bathrooms} Bath
                </Badge>
                {place.amenities.slice(0, 2).map((amenity, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
                {place.amenities.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{place.amenities.length - 2}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center text-xs text-muted-foreground mb-3">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span>Available from {new Date(place.availableFrom).toLocaleDateString()}</span>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-1" /> Contact
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