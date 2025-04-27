'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Edit, Plus, User, BookmarkCheck, Calendar, DollarSign, Settings } from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function ProfileContent() {
  const [isEditing, setIsEditing] = useState(false);
  const [budgetRange, setBudgetRange] = useState([800, 1500]);

  // Mock profile data
  const profile = {
    name: 'Alex Johnson',
    age: 24,
    avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg',
    bio: 'Tech enthusiast, loves hiking and cooking. Clean and organized roommate looking for similar.',
    occupation: 'Software Engineer',
    location: 'San Francisco, CA',
    moveInDate: '2023-06-15',
    lifestylePreferences: ['Non-smoker', 'Pet-friendly', 'Early riser', 'Clean', 'Social'],
    savedRoommates: 3,
    savedPlaces: 5,
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-6 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <Avatar className="h-20 w-20 mr-4">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback>AJ</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{profile.name}, {profile.age}</h1>
              <p className="text-muted-foreground">{profile.occupation}</p>
              <p className="text-muted-foreground">{profile.location}</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={() => setIsEditing(!isEditing)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>

        {isEditing ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue={profile.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" defaultValue={profile.age} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input id="occupation" defaultValue={profile.occupation} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" defaultValue={profile.location} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" defaultValue={profile.bio} />
                </div>
                <div className="space-y-2">
                  <Label>Budget Range: ₦{budgetRange[0]} - ₦{budgetRange[1]}</Label>
                  <Slider
                    min={400}
                    max={3000}
                    step={100}
                    value={budgetRange}
                    onValueChange={setBudgetRange}
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={() => setIsEditing(false)}>Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="mb-4">{profile.bio}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {profile.lifestylePreferences.map((pref, index) => (
                  <Badge key={index} variant="secondary">{pref}</Badge>
                ))}
              </div>
              <div className="flex flex-col space-y-2 text-sm">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" /> 
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="ml-2">₦{budgetRange[0]} - ₦{budgetRange[1]}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" /> 
                  <span className="text-muted-foreground">Available from:</span>
                  <span className="ml-2">{new Date(profile.moveInDate).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="bookmarks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookmarks">Saved</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="bookmarks">
            <Card>
              <CardHeader>
                <CardTitle>Saved Items</CardTitle>
                <CardDescription>Places and roommates you've saved</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Saved Roommates
                  </div>
                  <Badge variant="secondary">{profile.savedRoommates}</Badge>
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <BookmarkCheck className="h-4 w-4 mr-2" />
                    Saved Places
                  </div>
                  <Badge variant="secondary">{profile.savedPlaces}</Badge>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Roommate Preferences</CardTitle>
                <CardDescription>What you're looking for in a roommate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1 mb-2">
                  {profile.lifestylePreferences.map((pref, index) => (
                    <Badge key={index} variant="secondary">{pref}</Badge>
                  ))}
                  <Badge variant="outline" className="cursor-pointer">
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Badge>
                </div>
                <Button variant="outline" className="w-full">Edit Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Privacy Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Notification Preferences
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive">
                  <Settings className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}