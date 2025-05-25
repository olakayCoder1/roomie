
// "use server";

// import { createServerClient } from "@/lib/supabase/server";

// // New action to upload profile picture
// export async function uploadProfilePicture(userId: string, file: File) {
//   try {
//     const supabase = createServerClient();

//     // Generate unique filename
//     const fileExt = file.name.split('.').pop();
//     const fileName = `${userId}_${Date.now()}.${fileExt}`;
//     const filePath = `profile-pictures/${fileName}`;

//     // Convert File to ArrayBuffer
//     const arrayBuffer = await file.arrayBuffer();
//     const uint8Array = new Uint8Array(arrayBuffer);

//     // Upload file to Supabase Storage
//     const { data: uploadData, error: uploadError } = await supabase.storage
//       .from('profile-pictures') // Make sure this bucket exists in your Supabase storage
//       .upload(filePath, uint8Array, {
//         contentType: file.type,
//         upsert: true, // Replace if file already exists
//       });

//     if (uploadError) {
//       console.error('Upload error:', uploadError);
//       return { error: 'Failed to upload image' };
//     }

//     // Get public URL
//     const { data: urlData } = supabase.storage
//       .from('profile-pictures')
//       .getPublicUrl(filePath);

//     if (!urlData?.publicUrl) {
//       return { error: 'Failed to get image URL' };
//     }

//     return { 
//       success: true, 
//       profileUrl: urlData.publicUrl,
//       filePath: filePath 
//     };

//   } catch (error) {
//     console.error('Upload profile picture error:', error);
//     return { error: 'An unexpected error occurred during upload' };
//   }
// }

// // Action to delete old profile picture (optional - call this before uploading new one)
// export async function deleteProfilePicture(filePath: string) {
//   try {
//     const supabase = createServerClient();

//     const { error } = await supabase.storage
//       .from('profile-pictures')
//       .remove([filePath]);

//     if (error) {
//       console.error('Delete error:', error);
//       return { error: 'Failed to delete old image' };
//     }

//     return { success: true };
//   } catch (error) {
//     console.error('Delete profile picture error:', error);
//     return { error: 'An unexpected error occurred during deletion' };
//   }
// }

// // New action to update preferences
// export async function updatePreferences(userId: string, preferences: { preference_type: string, preference_value: string }[]) {
//   try {
//     const supabase = createServerClient();

//     // Delete existing preferences
//     const { error: deleteError } = await supabase
//       .from('roommate_preferences')
//       .delete()
//       .eq('user_id', userId);

//     if (deleteError) {
//       console.error('Delete preferences error:', deleteError);
//       return { error: 'Failed to update preferences' };
//     }

//     // Insert new preferences
//     if (preferences.length > 0) {
//       const { error: insertError } = await supabase
//         .from('roommate_preferences')
//         .insert(preferences.map(pref => ({
//           user_id: userId,
//           preference_type: pref.preference_type,
//           preference_value: pref.preference_value,
//         })));

//       if (insertError) {
//         console.error('Insert preferences error:', insertError);
//         return { error: 'Failed to update preferences' };
//       }
//     }

//     return { success: true };
//   } catch (error) {
//     console.error('Update preferences error:', error);
//     return { error: 'An unexpected error occurred' };
//   }
// }

// // Updated profile action to handle profile picture deletion
// export async function updateProfile(userId: string, profileData: {
//   full_name?: string;
//   age?: number;
//   location?: string;
//   bio?: string;
//   budget_low?: number;
//   budget_high?: number;
//   profile_url?: string;
//   department?: string;
//   level?: string;
// }, oldProfilePath?: string) {
//   try {
//     const supabase = createServerClient();

//     // If updating profile picture and there's an old one, delete it first
//     if (profileData.profile_url && oldProfilePath) {
//       await deleteProfilePicture(oldProfilePath);
//     }

//     const { data: data, error: userError } = await supabase
//       .from('users')
//       .update({
//         full_name: profileData.full_name,
//         age: profileData.age,
//         location: profileData.location,
//         bio: profileData.bio,
//         budget_low: profileData.budget_low,
//         budget_high: profileData.budget_high,
//         profile_url: profileData.profile_url,
//         department: profileData.department,
//         level: profileData.level,
//         updated_at: new Date().toISOString(),
//       })
//       .eq('id', userId);

//     console.log(data);
    
//     if (userError) {
//       console.error('Profile update error:', userError);
//       return { error: 'Failed to update profile' };
//     }

//     return { success: true };
//   } catch (error) {
//     console.error('Profile update error:', error);
//     return { error: 'An unexpected error occurred' };
//   }
// }

// // // Helper function to extract file path from Supabase URL
// // export  async function extractFilePathFromUrl(url: string): string | null {
// //   try {
// //     const urlParts = url.split('/');
// //     const bucketIndex = urlParts.findIndex(part => part === 'profile-pictures');
// //     if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
// //       return `profile-pictures/${urlParts[bucketIndex + 1]}`;
// //     }
// //     return null;
// //   } catch (error) {
// //     console.error('Error extracting file path:', error);
// //     return null;
// //   }
// // }



"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

// New action to upload profile picture using FormData
export async function uploadProfilePicture(userId: string, formData: FormData) {
  try {
    const supabase = createAdminClient();

    const file = formData.get('file') as File;
    if (!file) {
      return { error: 'No file provided' };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures') // Make sure this bucket exists in your Supabase storage
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: true, // Replace if file already exists
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { error: 'Failed to upload image' };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return { error: 'Failed to get image URL' };
    }

    return { 
      success: true, 
      profileUrl: urlData.publicUrl,
      filePath: filePath 
    };

  } catch (error) {
    console.error('Upload profile picture error:', error);
    return { error: 'An unexpected error occurred during upload' };
  }
}

// Action to delete old profile picture (optional - call this before uploading new one)
export async function deleteProfilePicture(filePath: string) {
  try {
    const supabase = createServerClient();

    const { error } = await supabase.storage
      .from('profile-pictures')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return { error: 'Failed to delete old image' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete profile picture error:', error);
    return { error: 'An unexpected error occurred during deletion' };
  }
}

// New action to update preferences
export async function updatePreferences(userId: string, preferences: { preference_type: string, preference_value: string }[]) {
  try {
    const supabase = createServerClient();

    // Delete existing preferences
    const { error: deleteError } = await supabase
      .from('roommate_preferences')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Delete preferences error:', deleteError);
      return { error: 'Failed to update preferences' };
    }

    // Insert new preferences
    if (preferences.length > 0) {
      const { error: insertError } = await supabase
        .from('roommate_preferences')
        .insert(preferences.map(pref => ({
          user_id: userId,
          preference_type: pref.preference_type,
          preference_value: pref.preference_value,
        })));

      if (insertError) {
        console.error('Insert preferences error:', insertError);
        return { error: 'Failed to update preferences' };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Update preferences error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Updated profile action to handle profile picture deletion
export async function updateProfile(userId: string, profileData: {
  full_name?: string;
  age?: number;
  location?: string;
  bio?: string;
  budget_low?: number;
  budget_high?: number;
  profile_url?: string;
  department?: string;
  level?: string;
}, oldProfilePath?: string) {
  try {
    const supabase = createServerClient();

    // If updating profile picture and there's an old one, delete it first
    if (profileData.profile_url && oldProfilePath) {
      await deleteProfilePicture(oldProfilePath);
    }

    const { data: data, error: userError } = await supabase
      .from('users')
      .update({
        full_name: profileData.full_name,
        age: profileData.age,
        location: profileData.location,
        bio: profileData.bio,
        budget_low: profileData.budget_low,
        budget_high: profileData.budget_high,
        profile_url: profileData.profile_url,
        department: profileData.department,
        level: profileData.level,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    console.log(data);
    
    if (userError) {
      console.error('Profile update error:', userError);
      return { error: 'Failed to update profile' };
    }

    return { success: true };
  } catch (error) {
    console.error('Profile update error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// // Helper function to extract file path from Supabase URL
// export function extractFilePathFromUrl(url: string): string | null {
//   try {
//     const urlParts = url.split('/');
//     const bucketIndex = urlParts.findIndex(part => part === 'profile-pictures');
//     if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
//       return `profile-pictures/${urlParts[bucketIndex + 1]}`;
//     }
//     return null;
//   } catch (error) {
//     console.error('Error extracting file path:', error);
//     return null;
//   }
// }