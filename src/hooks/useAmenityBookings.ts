import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabase';

export interface Amenity {
  id: string;
  society_id: string;
  name: string;
  description?: string;
  opening_time: string;
  closing_time: string;
  max_capacity: number;
  booking_enabled: boolean;
  created_at: string;
}

export interface AmenityBooking {
  id: string;
  user_id: string;
  society_id: string;
  amenity_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'Confirmed' | 'Cancelled';
  created_at: string;
}

// 1. Fetch all bookings for a specific resident user
export function useAmenityBookings(userId: string | undefined) {
  return useQuery<AmenityBooking[]>({
    queryKey: ['amenityBookings', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('amenity_bookings')
        .select('*')
        .eq('user_id', userId)
        .order('booking_date', { ascending: true });

      if (error) {
        throw new Error(error.message || 'Failed to fetch bookings');
      }

      return data as AmenityBooking[];
    },
    enabled: !!userId,
  });
}

// 2. Create booking mutation
export function useCreateBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bookingData: Omit<AmenityBooking, 'id' | 'created_at' | 'status'>) => {
      const { data, error } = await supabase
        .from('amenity_bookings')
        .insert({
          ...bookingData,
          status: 'Confirmed'
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to create booking');
      }

      return data as AmenityBooking;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['amenityBookings', data.user_id] });
    },
  });
}

// 3. Fetch all amenities for a society
export function useAmenities(societyId: string | undefined) {
  return useQuery<Amenity[]>({
    queryKey: ['amenities', societyId],
    queryFn: async () => {
      if (!societyId) return [];

      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .eq('society_id', societyId);

      if (error) {
        throw new Error(error.message || 'Failed to fetch amenities');
      }

      return data as Amenity[];
    },
    enabled: !!societyId,
  });
}
