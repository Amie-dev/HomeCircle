import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabase';

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
