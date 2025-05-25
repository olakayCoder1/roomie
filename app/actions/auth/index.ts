
"use server";

import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import * as bcrypt from "bcryptjs";

export async function loginUser(email: string, password: string) {
  try {


    const supabase = createServerClient();

    const { data: user, error } = await supabase
      .from('users')
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      console.error("Login error:", error);
      return { error: "Invalid credentials" };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return { error: "Invalid credentials" };
    }

    // Set cookie with user ID
    const cookieStore = await cookies();
    cookieStore.set(`${user.id}_id`, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/"
    });

    return { 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username,
        full_name: user.full_name, 
        email: user.email 
      } 
    };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function registerUser(email: string, password: string, full_name: string) {
  try {
    const supabaseAdmin = createAdminClient();
    const supabase = createServerClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return { error: "User already exists with this email" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 1: Create user with admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error("Auth error:", authError);
      return { error: "Unable to create account" };
    }

    const userId = authData.user.id;

    // Step 2: Insert into users table
    const { error: dbError } = await supabase.from("users").insert({
      id: userId,
      full_name,
      email,
      password_hash: hashedPassword,
    });

    if (dbError) {
      console.error("DB error:", dbError);
      // Clean up auth user if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { error: "Unable to save user profile" };
    }

    // Set cookie for new user
    const cookieStore = await cookies();
    cookieStore.set(`${userId}_id`, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/"
    });

    return { 
      success: true, 
      user: { 
        id: userId, 
        full_name, 
        email 
      } 
    };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function checkAuth() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient();
    
    const userCookie = cookieStore.getAll().find(cookie => cookie.name.endsWith('_id'));
    
    if (!userCookie) {
      return { error: "No session found" };
    }

    const userId = userCookie.value;

    // Fetch user data with preferences
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        full_name,
        email,
        bio,
        age,
        location,
        budget_low,
        budget_high,
        profile_url,
        department,
        level,
        roommate_preferences (
          preference_type,
          preference_value
        )
      `)
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("Error verifying user:", userError?.message);
      return { error: "Not authenticated" };
    }

    return { 
      success: true, 
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        bio: user.bio,
        age: user.age,
        location: user.location,
        budget_low: user.budget_low,
        budget_high: user.budget_high,
        profile_url: user.profile_url,
        department: user.department,
        level: user.level,
        lifestylePreferences: user.roommate_preferences.map((pref: any) => pref.preference_value),
      }
    };
  } catch (error) {
    console.error("Check auth error:", error);
    return { error: "Authentication check failed" };
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    
    // Get all cookies and remove user session cookies
    const allCookies = cookieStore.getAll();
    const userCookies = allCookies.filter(cookie => cookie.name.endsWith('_id'));
    
    for (const cookie of userCookies) {
      cookieStore.delete(cookie.name);
    }

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { error: "Logout failed" };
  }
}



// Sample preferences - pick some random or fixed
const samplePreferences = [
  { preference_type: "lifestyle", preference_value: "Non-smoker" },
  { preference_type: "habit", preference_value: "Early riser" },
  { preference_type: "personality", preference_value: "Clean" },
  { preference_type: "personality", preference_value: "Quiet" },
  { preference_type: "personality", preference_value: "Respectful" },
];

// Helper function to pick random from array
function getRandom(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate random integer in range
function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function registerMultipleUsersWithDetails() {
  const supabase = createServerClient();

  const sampleUsers = [
    { email: "user1@example.com", password: "Password1!", full_name: "Alice Johnson" },
    { email: "user2@example.com", password: "Password2!", full_name: "Bob Smith" },
    { email: "user3@example.com", password: "Password3!", full_name: "Carol Lee" },
    { email: "user4@example.com", password: "Password4!", full_name: "David Kim" },
    { email: "user5@example.com", password: "Password5!", full_name: "Eva Brown" },
    { email: "user6@example.com", password: "Password6!", full_name: "Frank Green" },
    { email: "user7@example.com", password: "Password7!", full_name: "Grace White" },
    { email: "user8@example.com", password: "Password8!", full_name: "Henry Black" },
    { email: "user9@example.com", password: "Password9!", full_name: "Isla Martinez" },
    { email: "user10@example.com", password: "Password10!", full_name: "Jack Wilson" },
  ];

  const results = [];

  for (const user of sampleUsers) {
    // Extra profile fields
    const profile = {
      age: getRandomInt(18, 35),
      bio: `Hi, I am ${user.full_name.split(" ")[0]}, looking for a roommate.`,
      department: getRandom(["Engineering", "Marketing", "HR", "Design"]),
      level: getRandom(["Junior", "Mid", "Senior"]),
      profile_url: `https://example.com/profiles/${user.email.split("@")[0]}`,
      budget_low: getRandomInt(200, 500),
      budget_high: getRandomInt(600, 1000),
      location: getRandom(["Ilorin, Kwara", "Lagos, Lagos", "Abuja, FCT"]),
      organization: getRandom(["NYSC Corps Member", "Student", "Professional"]),
    };

    // Register user with profile
    const regResult = await registerUser(user.email, user.password, user.full_name);

    if (!regResult.success) {
      results.push({ email: user.email, error: regResult.error });
      continue;
    }

    const userId = regResult.user.id;

    // Insert roommate preferences (pick 2 random preferences)
    const userPrefs = [];
    while (userPrefs.length < 2) {
      const pref = getRandom(samplePreferences);
      if (!userPrefs.find(p => p.preference_value === pref.preference_value)) {
        userPrefs.push(pref);
      }
    }

    const prefsInsert = userPrefs.map(p => ({
      user_id: userId,
      preference_type: p.preference_type,
      preference_value: p.preference_value,
    }));

    const { error: prefsError } = await supabase.from('roommate_preferences').insert(prefsInsert);

    if (prefsError) {
      console.error(`Failed to insert preferences for ${user.email}:`, prefsError);
    }

    // Insert user settings (default values + some variation)
    const settings = {
      user_id: userId,
      privacy_settings: { profile_visible: true, show_email: false },
      notification_enabled: true,
      email_notifications: Math.random() < 0.8, // 80% chance true
      push_notifications: Math.random() < 0.5, // 50% chance true
    };

    const { error: settingsError } = await supabase.from('user_settings').insert(settings);

    if (settingsError) {
      console.error(`Failed to insert settings for ${user.email}:`, settingsError);
    }

    results.push({ email: user.email, success: true });
  }

  return results;
}
