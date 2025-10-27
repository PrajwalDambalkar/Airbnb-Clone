import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { propertyService } from '../services/propertyService';
import { useDarkMode } from '../App';
import { useAuth } from '../context/AuthContext';
import type { Property } from '../types/property';
import { getFirstImage } from '../utils/imageUtils';

export default function Favorites() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useDarkMode();
  const { user } = useAuth();

  useEffect(() => {
    const fetchFavs = async () => {
      if (!user) {
        setProperties([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Check for user-specific favorites
        let userFavs = localStorage.getItem(`favorites_${user.id}`);
        
        // If user doesn't have favorites yet, migrate from old global key (one-time migration)
        if (!userFavs) {
          const oldFavs = localStorage.getItem('favorites');
          if (oldFavs) {
            // Migrate old favorites to user-specific key
            localStorage.setItem(`favorites_${user.id}`, oldFavs);
            userFavs = oldFavs;
          }
        }
        
        // Remove old global favorites key after migration
        localStorage.removeItem('favorites');
        
        const favArr: number[] = userFavs ? JSON.parse(userFavs) : [];
        const res = await propertyService.getAllProperties();
        const all = res.data || [];
        const filtered = all.filter((p: Property) => favArr.includes(p.id));
        setProperties(filtered);
      } catch (e) {
        console.error('Error loading favorites', e);
      } finally {
        setLoading(false);
      }
    };

    fetchFavs();

    const handler = () => fetchFavs();
    window.addEventListener('storage', handler);
    window.addEventListener('favoritesUpdated', handler as EventListener);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('favoritesUpdated', handler as EventListener);
    };
  }, [user]);

  if (loading) return <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-white'} p-12`}>Loading favorites...</div>;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-white'} p-8`}> 
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <span className="inline-flex items-center gap-3"> 
            <Heart className="text-[#FF385C]" />
            Your Favourites
          </span>
        </h1>

        {properties.length === 0 ? (
          <div className={`p-8 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>You haven't added any favourites yet.</p>
            <Link to="/" className="mt-4 inline-block text-[#FF385C] underline">Browse properties</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Link key={property.id} to={`/property/${property.id}`} className="group">
                <div className="rounded-xl overflow-hidden shadow hover:shadow-lg transition">
                  <img src={getFirstImage(property.images)} alt={property.property_name} className="w-full h-56 object-cover" />
                  <div className={`p-4 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
                    <h3 className="font-bold text-lg">{property.property_name}</h3>
                    <div className="text-sm text-gray-500">{property.city}, {property.state}</div>
                    <div className="mt-2 font-semibold">${property.price_per_night} / night</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
