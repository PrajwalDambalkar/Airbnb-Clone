import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { propertyService } from '../services/propertyService';
import type { Property } from '../types/property';

export default function Home() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        city: '',
        guests: ''
    });

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async (searchFilters = {}) => {
        try {
            setLoading(true);
            const response = await propertyService.getAllProperties(searchFilters);
            setProperties(response.data || []);
        } catch (error) {
            console.error('Error fetching properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const searchFilters: any = {};
        if (filters.city) searchFilters.city = filters.city;
        if (filters.guests) searchFilters.guests = parseInt(filters.guests);
        fetchProperties(searchFilters);
    };

    const handleReset = () => {
        setFilters({ city: '', guests: '' });
        fetchProperties();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section with Search */}
            <div className="py-20 text-white bg-gradient-to-r from-pink-500 to-red-500">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <h1 className="mb-4 text-5xl font-bold text-center">
                        Find your next adventure
                    </h1>
                    <p className="mb-8 text-xl text-center opacity-90">
                        Discover amazing places to stay around the world
                    </p>
                    
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex flex-wrap items-center max-w-4xl gap-3 p-3 mx-auto bg-white rounded-full shadow-2xl">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Where are you going?"
                                value={filters.city}
                                onChange={(e) => setFilters({...filters, city: e.target.value})}
                                className="w-full px-6 py-3 text-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                        </div>
                        
                        <div className="flex-1 min-w-[150px]">
                            <input
                                type="number"
                                placeholder="Number of guests"
                                min="1"
                                value={filters.guests}
                                onChange={(e) => setFilters({...filters, guests: e.target.value})}
                                className="w-full px-6 py-3 text-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                        </div>
                        
                        <button
                            type="submit"
                            className="px-8 py-3 font-semibold text-white transition-all transform bg-pink-600 rounded-full hover:bg-pink-700 hover:scale-105"
                        >
                            🔍 Search
                        </button>

                        {(filters.city || filters.guests) && (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-6 py-3 font-semibold text-white transition-all bg-gray-600 rounded-full hover:bg-gray-700"
                            >
                                Reset
                            </button>
                        )}
                    </form>
                </div>
            </div>

            {/* Properties Grid */}
            <div className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="inline-block w-16 h-16 border-t-4 border-b-4 border-pink-500 rounded-full animate-spin"></div>
                        <p className="mt-4 text-lg text-gray-600">Loading amazing properties...</p>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="mb-4 text-3xl text-gray-500">😔 No properties found</p>
                        <p className="mb-6 text-gray-400">Try adjusting your search filters</p>
                        <button
                            onClick={handleReset}
                            className="px-6 py-3 font-semibold text-white bg-pink-500 rounded-full hover:bg-pink-600"
                        >
                            View All Properties
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-bold text-gray-800">
                                {filters.city ? `Properties in ${filters.city}` : 'All Properties'}
                            </h2>
                            <p className="text-gray-600">
                                {properties.length} {properties.length === 1 ? 'property' : 'properties'} available
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {properties.map((property) => (
                                <Link
                                    key={property.id}
                                    to={`/property/${property.id}`}
                                    className="group"
                                >
                                    <div className="overflow-hidden transition-all duration-300 transform bg-white shadow-lg rounded-2xl hover:shadow-2xl hover:-translate-y-2">
                                        {/* Property Image */}
                                        <div className="relative h-64 overflow-hidden bg-gray-200">
                                            <img
                                                src={property.images[0] || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'}
                                                alt={property.property_name}
                                                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                                                onError={(e) => {
                                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800';
                                                }}
                                            />
                                            <div className="absolute px-3 py-1 text-sm font-semibold text-gray-800 capitalize bg-white rounded-full top-4 right-4">
                                                {property.property_type}
                                            </div>
                                        </div>

                                        {/* Property Details */}
                                        <div className="p-5">
                                            <h3 className="mb-2 text-xl font-bold text-gray-800 transition-colors line-clamp-1 group-hover:text-pink-600">
                                                {property.property_name}
                                            </h3>
                                            <p className="mb-4 text-sm text-gray-500">
                                                📍 {property.city}, {property.state}
                                            </p>
                                            
                                            <div className="flex items-center gap-4 pb-4 mb-4 text-sm text-gray-600 border-b">
                                                <span>🛏️ {property.bedrooms} beds</span>
                                                <span>🚿 {property.bathrooms} baths</span>
                                                <span>👥 {property.max_guests} guests</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-2xl font-bold text-gray-800">
                                                        ${property.price_per_night}
                                                    </span>
                                                    <span className="text-sm text-gray-500"> / night</span>
                                                </div>
                                                <span className="font-semibold text-pink-500 group-hover:underline">
                                                    View Details →
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}