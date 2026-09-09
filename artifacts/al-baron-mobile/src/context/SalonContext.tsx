import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { barberCategory, trackEvent } from '@/lib/analytics';
import { usePhoneAuth } from '@/context/AuthContext';
import {
  type Appointment,
  type SalonState,
  type ScheduleSlot,
  type Service,
  type Ticket,
  getGetSalonStateQueryKey,
  useGetSalonState,
} from '@workspace/api-client-react';
import { sessionJson, sessionRequest } from '@/lib/session-api';

type LocalProfile = {
  name: string;
  phone: string;
  note: string;
};

export type AgeCategory = {
  id: string;
  name: string;
  minAge: number;
  maxAge: number | null;
  active: boolean;
  sortOrder: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  active: boolean;
};

export type ShopInfo = {
  shopName: string;
  phone: string;
  whatsapp: string;
  address: string;
  mapsUrl: string;
  instagramUrl: string;
  openingHours: string;
};

type ExtendedSalonState = SalonState & {
  ageCategories?: AgeCategory[];
  products?: Product[];
  shopInfo?: ShopInfo;
};

type SalonContextValue = {
  profile: LocalProfile;
  tickets: Ticket[];
  appointments: Appointment[];
  allAppointments: Appointment[];
  schedule: ScheduleSlot[];
  services: Service[];
  ageCategories: AgeCategory[];
  products: Product[];
  shopInfo: ShopInfo;
  shopOpen: boolean;
  selectedStyle: string | null;
  lastReminderAt: string | null;
  isLoading: boolean;
  isOffline: boolean;
  setProfile: (profile: LocalProfile) => void;
  setSelectedStyle: (style: string | null) => void;
  joinQueue: (service: string, barber: string, ageCategory?: string) => Promise<void>;
  bookAppointment: (details: { date: string; time: string; barber: string; service: string; ageCategory?: string; guestCount?: number }) => Promise<void>;
  advanceQueue: () => Promise<void>;
  cancelTicket: (id?: string, source?: 'account' | 'admin') => void;
  addWalkIn: (name: string) => void;
  saveService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  toggleShop: () => Promise<void>;
  summon: (id?: string, source?: 'account' | 'admin') => void;
  addScheduleSlot: (slot: { dayOfWeek: number; time: string; active: boolean }) => Promise<void>;
  updateScheduleSlot: (id: string, slot: { dayOfWeek: number; time: string; active: boolean }) => Promise<void>;
  toggleScheduleSlot: (slot: ScheduleSlot) => Promise<void>;
  cancelAppointment: (id: string, reason: string, onSuccess?: (whatsappUrl: string) => void) => void;
  saveAgeCategory: (category: AgeCategory) => Promise<void>;
  deleteAgeCategory: (id: string) => Promise<void>;
  saveProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  saveShopInfo: (info: ShopInfo) => Promise<void>;
  activeTicket: Ticket | undefined;
  waitingTickets: Ticket[];
};

const STORAGE_KEY = 'al-baron-profile-v2';
const DEFAULT_PROFILE: LocalProfile = { name: 'أحمد', phone: '0527752778', note: 'درجة التنعيم المفضلة: 1.5' };
const DEFAULT_SHOP_INFO: ShopInfo = { shopName: 'صالون البارون', phone: '', whatsapp: '', address: '', mapsUrl: '', instagramUrl: '', openingHours: '' };

const SalonContext = createContext<SalonContextValue | null>(null);

export function SalonProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = usePhoneAuth();
  const stateQuery = useGetSalonState({ query: { queryKey: getGetSalonStateQueryKey(), refetchInterval: 3000, refetchOnWindowFocus: true, staleTime: 1500 } });
  
  const [profile, setProfileState] = useState<LocalProfile>(DEFAULT_PROFILE);
  const [selectedStyle, setSelectedStyleState] = useState<string | null>(null);
  const [lastReminderAt, setLastReminderAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<LocalProfile>;
        setProfileState({ ...DEFAULT_PROFILE, ...parsed });
      }
    } catch {
      setProfileState(DEFAULT_PROFILE);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setProfileState({ name: user.name, phone: user.phone, note: user.note });
    }
  }, [user]);

  const refreshState = () => queryClient.invalidateQueries({ queryKey: getGetSalonStateQueryKey() });
  
  const saveProfile = (next: LocalProfile) => {
    setProfileState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {}
    void sessionJson('/api/auth/phone/profile', 'POST', { name: next.name, note: next.note })
      .then(() => {
        trackEvent('profile_saved', {
          has_note: Boolean(next.note.trim()),
          has_phone: Boolean(next.phone.trim()),
        });
      })
      .catch(() => undefined);
  };
  
  const setSelectedStyle = (style: string | null) => setSelectedStyleState(style);
  
  const joinQueue = async (service: string, barber: string, ageCategory = 'بالغون'): Promise<void> => {
    const selectedService = services.find((item) => item.name === service);
    const createdTicket = await sessionJson<Ticket>('/api/tickets', 'POST', { barber, service, ageCategory });
    queryClient.setQueryData<SalonState>(getGetSalonStateQueryKey(), (current) => current ? {
      ...current,
      waitingTickets: [...current.waitingTickets, createdTicket].sort((a, b) => a.number - b.number),
    } : current);
    trackEvent('queue_joined', {
      service_duration_minutes: selectedService?.duration ?? 0,
      barber_choice: barberCategory(barber),
      has_style_reference: Boolean(selectedStyle),
    });
    await refreshState();
  };
  
  const bookAppointment = async (details: { date: string; time: string; barber: string; service: string; ageCategory?: string; guestCount?: number }): Promise<void> => {
    const selectedService = services.find((item) => item.name === details.service);
    const createdAppointment = await sessionJson<Appointment>('/api/appointments', 'POST', details);
    queryClient.setQueryData<SalonState>(getGetSalonStateQueryKey(), (current) => current ? {
      ...current,
      appointments: [createdAppointment, ...current.appointments],
    } : current);
    trackEvent('appointment_booked', {
      service_duration_minutes: (selectedService?.duration ?? 0) + Math.max(0, (details.guestCount ?? 1) - 1) * 20,
      barber_choice: barberCategory(details.barber),
      booking_horizon: details.date === 'اليوم' ? 'today' : 'future',
      has_style_reference: Boolean(selectedStyle),
    });
    await refreshState();
  };
  
  const advanceQueue = async (): Promise<void> => {
    await sessionJson<Ticket>('/api/queue/advance', 'POST', {});
    trackEvent('queue_advanced', {
      had_current_ticket: Boolean(stateQuery.data?.currentTicket),
      waiting_count: waitingTickets.length,
    });
    await refreshState();
  };
  
  const cancelTicket = (id?: string, source: 'account' | 'admin' = 'account') => {
    const target = id ?? activeTicket?.id;
    if (!target) return;
    void sessionRequest<Ticket>(`/api/tickets/${target}/cancel`, { method: 'POST' })
      .then(() => {
        trackEvent('ticket_cancelled', { surface: source });
        return refreshState();
      });
  };
  
  const addWalkIn = (name: string) => {
    void sessionJson<Ticket>('/api/walk-ins', 'POST', { name })
      .then(() => {
        trackEvent('walk_in_added', { surface: 'admin' });
        return refreshState();
      });
  };
  
  const saveService = async (service: Service): Promise<void> => {
    const data = { name: service.name, description: service.description, price: service.price, duration: service.duration, visible: service.visible };
    const isExisting = services.some((item) => item.id === service.id);
    const savedService = isExisting
      ? await sessionJson<Service>(`/api/services/${service.id}`, 'PATCH', data)
      : await sessionJson<Service>('/api/services', 'POST', data);
    queryClient.setQueryData<SalonState>(getGetSalonStateQueryKey(), (current) => {
      if (!current) return current;
      const exists = current.services.some((item) => item.id === savedService.id);
      return { ...current, services: exists ? current.services.map((item) => item.id === savedService.id ? savedService : item) : [...current.services, savedService] };
    });
    trackEvent('service_saved', {
      operation: isExisting ? 'updated' : 'created',
      service_duration_minutes: service.duration,
      has_description: Boolean(service.description.trim()),
      visible: service.visible,
    });
    await refreshState();
  };
  
  const deleteService = async (id: string): Promise<void> => {
    await sessionRequest<void>(`/api/services/${id}`, { method: 'DELETE' });
    queryClient.setQueryData<SalonState>(getGetSalonStateQueryKey(), (current) => current ? { ...current, services: current.services.filter((service) => service.id !== id) } : current);
    trackEvent('service_hidden', { surface: 'admin' });
    await refreshState();
  };
  
  const toggleShop = async (): Promise<void> => {
    const shopOpen = !(stateQuery.data?.settings.shopOpen ?? true);
    const result = await sessionJson<{ shopOpen: boolean }>('/api/settings', 'PATCH', { shopOpen });
    queryClient.setQueryData<SalonState>(getGetSalonStateQueryKey(), (current) => current ? {
      ...current,
      settings: { ...current.settings, shopOpen: result.shopOpen },
    } : current);
    trackEvent('shop_status_changed', { shop_open: shopOpen });
    await refreshState();
  };
  
  const summon = (id?: string, source: 'account' | 'admin' = 'account') => {
    const target = id ?? activeTicket?.id;
    if (!target) return;
    void sessionRequest<{ whatsappUrl: string }>(`/api/tickets/${target}/summon`, { method: 'POST' })
      .then(() => {
        setLastReminderAt(new Date().toISOString());
        trackEvent('ticket_summoned', { surface: source, channel: 'whatsapp' });
        return refreshState();
      });
  };

  const addScheduleSlot = async (slot: { dayOfWeek: number; time: string; active: boolean }): Promise<void> => {
    const createdSlot = await sessionJson<ScheduleSlot>('/api/schedule-slots', 'POST', slot);
    queryClient.setQueryData<SalonState>(getGetSalonStateQueryKey(), (current) => current ? { ...current, schedule: [...current.schedule, createdSlot] } : current);
    await refreshState();
  };

  const updateScheduleSlot = async (id: string, slot: { dayOfWeek: number; time: string; active: boolean }): Promise<void> => {
    const updatedSlot = await sessionJson<ScheduleSlot>(`/api/schedule-slots/${id}`, 'PATCH', slot);
    queryClient.setQueryData<SalonState>(getGetSalonStateQueryKey(), (current) => current ? { ...current, schedule: current.schedule.map((item) => item.id === updatedSlot.id ? updatedSlot : item) } : current);
    await refreshState();
  };

  const toggleScheduleSlot = async (slot: ScheduleSlot): Promise<void> => {
    await updateScheduleSlot(slot.id, { dayOfWeek: slot.dayOfWeek, time: slot.time, active: !slot.active });
  };

  const cancelAppointment = (id: string, reason: string, onSuccess?: (whatsappUrl: string) => void) => {
    void sessionJson<{ appointment: Appointment; whatsappUrl: string }>(`/api/appointments/${id}/cancel`, 'POST', { reason })
      .then((result) => {
        queryClient.setQueryData<SalonState>(getGetSalonStateQueryKey(), (current) => current ? {
          ...current,
          appointments: current.appointments.map((appointment) => appointment.id === result.appointment.id ? result.appointment : appointment),
        } : current);
        refreshState();
        onSuccess?.(result.whatsappUrl);
      });
  };

  const saveAgeCategory = async (category: AgeCategory): Promise<void> => {
    const payload = { name: category.name, minAge: category.minAge, maxAge: category.maxAge, active: category.active, sortOrder: category.sortOrder };
    const currentCategories = (stateQuery.data as ExtendedSalonState | undefined)?.ageCategories ?? [];
    const saved = currentCategories.some((item) => item.id === category.id)
      ? await sessionJson<AgeCategory>(`/api/age-categories/${category.id}`, 'PATCH', payload)
      : await sessionJson<AgeCategory>('/api/age-categories', 'POST', payload);
    queryClient.setQueryData<ExtendedSalonState>(getGetSalonStateQueryKey(), (current) => current ? {
      ...current,
      ageCategories: current.ageCategories?.some((item) => item.id === saved.id)
        ? current.ageCategories.map((item) => item.id === saved.id ? saved : item)
        : [...(current.ageCategories ?? []), saved],
    } : current);
    await refreshState();
  };

  const deleteAgeCategory = async (id: string): Promise<void> => {
    await sessionRequest<void>(`/api/age-categories/${id}`, { method: 'DELETE' });
    queryClient.setQueryData<ExtendedSalonState>(getGetSalonStateQueryKey(), (current) => current ? { ...current, ageCategories: (current.ageCategories ?? []).filter((item) => item.id !== id) } : current);
    await refreshState();
  };

  const saveProduct = async (product: Product): Promise<void> => {
    const payload = { name: product.name, description: product.description, price: product.price, stock: product.stock, active: product.active };
    const currentProducts = (stateQuery.data as ExtendedSalonState | undefined)?.products ?? [];
    const saved = currentProducts.some((item) => item.id === product.id)
      ? await sessionJson<Product>(`/api/products/${product.id}`, 'PATCH', payload)
      : await sessionJson<Product>('/api/products', 'POST', payload);
    queryClient.setQueryData<ExtendedSalonState>(getGetSalonStateQueryKey(), (current) => current ? {
      ...current,
      products: current.products?.some((item) => item.id === saved.id)
        ? current.products.map((item) => item.id === saved.id ? saved : item)
        : [...(current.products ?? []), saved],
    } : current);
    await refreshState();
  };

  const deleteProduct = async (id: string): Promise<void> => {
    await sessionRequest<void>(`/api/products/${id}`, { method: 'DELETE' });
    queryClient.setQueryData<ExtendedSalonState>(getGetSalonStateQueryKey(), (current) => current ? { ...current, products: (current.products ?? []).filter((item) => item.id !== id) } : current);
    await refreshState();
  };

  const saveShopInfo = async (info: ShopInfo): Promise<void> => {
    const saved = await sessionJson<ShopInfo>('/api/shop-info', 'PATCH', info);
    queryClient.setQueryData<ExtendedSalonState>(getGetSalonStateQueryKey(), (current) => current ? { ...current, shopInfo: saved } : current);
    await refreshState();
  };

  const tickets = [
    ...(stateQuery.data?.currentTicket ? [stateQuery.data.currentTicket] : []),
    ...(stateQuery.data?.waitingTickets ?? []),
  ];
  const waitingTickets = stateQuery.data?.waitingTickets ?? [];
  const activeTicket = tickets.find((ticket) => ticket.phone === profile.phone && (ticket.status === 'waiting' || ticket.status === 'serving'));
  const allServices = stateQuery.data?.services ?? [];
  const customerServiceIds = new Set(['customer-hair', 'customer-beard', 'customer-hair-beard']);
  const services = user?.role === 'admin'
    ? allServices
    : allServices.filter((service) => service.visible && customerServiceIds.has(service.id));
  const extendedState = stateQuery.data as ExtendedSalonState | undefined;
  const ageCategories = user?.role === 'admin'
    ? (extendedState?.ageCategories ?? [])
    : (extendedState?.ageCategories ?? []).filter((category) => category.active);
  const products = user?.role === 'admin'
    ? (extendedState?.products ?? [])
    : (extendedState?.products ?? []).filter((product) => product.active && product.stock > 0);
  const shopInfo = extendedState?.shopInfo ?? DEFAULT_SHOP_INFO;
  const appointments = stateQuery.data?.appointments?.filter((appointment) => appointment.phone === profile.phone) ?? [];
  const allAppointments = stateQuery.data?.appointments ?? [];
  const schedule = stateQuery.data?.schedule ?? [];
  
  const value = useMemo(() => ({
    profile,
    tickets,
    appointments,
    allAppointments,
    schedule,
    services,
    ageCategories,
    products,
    shopInfo,
    shopOpen: stateQuery.data?.settings.shopOpen ?? true,
    selectedStyle,
    lastReminderAt,
    isLoading: stateQuery.isLoading,
    isOffline: Boolean(stateQuery.error),
    setProfile: saveProfile,
    setSelectedStyle,
    joinQueue,
    bookAppointment,
    advanceQueue,
    cancelTicket,
    addWalkIn,
    saveService,
    deleteService,
    toggleShop,
    summon,
    addScheduleSlot,
    updateScheduleSlot,
    toggleScheduleSlot,
    cancelAppointment,
    saveAgeCategory,
    deleteAgeCategory,
    saveProduct,
    deleteProduct,
    saveShopInfo,
    activeTicket,
    waitingTickets,
  }), [profile, tickets, appointments, allAppointments, schedule, services, ageCategories, products, shopInfo, stateQuery.data, stateQuery.isLoading, stateQuery.error, selectedStyle, lastReminderAt, activeTicket, waitingTickets]);

  return <SalonContext.Provider value={value}>{children}</SalonContext.Provider>;
}

export function useSalon() {
  const context = useContext(SalonContext);
  if (!context) throw new Error('useSalon must be used inside SalonProvider');
  return context;
}
