export interface Tiffin {
    _id: string;
    name: string;
    shortDescription?: string;
    pricePerMeal?: number;
    rating?: number;
    imageUrl?: string;
    vegOnly?: boolean;
    coverageAreas?: string[];
    mealPlans?: string[];
    scheduleDays?: string[];
    priceRange?: string | number;
    kitchenName?: string;
    images?: string[];
    address?: string;
    category?: string[];
    deliveryCity?: string[];
    deliveryTimeSlots?: string[];
    freeDelivery?: string | boolean;
    menu?: {
        plans?: Array<{ label?: string; _id?: string }>;
        mealTypes?: Array<{
            mealTypeId?: string;
            label?: string;
            description?: string;
            prices?: Record<string, number>;
            specificPlans?: string[];
            _id?: string;
        }>;
        instructions?: Array<{ title?: string; details?: string; _id?: string }>;
        serviceDays?: string[];
        isFlexibleDates?: boolean;
        _id?: string;
    };
    operatingTimes?: Record<string, { open?: string; close?: string }>;
}

export interface TiffinDetail extends Tiffin {
    description?: string;
    menu?: string[];
    contact?: string;
    contactPhone?: string;
    contactEmail?: string;
    location?: {
        lat: number;
        lng: number;
        address?: string;
    };
}
