import { create } from 'zustand';
import { User } from '@calories/shared';

interface UserProfileState {
  profile: User | null;
  isOnboarded: boolean;
  setProfile: (profile: User) => void;
  setOnboarded: (isOnboarded: boolean) => void;
  clear: () => void;
}

export const useUserProfileStore = create<UserProfileState>((set) => ({
  profile: null,
  isOnboarded: false,

  setProfile: (profile) => set({
    profile,
    isOnboarded: profile.onboarding_completed,
  }),

  setOnboarded: (isOnboarded) => set({ isOnboarded }),

  clear: () => set({ profile: null, isOnboarded: false }),
}));
