'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { getUserInterests } from '@/app/actions/feed-actions';
import { useToast } from '@/hooks/use-toast';
import { UserCard } from './user-card';

interface RoommatesFeedProps {
  roommates: User[]; // not used anymore but can serve as fallback
  currentUserId?: string;
}

export function RoommatesFeed({ roommates, currentUserId }: RoommatesFeedProps) {
  const [baseRoommates, setBaseRoommates] = useState<User[]>([]);
  const [filteredRoommates, setFilteredRoommates] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [budgetRange, setBudgetRange] = useState([500, 2000]);
  const [isLoadingInterests, setIsLoadingInterests] = useState(false);
  const { toast } = useToast();

  // Filter roommates based on search and budget
  const filterRoommates = (term: string, budget: number[]) => {
    const filtered = baseRoommates.filter(roommate => {
      const matchesSearch =
        (roommate.name?.toLowerCase().includes(term) || '') ||
        (roommate.location?.toLowerCase().includes(term) || '') ||
        (roommate.occupation?.toLowerCase().includes(term) || '') ||
        (roommate.bio?.toLowerCase().includes(term) || '');

      const matchesBudget =
        (roommate.budget?.max || 0) >= budget[0] &&
        (roommate.budget?.min || 0) <= budget[1];

      return matchesSearch && matchesBudget;
    });

    setFilteredRoommates(filtered);
  };


  const fetchInterests = async () => {
      setIsLoadingInterests(true);
      try {
        const result = await getUserInterests(currentUserId);
        if (result.error) {
          toast({
            title: 'Error',
            description: result.error,
            variant: 'destructive',
          });
          return;
        }

        const data = result.data || [];
        setBaseRoommates(data);             // Store full list
        setFilteredRoommates(data);         // Initialize filtered list
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load interested users',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingInterests(false);
      }
    };

  // Fetch interested users
  useEffect(() => {
    if (!currentUserId) return;

    fetchInterests();
  }, [currentUserId, toast]);

  // Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    filterRoommates(term, budgetRange);
  };

  const handleBudgetChange = (value: number[]) => {
    setBudgetRange(value);
    filterRoommates(searchTerm, value);
  };

  const resetFilters = () => {
    const defaultBudget = [500, 2000];
    setSearchTerm('');
    setBudgetRange(defaultBudget);
    filterRoommates('', defaultBudget);
    fetchInterests();
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
              <SheetDescription>Refine your roommate search</SheetDescription>
            </SheetHeader>
            <div className="py-6">
              <div className="mb-6">
                <Label htmlFor="budget-range" className="block mb-2">
                  Budget Range: ₦{budgetRange[0]} - ₦{budgetRange[1]}
                </Label>
                <Slider
                  id="budget-range"
                  min={30000}
                  max={300000}
                  step={10000}
                  value={budgetRange}
                  onValueChange={handleBudgetChange}
                  className="mt-2"
                />
              </div>
              <Button className="w-full" onClick={() => filterRoommates(searchTerm, budgetRange)}>
                Apply Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="space-y-4">
        {isLoadingInterests ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading interested users...</p>
          </div>
        ) : (
          <>
            {filteredRoommates.length > 0 ? (
              filteredRoommates.map((roommate, index) => (
                <motion.div
                  key={roommate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <UserCard user={roommate} isInterested={true} />
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No roommates found matching your criteria.
                </p>
                <Button variant="link" onClick={resetFilters}>
                  Reset filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
