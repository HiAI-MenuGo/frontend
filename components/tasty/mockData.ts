export interface DishItem {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  isPopular?: boolean;
  isSoldOut?: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface LiveOrderCard {
  id: string;
  orderNumber: string;
  tableNumber: string;
  itemCount: number;
  timeAgo: string;
  status: 'IN_KITCHEN' | 'WAIT_LIST' | 'READY';
  statusLabel: string;
}

export interface TableItem {
  id: string;
  tableNumber: number;
  tableName: string;
  capacity: number;
  chairs: number;
  status: 'AVAILABLE' | 'ON_DINE' | 'RESERVED';
  currentCustomer?: string;
  area: 'MAIN_DINING' | 'TERRACE' | 'OUTDOOR';
  occupiedSince?: string;
}

export interface ReservationItem {
  id: string;
  time: string;
  customerName: string;
  tableNumber: number;
  guestsCount: number;
  phone: string;
  status: 'PAYMENT' | 'ON_DINE' | 'UNPAID' | 'FREE';
  statusLabel: string;
  period: 'Dinner' | 'Lunch' | 'Breakfast';
}

export const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'all', name: 'All Dishes', icon: '🍲', count: 154 },
  { id: 'breakfast', name: 'Breakfast', icon: '🍳', count: 12 },
  { id: 'beef', name: 'Beef Dishes', icon: '🥩', count: 5 },
  { id: 'biryani', name: 'Biryani', icon: '🍛', count: 8 },
  { id: 'chicken', name: 'Chicken Dishes', icon: '🍗', count: 10 },
  { id: 'desserts', name: 'Desserts', icon: '🍰', count: 19 },
  { id: 'dinner', name: 'Dinner', icon: '🍽️', count: 8 },
  { id: 'drinks', name: 'Drinks', icon: '🍹', count: 15 },
  { id: 'fast_foods', name: 'Fast Foods', icon: '🌭', count: 25 },
  { id: 'lunch', name: 'Lunch', icon: '🍱', count: 20 },
  { id: 'platters', name: 'Platters', icon: '🥘', count: 14 },
  { id: 'salads', name: 'Salads', icon: '🥗', count: 8 },
  { id: 'side_dishes', name: 'Side Dishes', icon: '🍟', count: 4 },
  { id: 'soups', name: 'Soups', icon: '🥣', count: 3 },
];

export const INITIAL_DISHES: DishItem[] = [
  // Special / Lunch / Dinner Dishes (Screenshot 1)
  {
    id: 'd_1',
    name: 'Grilled Salmon Steak',
    category: 'Lunch',
    price: 15.00,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=350&auto=format&fit=crop&q=80',
    isPopular: true,
  },
  {
    id: 'd_2',
    name: 'Tofu Poke Bowl',
    category: 'Salad',
    price: 7.00,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'd_3',
    name: 'Pasta with Roast Beef',
    category: 'Pasta',
    price: 10.00,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d62817ee?w=350&auto=format&fit=crop&q=80',
    isPopular: true,
  },
  {
    id: 'd_4',
    name: 'Beef Steak',
    category: 'Beef',
    price: 30.00,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=350&auto=format&fit=crop&q=80',
    isPopular: true,
  },
  {
    id: 'd_5',
    name: 'Shrimp Rice Bowl',
    category: 'Rice',
    price: 6.00,
    imageUrl: 'https://images.unsplash.com/photo-1553240799-36bbf332a5c3?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'd_6',
    name: 'Apple Stuffed Pancake',
    category: 'Desserts',
    price: 35.00,
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'd_7',
    name: 'Chicken Quinoa & Herbs',
    category: 'Chicken',
    price: 12.00,
    imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'd_8',
    name: 'Vegetable Shrimp',
    category: 'Salad',
    price: 10.00,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'd_9',
    name: 'Avocado Green Salad',
    category: 'Salad',
    price: 8.50,
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'd_10',
    name: 'Spicy Tom Yum Soup',
    category: 'Soups',
    price: 11.00,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'd_11',
    name: 'Crispy Chicken Wings',
    category: 'Chicken',
    price: 9.50,
    imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'd_12',
    name: 'Seafood Bibimbap',
    category: 'Rice',
    price: 13.00,
    imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=350&auto=format&fit=crop&q=80',
  },

  // Desserts Catalog (Screenshot 3)
  {
    id: 'des_1',
    name: 'Cheese Syrniki Pancakes',
    category: 'Desserts',
    price: 8.00,
    imageUrl: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'des_2',
    name: 'Apple Stuffed Pancake',
    category: 'Desserts',
    price: 10.00,
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'des_3',
    name: 'Terracotta Bowl',
    category: 'Desserts',
    price: 12.00,
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'des_4',
    name: 'Croissant Dessert',
    category: 'Desserts',
    price: 15.00,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'des_5',
    name: 'Granola Banana & Berry',
    category: 'Desserts',
    price: 10.00,
    imageUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'des_6',
    name: 'Vanilla Cherry Cupcake',
    category: 'Desserts',
    price: 8.00,
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'des_7',
    name: 'Belgian Waffles',
    category: 'Desserts',
    price: 20.00,
    imageUrl: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'des_8',
    name: 'Granola with Yoghurt',
    category: 'Desserts',
    price: 15.00,
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'des_9',
    name: 'Muesli Bowl',
    category: 'Desserts',
    price: 10.00,
    imageUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'des_10',
    name: 'Waffles with Ice-cream',
    category: 'Desserts',
    price: 10.00,
    imageUrl: 'https://images.unsplash.com/photo-1504113888839-1c8eb50233d3?w=350&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_LIVE_ORDERS: LiveOrderCard[] = [
  {
    id: 'ord_1',
    orderNumber: '#FO027',
    tableNumber: 'Table 03',
    itemCount: 8,
    timeAgo: '2 mins ago',
    status: 'IN_KITCHEN',
    statusLabel: 'In Kitchen',
  },
  {
    id: 'ord_2',
    orderNumber: '#FO028',
    tableNumber: 'Table 07',
    itemCount: 3,
    timeAgo: 'Just Now',
    status: 'WAIT_LIST',
    statusLabel: 'Wait List',
  },
  {
    id: 'ord_3',
    orderNumber: '#FO019',
    tableNumber: 'Table 09',
    itemCount: 2,
    timeAgo: '25 mins ago',
    status: 'READY',
    statusLabel: 'Ready',
  },
  {
    id: 'ord_4',
    orderNumber: '#FO030',
    tableNumber: 'Table 04',
    itemCount: 5,
    timeAgo: '6 mins ago',
    status: 'IN_KITCHEN',
    statusLabel: 'In Kitchen',
  },
];

export const INITIAL_TABLES: TableItem[] = [
  { id: 't_1', tableNumber: 1, tableName: 'Table #1', capacity: 6, chairs: 6, status: 'AVAILABLE', area: 'MAIN_DINING' },
  { id: 't_2', tableNumber: 2, tableName: 'Table #2', capacity: 2, chairs: 2, status: 'ON_DINE', currentCustomer: 'Bashir ibn Sa\'ad', area: 'MAIN_DINING' },
  { id: 't_3', tableNumber: 3, tableName: 'Table #3', capacity: 2, chairs: 2, status: 'RESERVED', currentCustomer: 'Ali', area: 'MAIN_DINING' },
  { id: 't_4', tableNumber: 4, tableName: 'Table #4', capacity: 3, chairs: 3, status: 'ON_DINE', currentCustomer: 'Khunais ibn Hudhafa', area: 'MAIN_DINING' },
  { id: 't_5', tableNumber: 5, tableName: 'Table #5', capacity: 2, chairs: 0, status: 'AVAILABLE', area: 'MAIN_DINING' },
  { id: 't_6', tableNumber: 6, tableName: 'Table #6', capacity: 7, chairs: 7, status: 'AVAILABLE', area: 'MAIN_DINING' },
  { id: 't_7', tableNumber: 7, tableName: 'Table #7', capacity: 10, chairs: 10, status: 'AVAILABLE', area: 'MAIN_DINING' },
  { id: 't_8', tableNumber: 8, tableName: 'Table #8', capacity: 2, chairs: 2, status: 'ON_DINE', currentCustomer: 'Shuja ibn Wahb', area: 'MAIN_DINING' },
  { id: 't_9', tableNumber: 9, tableName: 'Table #9', capacity: 4, chairs: 4, status: 'ON_DINE', currentCustomer: 'Hamza', area: 'MAIN_DINING' },
  { id: 't_10', tableNumber: 10, tableName: 'Table #10', capacity: 2, chairs: 2, status: 'ON_DINE', currentCustomer: 'Mus\'ab ibn Umayr', area: 'MAIN_DINING' },
  { id: 't_11', tableNumber: 11, tableName: 'Table #11', capacity: 2, chairs: 2, status: 'RESERVED', currentCustomer: 'Uthman ibn Hunaif', area: 'MAIN_DINING' },
  { id: 't_12', tableNumber: 12, tableName: 'Table #12', capacity: 8, chairs: 8, status: 'AVAILABLE', area: 'MAIN_DINING' },
];

export const INITIAL_RESERVATIONS: ReservationItem[] = [
  {
    id: 'res_1',
    time: '7:30 PM',
    customerName: 'Uthman ibn Hunaif',
    tableNumber: 1,
    guestsCount: 6,
    phone: '+84 678 890 000',
    status: 'PAYMENT',
    statusLabel: 'Payment',
    period: 'Dinner',
  },
  {
    id: 'res_2',
    time: 'On Dine',
    customerName: 'Bashir ibn Sa\'ad',
    tableNumber: 2,
    guestsCount: 2,
    phone: '+84 912 345 678',
    status: 'ON_DINE',
    statusLabel: 'On Dine',
    period: 'Dinner',
  },
  {
    id: 'res_3',
    time: '8:00 PM',
    customerName: 'Ali',
    tableNumber: 3,
    guestsCount: 2,
    phone: '+84 342 556 555',
    status: 'PAYMENT',
    statusLabel: 'Payment',
    period: 'Dinner',
  },
  {
    id: 'res_4',
    time: 'On Dine',
    customerName: 'Khunais ibn Hudhafa',
    tableNumber: 4,
    guestsCount: 3,
    phone: '+84 987 654 321',
    status: 'ON_DINE',
    statusLabel: 'On Dine',
    period: 'Dinner',
  },
  {
    id: 'res_5',
    time: 'Free',
    customerName: 'Available Now',
    tableNumber: 5,
    guestsCount: 0,
    phone: '—',
    status: 'FREE',
    statusLabel: 'Available',
    period: 'Dinner',
  },
  {
    id: 'res_6',
    time: '8:25 PM',
    customerName: 'Mus\'ab ibn Umayr',
    tableNumber: 6,
    guestsCount: 7,
    phone: '+84 800 563 554',
    status: 'UNPAID',
    statusLabel: 'Unpaid',
    period: 'Dinner',
  },
  {
    id: 'res_7',
    time: '9:00 PM',
    customerName: 'Shuja ibn Wahb',
    tableNumber: 7,
    guestsCount: 10,
    phone: '+84 909 112 233',
    status: 'PAYMENT',
    statusLabel: 'Payment',
    period: 'Dinner',
  },
];

// Convenience aliases for flexible imports
export const initialDishes = INITIAL_DISHES;
export const initialTables = INITIAL_TABLES;
export const liveOrderQueue = INITIAL_LIVE_ORDERS;
export const initialCategories = INITIAL_CATEGORIES;
export const initialReservations = INITIAL_RESERVATIONS;
