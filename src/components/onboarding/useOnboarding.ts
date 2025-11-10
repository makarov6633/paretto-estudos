"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  currentStep: number;
  selectedCategories: string[];
  preferredReadingTime: string;
  setCompleted: (completed: boolean) => void;
  setStep: (step: number) => void;
  setCategories: (categories: string[]) => void;
  setReadingTime: (time: string) => void;
  reset: () => void;
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      currentStep: 0,
      selectedCategories: [],
      preferredReadingTime: 'medium',
      setCompleted: (completed) => set({ hasCompletedOnboarding: completed }),
      setStep: (step) => set({ currentStep: step }),
      setCategories: (categories) => set({ selectedCategories: categories }),
      setReadingTime: (time) => set({ preferredReadingTime: time }),
      reset: () => set({
        hasCompletedOnboarding: false,
        currentStep: 0,
        selectedCategories: [],
        preferredReadingTime: 'medium',
      }),
    }),
    {
      name: 'paretto-onboarding',
    }
  )
);
