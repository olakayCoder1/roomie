'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { places } from '@/data/places';
import { Place } from '@/types';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { PlaceCard } from '@/components/place-card';

export function PlacesFeed() {
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>(places);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([400, 2000]);
  const [placeType, setPlaceType] = useState<string>('all');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    filterPlaces(term, priceRange, placeType);
  };

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value);
    filterPlaces(searchTerm, value, placeType);
  };

  const handleTypeChange = (value: string) => {
    setPlaceType(value);
    filterPlaces(searchTerm, priceRange, value);
  };

  const filterPlaces = (term: string, price: number[], type: string) => {
    const filtered = places.filter(place => {
      const matchesSearch = 
        place.title.toLowerCase().includes(term) || 
        place.location.toLowerCase().includes(term) ||
        place.description.toLowerCase().includes(term);
      
      const matchesPrice = place.rent >= price[0] && place.rent <= price[1];
      
      const matchesType = type === 'all' || place.type === type;
      
      return matchesSearch && matchesPrice && matchesType;
    });
    
    setFilteredPlaces(filtered);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, location, etc."
            className="pl-9"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Places</SheetTitle>
              <SheetDescription>
                Find the perfect place to stay
              </SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-6">
              <div>
                <Label htmlFor="place-type" className="block mb-2">
                  Property Type
                </Label>
                <Select value={placeType} onValueChange={handleTypeChange}>
                  <SelectTrigger id="place-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="hostel">Hostel</SelectItem>
                    <SelectItem value="dormitory">Dormitory</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price-range" className="block mb-2">
                  Price Range: ₦{priceRange[0]} - ₦{priceRange[1]}
                </Label>
                <Slider
                  id="price-range"
                  min={300}
                  max={3000}
                  step={50}
                  value={priceRange}
                  onValueChange={handlePriceChange}
                  className="mt-2"
                />
              </div>
              
              <Button className="w-full">Apply Filters</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="space-y-4">
        {filteredPlaces.length > 0 ? (
          filteredPlaces.map((place, index) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <PlaceCard place={place} />
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No places found matching your criteria.</p>
            <Button variant="link" onClick={() => {
              setSearchTerm('');
              setPriceRange([400, 2000]);
              setPlaceType('all');
              setFilteredPlaces(places);
            }}>
              Reset filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}