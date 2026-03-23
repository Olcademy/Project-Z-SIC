export interface EventLocation {
    lat?: number;
    lng?: number;
    address?: string;
}

export interface Event {
    _id: string;
    name?: string;
    title?: string;
    description?: string;
    date?: string;
    category?: string;
    venue?: string | {
        id?: string;
        name?: string;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        lat?: number;
        lng?: number;
    };
    priceInfo?: string;
    price?: number | string;
    images?: string[];
    imageUrl?: string;
    location?: EventLocation;
    id?: string;
    startAt?: string;
    endAt?: string;
}
