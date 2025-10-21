import React from 'react';
import { Heart } from 'lucide-react';

interface PropertyCardProps {
  imageUrl: string;
  title: string;
  price: number;
  rating: number;
  numberOfNights: number;
  isGuestFavorite?: boolean;
  isFavorited?: boolean;
  onFavoriteClick?: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  imageUrl,
  title,
  price,
  rating,
  numberOfNights,
  isGuestFavorite = false,
  isFavorited = false,
  onFavoriteClick
}) => {
  return (
    <div className="relative flex flex-col w-[300px] rounded-xl overflow-hidden">
      {/* Image with favorite button overlay */}
      <div className="relative aspect-[4/3] w-full">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover rounded-xl"
        />
        {isGuestFavorite && (
          <div className="absolute top-3 left-3 bg-white px-3 py-1 rounded-full text-sm font-medium">
            Guest favorite
          </div>
        )}
        <button 
          onClick={onFavoriteClick}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-black/10 transition-colors"
        >
          <Heart 
            className={`w-6 h-6 ${isFavorited ? 'fill-white stroke-white' : 'stroke-white'}`} 
          />
        </button>
      </div>

      {/* Property details */}
      <div className="flex flex-col mt-3 gap-1">
        <h3 className="font-medium text-base">{title}</h3>
        <div className="flex items-center gap-1">
          <span className="text-sm">★ {rating.toFixed(2)}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-semibold">${price}</span>
          <span className="text-sm text-gray-600">for {numberOfNights} nights</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;