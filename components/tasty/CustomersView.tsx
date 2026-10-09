'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  Award,
  DollarSign,
  Star,
  ChevronRight,
  MoreVertical,
  X,
  UserCheck,
  Crown,
} from 'lucide-react';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze';
  totalSpend: number;
  ordersCount: number;
  points: number;
  lastVisit: string;
  notes?: string;
}

const initialCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Uthman ibn Hunaif',
    phone: '+84 678 890 000',
    email: 'uthman.hunaif@gmail.com',
    tier: 'Diamond',
    totalSpend: 1240.5,
    ordersCount: 38,
    points: 1240,
    lastVisit: 'Today, 7:30 PM',
    notes: 'Prefers quiet corner table #01. Allergic to peanuts.',
  },
  {
    id: 'CUST-002',
    name: "Bashir ibn Sa'ad",
    phone: '+84 912 345 678',
    email: 'bashir.saad@outlook.com',
    tier: 'Gold',
    totalSpend: 780.0,
    ordersCount: 21,
    points: 780,
    lastVisit: 'Today, 8:00 PM',
    notes: 'Regular diner for business lunches.',
  },
  {
    id: 'CUST-003',
    name: 'Ali Raza',
    phone: '+84 342 556 555',
    email: 'ali.raza@techcorp.vn',
    tier: 'Gold',
    totalSpend: 620.0,
    ordersCount: 17,
    points: 620,
    lastVisit: 'Yesterday, 8:00 PM',
    notes: 'Loves Pasta with Roast Beef.',
  },
  {
    id: 'CUST-004',
    name: 'Khunais ibn Hudhafa',
    phone: '+84 905 112 233',
    email: 'khunais.h@gmail.com',
    tier: 'Silver',
    totalSpend: 340.0,
    ordersCount: 9,
    points: 340,
    lastVisit: 'Today, 8:15 PM',
  },
  {
    id: 'CUST-005',
    name: "Mus'ab ibn Umayr",
    phone: '+84 800 563 554',
    email: 'musab.umayr@yahoo.com',
    tier: 'Silver',
    totalSpend: 295.0,
    ordersCount: 8,
    points: 295,
    lastVisit: '10 Jan 2024, 8:25 PM',
  },
  {
    id: 'CUST-006',
    name: 'Shuja ibn Wahb',
    phone: '+84 779 881 202',
    email: 'shuja.wahb@domain.com',
    tier: 'Bronze',
    totalSpend: 110.0,
    ordersCount: 3,
    points: 110,
    lastVisit: '09 Jan 2024, 9:00 PM',
  },
  {
    id: 'CUST-007',
    name: 'Sarah Nguyen',
    phone: '+84 938 123 456',
    email: 'sarah.nguyen@email.com',
    tier: 'Diamond',
    totalSpend: 1560.0,
    ordersCount: 42,
    points: 1560,
    lastVisit: '08 Jan 2024',
    notes: 'VIP customer, frequent weekend host.',
  },
  {
    id: 'CUST-008',
    name: 'Michael Tran',
    phone: '+84 909 876 543',
    email: 'michael.tran@fnb.vn',
    tier: 'Gold',
    totalSpend: 890.0,
    ordersCount: 24,
    points: 890,
    lastVisit: '07 Jan 2024',
  },
];

export default function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Customer Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    tier: 'Bronze' as Customer['tier'],
    notes: '',
  });

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = selectedTier === 'All' || c.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    const newCust: Customer = {
      id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || 'guest@example.com',
      tier: formData.tier,
      totalSpend: 0,
      ordersCount: 0,
      points: 50, // Welcome points
      lastVisit: 'Just registered',
      notes: formData.notes.trim(),
    };

    setCustomers([newCust, ...customers]);
    setFormData({ name: '', phone: '', email: '', tier: 'Bronze', notes: '' });
    setShowAddModal(false);
  };

  const tierColors: Record<Customer['tier'], { badge: string; icon: string }> = {
    Diamond: {
      badge: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
      icon: 'text-indigo-500',
    },
    Gold: {
      badge: 'bg-amber-50 text-amber-600 border border-amber-200',
      icon: 'text-amber-500',
    },
    Silver: {
      badge: 'bg-slate-100 text-slate-700 border border-slate-200',
      icon: 'text-slate-400',
    },
    Bronze: {
      badge: 'bg-orange-50 text-orange-700 border border-orange-200',
      icon: 'text-orange-500',
    },
  };

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Customer Directory</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage diner loyalty, order history, and VIP privileges ({customers.length} total members)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#00A389] hover:bg-[#008f77] text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-200 flex items-center gap-2 self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tier filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {['All', 'Diamond', 'Gold', 'Silver', 'Bronze'].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                selectedTier === tier
                  ? 'bg-[#00A389] text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tier === 'All' ? 'All Customers' : `${tier} Tier`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00A389] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Customer Table / List */}
      <div className="flex-1 bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Contact</th>
                <th className="py-3.5 px-6">Tier Level</th>
                <th className="py-3.5 px-6 text-right">Orders</th>
                <th className="py-3.5 px-6 text-right">Total Spend</th>
                <th className="py-3.5 px-6 text-right">Loyalty Points</th>
                <th className="py-3.5 px-6">Last Visit</th>
                <th className="py-3.5 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No customers found matching &quot;{searchQuery}&quot;.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                          {c.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 group-hover:text-[#00A389] transition-colors">
                            {c.name}
                          </div>
                          <div className="text-[11px] text-slate-400">{c.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-700 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{c.email}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${tierColors[c.tier].badge}`}
                      >
                        <Crown className={`w-3 h-3 ${tierColors[c.tier].icon}`} />
                        <span>{c.tier}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right font-medium text-slate-700">
                      {c.ordersCount}
                    </td>

                    <td className="py-4 px-6 text-right font-bold text-[#00A389]">
                      ${c.totalSpend.toFixed(2)}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                        {c.points} pts
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{c.lastVisit}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(c);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white font-bold text-lg flex items-center justify-center shadow-md">
                {selectedCustomer.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedCustomer.name}</h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${tierColors[selectedCustomer.tier].badge}`}
                >
                  <Crown className="w-3 h-3" />
                  <span>{selectedCustomer.tier} Member</span>
                </span>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl text-xs mb-5 border border-slate-100">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400">Phone Number:</span>
                <span className="font-semibold text-slate-700">{selectedCustomer.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400">Email Address:</span>
                <span className="font-semibold text-slate-700">{selectedCustomer.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400">Lifetime Orders:</span>
                <span className="font-semibold text-slate-700">
                  {selectedCustomer.ordersCount} visits
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400">Total Spend:</span>
                <span className="font-bold text-[#00A389]">
                  ${selectedCustomer.totalSpend.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Reward Balance:</span>
                <span className="font-bold text-amber-600">{selectedCustomer.points} Points</span>
              </div>
            </div>

            {selectedCustomer.notes && (
              <div className="mb-5">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Customer Preferences
                </div>
                <div className="text-xs text-slate-600 bg-amber-50/60 border border-amber-200/60 p-3 rounded-xl">
                  {selectedCustomer.notes}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedCustomer(null)}
              className="w-full py-2.5 bg-[#00A389] hover:bg-[#008f77] text-white font-semibold rounded-xl text-xs transition-colors"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-800 mb-1">Register New Customer</h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a new guest to track orders, preferences, and loyalty rewards
            </p>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Uthman ibn Hunaif"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A389] focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+84 9xx xxx xxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A389] focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="customer@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A389] focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Tier</label>
                <select
                  value={formData.tier}
                  onChange={(e) =>
                    setFormData({ ...formData, tier: e.target.value as Customer['tier'] })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A389] focus:bg-white text-slate-800"
                >
                  <option value="Bronze">Bronze (Standard Guest)</option>
                  <option value="Silver">Silver (Frequent Guest)</option>
                  <option value="Gold">Gold (VIP Regular)</option>
                  <option value="Diamond">Diamond (VVIP)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notes & Dietary Preferences
                </label>
                <textarea
                  rows={2}
                  placeholder="Allergies, table preferences, VIP notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00A389] focus:bg-white text-slate-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#00A389] hover:bg-[#008f77] text-white font-semibold shadow-sm transition-colors"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
