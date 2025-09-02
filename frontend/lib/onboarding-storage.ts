/**
 * Utility functions for managing onboarding data in localStorage
 */

export interface OnboardingData {
    // Personal Information
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    age: string;
    occupation: string;
    industry: string;
    companySize: string;

    // Financial Information
    incomeRange: string;
    spendingRange: string;
    spendingCategories: string[];
    shoppingFrequency: string;

    // Shopping Preferences
    preferredPlatforms: string[];
    creditScore: string;
    investmentLevel: string;

    // Goals
    primaryGoal: string;
    secondaryGoals: string[];
}

export interface OnboardingRecord {
    id: string;
    userId: string;
    email: string;
    onboardingData: OnboardingData;
    selectedCreditCards: string[];
    timestamp: string;
    created_at: string;
}

export interface UserPreferences {
    userId: string;
    email: string;
    preferences: {
        preferredCreditCard: string | null;
        spendingCategories: string[];
        preferredPlatforms: string[];
        primaryGoal: string;
        secondaryGoals: string[];
        incomeRange: string;
        spendingRange: string;
    };
    lastUpdated: string;
}

/**
 * Save onboarding data to localStorage
 */
export const saveOnboardingData = (
    userId: string,
    onboardingData: OnboardingData,
    selectedCreditCards: string[]
): OnboardingRecord => {
    const onboardingRecord: OnboardingRecord = {
        id: crypto.randomUUID(),
        userId,
        email: onboardingData.email,
        onboardingData,
        selectedCreditCards,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
    };

    // Save to user-specific key
    const key = `onboarding_${userId}`;
    localStorage.setItem(key, JSON.stringify(onboardingRecord));

    // Save to general list
    const existingOnboardings = JSON.parse(localStorage.getItem('all_onboardings') || '[]');
    existingOnboardings.push(onboardingRecord);
    localStorage.setItem('all_onboardings', JSON.stringify(existingOnboardings));

    return onboardingRecord;
};

/**
 * Save user preferences to localStorage
 */
export const saveUserPreferences = (
    userId: string,
    email: string,
    onboardingData: OnboardingData,
    selectedCreditCards: string[]
): UserPreferences => {
    const userPreferences: UserPreferences = {
        userId,
        email,
        preferences: {
            preferredCreditCard: selectedCreditCards[0] || null,
            spendingCategories: onboardingData.spendingCategories,
            preferredPlatforms: onboardingData.preferredPlatforms,
            primaryGoal: onboardingData.primaryGoal,
            secondaryGoals: onboardingData.secondaryGoals,
            incomeRange: onboardingData.incomeRange,
            spendingRange: onboardingData.spendingRange
        },
        lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(`user_preferences_${userId}`, JSON.stringify(userPreferences));
    return userPreferences;
};

/**
 * Get onboarding data for a specific user
 */
export const getOnboardingData = (userId: string): OnboardingRecord | null => {
    try {
        const key = `onboarding_${userId}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error retrieving onboarding data:', error);
        return null;
    }
};

/**
 * Get user preferences for a specific user
 */
export const getUserPreferences = (userId: string): UserPreferences | null => {
    try {
        const key = `user_preferences_${userId}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error retrieving user preferences:', error);
        return null;
    }
};

/**
 * Check if user has completed onboarding
 */
export const hasCompletedOnboarding = (userId: string): boolean => {
    const onboardingData = getOnboardingData(userId);
    return onboardingData !== null;
};

/**
 * Get all onboarding records
 */
export const getAllOnboardings = (): OnboardingRecord[] => {
    try {
        const data = localStorage.getItem('all_onboardings');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error retrieving all onboardings:', error);
        return [];
    }
};

/**
 * Clear onboarding data for a specific user
 */
export const clearOnboardingData = (userId: string): void => {
    try {
        const key = `onboarding_${userId}`;
        localStorage.removeItem(key);

        // Remove from general list
        const allOnboardings = getAllOnboardings();
        const filteredOnboardings = allOnboardings.filter(record => record.userId !== userId);
        localStorage.setItem('all_onboardings', JSON.stringify(filteredOnboardings));

        // Clear user preferences
        localStorage.removeItem(`user_preferences_${userId}`);
    } catch (error) {
        console.error('Error clearing onboarding data:', error);
    }
};

/**
 * Update onboarding data for a specific user
 */
export const updateOnboardingData = (
    userId: string,
    updates: Partial<OnboardingData>
): OnboardingRecord | null => {
    try {
        const existingData = getOnboardingData(userId);
        if (!existingData) return null;

        const updatedRecord: OnboardingRecord = {
            ...existingData,
            onboardingData: {
                ...existingData.onboardingData,
                ...updates
            },
            timestamp: new Date().toISOString()
        };

        // Update in localStorage
        const key = `onboarding_${userId}`;
        localStorage.setItem(key, JSON.stringify(updatedRecord));

        // Update in general list
        const allOnboardings = getAllOnboardings();
        const updatedOnboardings = allOnboardings.map(record =>
            record.userId === userId ? updatedRecord : record
        );
        localStorage.setItem('all_onboardings', JSON.stringify(updatedOnboardings));

        return updatedRecord;
    } catch (error) {
        console.error('Error updating onboarding data:', error);
        return null;
    }
};
