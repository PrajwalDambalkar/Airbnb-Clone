export interface Property {
    id: number;
    owner_id: number;
    property_name: string;
    property_type: string;
    description: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
    bedrooms: number;
    bathrooms: string;
    max_guests: number;
    price_per_night: string;
    cleaning_fee: string;
    service_fee: string;
    amenities: string[];
    images: string[];
    available: number;
    rating?: number;
    created_at: string;
    updated_at: string;
}