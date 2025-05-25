'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Edit, Plus, User, Settings, X, Camera, Upload, Loader2 } from 'lucide-react';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/use-auth';
import { updatePreferences, updateProfile, uploadProfilePicture } from '@/app/actions/profile';
import { checkAuth } from '@/app/actions/auth';
import { useToast } from '@/hooks/use-toast';

const fallbackAvatar = '/roommate-default.png';

export function ProfileContent() {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [budgetRange, setBudgetRange] = useState([0, 100000]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { user, loading, signOut, refreshUser } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<string[]>(user?.lifestylePreferences || []);
  const [newPreference, setNewPreference] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for editing profile
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    age: user?.age || 0,
    location: user?.location || '',
    bio: user?.bio || '',
    department: user?.department || '',
    level: user?.level || '',
  });

  // Function to refresh user data from server
  const refreshUserData = async () => {
    try {
      const authData = await checkAuth();
      if (authData && authData.success && authData.user) {
        if (refreshUser) {
          await refreshUser();
        }
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // Update form data when user changes
  useEffect(() => {
    setFormData({
      name: user?.full_name || '',
      age: user?.age || 0,
      location: user?.location || '',
      bio: user?.bio || '',
      department: user?.department || '',
      level: user?.level || '',
    });
    setBudgetRange([user?.budget_low || 0, user?.budget_high || 0]);
    setPreferences(user?.lifestylePreferences || []);
  }, [user]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image must be smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload the file
      handleImageUpload(file);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to upload a profile picture",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadProfilePicture(user.id, formData);
      console.log()
      if (result.success && result.profileUrl) {
        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        });
        
        // Update the user's profile with the new image URL
        await updateProfile(user.id, { profile_url: result.profileUrl });
        
        // Refresh user data to get the latest from the database
        await refreshUserData();
        
        // Clear preview since the upload was successful
        setPreviewImage(null);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to upload profile picture",
          variant: "destructive",
        });
        setPreviewImage(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while uploading",
        variant: "destructive",
      });
      setPreviewImage(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }

    const result = await updateProfile(user.id, {
      full_name: formData.name,
      age: Number(formData.age),
      location: formData.location,
      bio: formData.bio,
      budget_low: budgetRange[0],
      budget_high: budgetRange[1],
      department: formData.department,
      level: formData.level,
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
      
      await refreshUserData();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handlePreferenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to update preferences",
        variant: "destructive",
      });
      return;
    }

    const formattedPreferences = preferences.map(pref => ({
      preference_type: getPreferenceType(pref),
      preference_value: pref,
    }));

    const result = await updatePreferences(user.id, formattedPreferences);

    if (result.success) {
      toast({
        title: "Success",
        description: "Preferences updated successfully",
      });
      setIsEditingPreferences(false);
      
      await refreshUserData();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update preferences",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleAddPreference = () => {
    if (newPreference.trim() && !preferences.includes(newPreference.trim())) {
      setPreferences([...preferences, newPreference.trim()]);
      setNewPreference('');
    }
  };

  const handleRemovePreference = (pref: string) => {
    setPreferences(preferences.filter(p => p !== pref));
  };

  const getPreferenceType = (pref: string) => {
    const lifestylePrefs = ['Non-smoker', 'Smoker', 'Pet-friendly', 'No pets'];
    const habitPrefs = ['Early riser', 'Night owl', 'Work from home'];
    const personalityPrefs = ['Clean', 'Quiet', 'Respectful', 'Social'];

    if (lifestylePrefs.includes(pref)) return 'lifestyle';
    if (habitPrefs.includes(pref)) return 'habit';
    if (personalityPrefs.includes(pref)) return 'personality';
    return 'other';
  };

  const currentProfileImage = previewImage || user?.profile_url || fallbackAvatar;

  return (
    <div className="container max-w-md mx-auto px-4 py-6 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <div className="relative">
              <Avatar className="h-20 w-20 mr-4">
                <AvatarImage src={currentProfileImage} alt={user?.full_name} />
                <AvatarFallback>{user?.full_name?.[0] || 'A'}</AvatarFallback>
              </Avatar>
              
              {/* Upload overlay */}
              <Button
                size="sm"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-8 w-8 p-0 rounded-full shadow-lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold">{user?.full_name || ''}, {user?.age || ''}</h1>
              <p className="text-muted-foreground">{user?.department || ''}</p>
              <p className="text-muted-foreground">{user?.level || 'No'} Level</p>
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
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Profile Picture Upload Section */}
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={currentProfileImage} alt={user?.full_name} />
                      <AvatarFallback>{user?.full_name?.[0] || 'A'}</AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="flex items-center gap-2"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Change Picture
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload a JPG, PNG, or GIF. Max file size: 5MB
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input 
                    id="age" 
                    type="number" 
                    value={formData.age} 
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Input 
                    id="level" 
                    type="number" 
                    value={formData.level} 
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    value={formData.location} 
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    value={formData.bio} 
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Budget Range: ₦{budgetRange[0]} - ₦{budgetRange[1]}</Label>
                  <Slider
                    min={50000}
                    max={200000}
                    step={10000}
                    value={budgetRange}
                    onValueChange={setBudgetRange}
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="mb-4">{user?.bio || 'No bio added yet'}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {preferences.map((pref, index) => (
                  <Badge key={index} variant="secondary">{pref}</Badge>
                ))}
              </div>
              <div className="flex flex-col space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="ml-2">₦{budgetRange[0]} - ₦{budgetRange[1]}</span>
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
                <CardDescription>Roommates you've saved</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Saved Roommates
                  </div>
                  <p>Coming soon</p>
                  {/* <Badge variant="secondary">{user?.savedRoommates || 2}</Badge> */}
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
                {isEditingPreferences ? (
                  <form onSubmit={handlePreferenceSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPreference">Add New Preference</Label>
                      <div className="flex gap-2">
                        <Input
                          id="newPreference"
                          value={newPreference}
                          onChange={(e) => setNewPreference(e.target.value)}
                          placeholder="Enter new preference"
                        />
                        <Button type="button" onClick={handleAddPreference}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {preferences.map((pref, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {pref}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => handleRemovePreference(pref)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditingPreferences(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Save Preferences</Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {preferences.map((pref, index) => (
                        <Badge key={index} variant="secondary">{pref}</Badge>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setIsEditingPreferences(true)}
                    >
                      Edit Preferences
                    </Button>
                  </>
                )}
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
                <Button onClick={signOut} variant="outline" className="w-full justify-start text-destructive">
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