'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { roommates } from '@/data/roommates';
import { User } from '@/types';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { UserCard } from '@/components/user-card';

export function RoommatesFeed() {
  const [filteredRoommates, setFilteredRoommates] = useState<User[]>(roommates);
  const [searchTerm, setSearchTerm] = useState('');
  const [budgetRange, setBudgetRange] = useState([500, 2000]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    filterRoommates(term, budgetRange);
  };

  const handleBudgetChange = (value: number[]) => {
    setBudgetRange(value);
    filterRoommates(searchTerm, value);
  };

  const filterRoommates = (term: string, budget: number[]) => {
    const filtered = roommates.filter(roommate => {
      const matchesSearch = 
        roommate.name.toLowerCase().includes(term) || 
        roommate.location.toLowerCase().includes(term) ||
        roommate.occupation.toLowerCase().includes(term) ||
        roommate.bio.toLowerCase().includes(term);
      
      const matchesBudget = 
        roommate.budget.max >= budget[0] && roommate.budget.min <= budget[1];
      
      return matchesSearch && matchesBudget;
    });
    
    setFilteredRoommates(filtered);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, location, etc."
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
              <SheetTitle>Filter Options</SheetTitle>
              <SheetDescription>
                Refine your roommate search
              </SheetDescription>
            </SheetHeader>
            <div className="py-6">
              <div className="mb-6">
                <Label htmlFor="budget-range" className="block mb-2">
                  Budget Range: ${budgetRange[0]} - ${budgetRange[1]}
                </Label>
                <Slider
                  id="budget-range"
                  min={400}
                  max={3000}
                  step={100}
                  value={budgetRange}
                  onValueChange={handleBudgetChange}
                  className="mt-2"
                />
              </div>
              <Button className="w-full">Apply Filters</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="space-y-4">
        {filteredRoommates.length > 0 ? (
          filteredRoommates.map((roommate, index) => (
            <motion.div
              key={roommate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <UserCard user={roommate} />
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No roommates found matching your criteria.</p>
            <Button variant="link" onClick={() => {
              setSearchTerm('');
              setBudgetRange([500, 2000]);
              setFilteredRoommates(roommates);
            }}>
              Reset filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}