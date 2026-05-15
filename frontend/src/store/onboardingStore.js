import { create } from 'zustand';

const ONBOARDING_KEY = 'tradewise_onboarding_completed';

export const useOnboardingStore = create((set, get) => ({
  isTourActive: false,
  isWelcomeOpen: false,
  currentStep: 0,
  hasCompletedLocal: localStorage.getItem(ONBOARDING_KEY) === 'true',

  setWelcomeOpen: (open) => set({ isWelcomeOpen: open }),

  startTour: () => {
    console.log('[Onboarding] Starting tour');
    set({ isTourActive: true, currentStep: 0 });
  },
  
  stopTour: () => {
    console.log('[Onboarding] Stopping tour');
    set({ isTourActive: false });
    localStorage.setItem(ONBOARDING_KEY, 'true');
    set({ hasCompletedLocal: true });
  },

  setStep: (step) => {
    console.log(`[Onboarding] Moving to step ${step}`);
    set({ currentStep: step });
  },

  replayTour: () => {
    console.log('[Onboarding] Replaying tour (manual trigger)');
    localStorage.removeItem(ONBOARDING_KEY);
    set({ hasCompletedLocal: false, isTourActive: true, currentStep: 0 });
  },

  resetOnboarding: () => {
    console.log('[Onboarding] Resetting all state for testing');
    localStorage.removeItem(ONBOARDING_KEY);
    set({ hasCompletedLocal: false, isTourActive: false, currentStep: 0 });
  }
}));
