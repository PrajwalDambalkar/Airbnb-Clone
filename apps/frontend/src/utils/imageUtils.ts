// Utility function to get full image URL
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return 'https://via.placeholder.com/400x300?text=No+Image';
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's from /images/ folder, it's served by frontend (Vite public folder)
  // These are the seed data images
  if (imagePath.startsWith('/images/')) {
    return imagePath; // Vite will serve from public/images/
  }

  // If it's from /uploads/ folder, it's served by backend
  // These are user-uploaded images
  if (imagePath.startsWith('/uploads/')) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    return `${apiUrl}${imagePath}`;
  }

  // Fallback: prepend API URL for any other relative paths
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  return `${apiUrl}${imagePath}`;
};

// Get first image from array or string
export const getFirstImage = (images: string[] | string | null | undefined): string => {
  if (!images) {
    return getImageUrl(null);
  }

  if (Array.isArray(images) && images.length > 0) {
    return getImageUrl(images[0]);
  }

  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return getImageUrl(parsed[0]);
      }
    } catch {
      // If it's not JSON, treat it as a direct path
      return getImageUrl(images);
    }
  }

  return getImageUrl(null);
};
