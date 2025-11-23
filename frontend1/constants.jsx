import { LayoutDashboard, Users, BedDouble, CalendarCheck, IndianRupee } from 'lucide-react';

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/students', label: 'Students', icon: Users },
  { path: '/rooms', label: 'Rooms', icon: BedDouble },
  { path: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { path: '/payments', label: 'Payments', icon: IndianRupee },
];