'use client';

import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  X,
  Armchair,
  Coffee,
} from 'lucide-react';
import { TableItem, ReservationItem, INITIAL_TABLES, INITIAL_RESERVATIONS } from './mockData';
import { AddReservationModal } from './AddReservationModal';

interface ManageTableViewProps {
  tables?: TableItem[];
  reservations?: ReservationItem[];
  onUpdateTableStatus?: (tableId: string, newStatus: TableItem['status']) => void;
  onAddReservation?: (newRes: ReservationItem) => void;
}

export const ManageTableView: React.FC<ManageTableViewProps> = ({
  tables: initialTablesProp,
  reservations: initialReservationsProp,
  onUpdateTableStatus: propUpdateTableStatus,
  onAddReservation: propAddReservation,
}) => {
  const [localTables, setLocalTables] = useState<TableItem[]>(initialTablesProp || INITIAL_TABLES);
  const [localReservations, setLocalReservations] = useState<ReservationItem[]>(initialReservationsProp || INITIAL_RESERVATIONS);

  const handleUpdateTableStatus = (tableId: string, newStatus: TableItem['status']) => {
    setLocalTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t)));
    if (propUpdateTableStatus) propUpdateTableStatus(tableId, newStatus);
  };

  const handleAddReservation = (newRes: ReservationItem) => {
    setLocalReservations((prev) => [newRes, ...prev]);
    if (propAddReservation) propAddReservation(newRes);
  };

  // Area selector
  const [selectedArea, setSelectedArea] = useState<'MAIN_DINING' | 'TERRACE' | 'OUTDOOR'>('MAIN_DINING');
  const [filterTab, setFilterTab] = useState<'all' | 'reservation' | 'on_dine'>('all');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Selected table modal detail
  const [selectedTableDetail, setSelectedTableDetail] = useState<TableItem | null>(null);

  // Filter reservations
  const filteredReservations = localReservations.filter((res) => {
    if (searchCustomer && !res.customerName.toLowerCase().includes(searchCustomer.toLowerCase()) && !res.phone.includes(searchCustomer)) {
      return false;
    }
    if (filterTab === 'reservation') return res.status === 'PAYMENT' || res.status === 'UNPAID';
    if (filterTab === 'on_dine') return res.status === 'ON_DINE';
    return true;
  });

  // Render Chairs around table
  const renderChairs = (chairCount: number, status: TableItem['status']) => {
    const chairColor =
      status === 'AVAILABLE' ? '#00A389' : status === 'ON_DINE' ? '#FF7A59' : '#064E3B';

    // Chair Icon SVG
    const Chair = ({ rotation = '0deg', className = '' }: { rotation?: string; className?: string }) => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={chairColor}
        style={{ transform: `rotate(${rotation})` }}
        className={`transition-colors duration-200 ${className}`}
      >
        <path d="M4 18v3h3v-3h10v3h3v-3h1a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1V3a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v3H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h1zm3-14h10v2H7V4zm14 6v6H3v-6h18z" />
      </svg>
    );

    // Distribution
    let topChairs = 0;
    let bottomChairs = 0;
    let sideLeft = 0;
    let sideRight = 0;

    if (chairCount === 2) {
      sideLeft = 1;
      sideRight = 1;
    } else if (chairCount === 3) {
      topChairs = 1;
      sideLeft = 1;
      sideRight = 1;
    } else if (chairCount === 4) {
      topChairs = 1;
      bottomChairs = 1;
      sideLeft = 1;
      sideRight = 1;
    } else if (chairCount === 6) {
      topChairs = 2;
      bottomChairs = 2;
      sideLeft = 1;
      sideRight = 1;
    } else if (chairCount === 7) {
      topChairs = 3;
      bottomChairs = 2;
      sideLeft = 1;
      sideRight = 1;
    } else if (chairCount === 8) {
      topChairs = 3;
      bottomChairs = 3;
      sideLeft = 1;
      sideRight = 1;
    } else if (chairCount === 10) {
      topChairs = 4;
      bottomChairs = 4;
      sideLeft = 1;
      sideRight = 1;
    } else {
      topChairs = Math.ceil(chairCount / 2);
      bottomChairs = Math.floor(chairCount / 2);
    }

    return { topChairs, bottomChairs, sideLeft, sideRight, Chair };
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ================= LEFT SUB-PANEL: RESERVATION QUEUE (Screenshot 2) ================= */}
      <div className="w-[340px] shrink-0 bg-white border-r border-[#F1F5F9] flex flex-col justify-between p-6 select-none h-full overflow-y-auto">
        <div className="space-y-4">
          {/* Top Filter Pills: All 12, Reservation 07, On Dine */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All', count: '12' },
              { id: 'reservation', label: 'Reservation', count: '07' },
              { id: 'on_dine', label: 'On Dine', count: '05' },
            ].map((pill) => {
              const isSelected = filterTab === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setFilterTab(pill.id as any)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-extrabold transition-all ${
                    isSelected
                      ? 'bg-white border-2 border-[#00A389] text-[#00A389] shadow-2xs'
                      : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-[#00A389] text-white' : 'bg-[#94A3B8] text-white'
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Date Switcher: < Thu, 11 January 2024 > */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[12.5px] font-bold text-[#0F172A]">
            <button className="text-[#94A3B8] hover:text-[#0F172A]">
              <ChevronLeft size={16} />
            </button>
            <span className="flex items-center gap-2">
              <Calendar size={14} className="text-[#00A389]" />
              <span>Thu, 11 January 2024</span>
            </span>
            <button className="text-[#94A3B8] hover:text-[#0F172A]">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Search Customers Bar with Filter Icon */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                placeholder="Search customers"
                className="w-full h-10 pl-9 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[12px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#00A389]"
              />
            </div>
            <button className="w-10 h-10 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A]">
              <SlidersHorizontal size={15} />
            </button>
          </div>

          {/* Reservations List */}
          <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
            {filteredReservations.map((res) => {
              const isPayment = res.status === 'PAYMENT';
              const isOnDine = res.status === 'ON_DINE';
              const isFree = res.status === 'FREE';

              const timeBadgeBg =
                res.time === 'On Dine'
                  ? 'bg-[#FFEFE8] text-[#FF7A59]'
                  : res.time === 'Free'
                  ? 'bg-[#E6F7F4] text-[#00A389]'
                  : 'bg-[#E6F7F4] text-[#00A389]';

              return (
                <div
                  key={res.id}
                  className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all shadow-2xs flex items-center gap-3 cursor-pointer"
                  onClick={() => {
                    const matchTable = localTables.find(t => t.tableNumber === res.tableNumber);
                    if (matchTable) setSelectedTableDetail(matchTable);
                  }}
                >
                  {/* Time / State Pill on Left */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-extrabold text-[11px] shrink-0 leading-tight ${timeBadgeBg}`}
                  >
                    <span>{res.time.split(' ')[0]}</span>
                    <span>{res.time.split(' ')[1] || ''}</span>
                  </div>

                  {/* Customer Information */}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-extrabold text-[13px] text-[#0F172A] truncate">
                        {res.customerName}
                      </h4>
                      <span className="text-[10px] font-semibold text-[#94A3B8]">
                        {res.period}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11.5px] text-[#64748B]">
                      <span className="flex items-center gap-1">
                        <Armchair size={12} className="text-[#94A3B8]" />
                        <strong>{res.tableNumber}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} className="text-[#94A3B8]" />
                        <span>{res.guestsCount}</span>
                      </span>

                      {/* Payment Status Pill */}
                      <span className="ml-auto flex items-center gap-1 text-[11px] font-bold">
                        {isPayment && (
                          <>
                            <CheckCircle2 size={12} className="text-[#10B981]" />
                            <span className="text-[#10B981]">Payment</span>
                          </>
                        )}
                        {isOnDine && (
                          <>
                            <span className="w-2 h-2 rounded-full bg-[#EA580C]"></span>
                            <span className="text-[#EA580C]">On Dine</span>
                          </>
                        )}
                        {isFree && (
                          <span className="text-[#00A389]">Available</span>
                        )}
                      </span>
                    </div>

                    {res.phone !== '—' && (
                      <div className="text-[11px] text-[#94A3B8] mt-1 font-mono">
                        {res.phone}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA: + Add New Reservation */}
        <div className="pt-4 border-t border-[#F1F5F9]">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full h-12 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-black text-[13.5px] flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>Add New Reservation</span>
          </button>
        </div>
      </div>

      {/* ================= RIGHT AREA: INTERACTIVE FLOOR CANVAS (Screenshot 2) ================= */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Floor Navigation Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-[22px] font-black text-[#0F172A] tracking-tight">
              Manage Tables
            </h2>
            <p className="text-[12px] text-[#64748B]">
              Sơ đồ chỗ ngồi thời gian thực và trạng thái thực khách
            </p>
          </div>

          {/* Area Selector: Main Dining, Terrace, Outdoor */}
          <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] p-1.5 rounded-2xl shadow-2xs">
            {[
              { id: 'MAIN_DINING', label: 'Main Dining' },
              { id: 'TERRACE', label: 'Terrace' },
              { id: 'OUTDOOR', label: 'Outdoor' },
            ].map((tab) => {
              const isSelected = selectedArea === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedArea(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-[12.5px] font-extrabold transition-all ${
                    isSelected
                      ? 'bg-[#00A389] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend: Available, Reserved, On Dine */}
        <div className="flex items-center gap-6 text-[12px] font-bold text-[#64748B]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#00A389]"></span>
            <span>Available (Bàn trống)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#064E3B]"></span>
            <span>Reserved (Đã đặt trước)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF7A59]"></span>
            <span>On Dine (Đang phục vụ)</span>
          </div>
        </div>

        {/* Visual Interactive Floor Plan Grid (Screenshot 2) */}
        <div className="bg-white rounded-3xl p-8 border border-[#E2E8F0] shadow-2xs min-h-[580px] flex flex-col justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-10 items-center justify-items-center">
            {localTables.map((table) => {
              const { topChairs, bottomChairs, sideLeft, sideRight } = renderChairs(table.chairs, table.status);

              const cardBg =
                table.status === 'AVAILABLE'
                  ? 'bg-[#E6F7F4] border-[#B6EADF]'
                  : table.status === 'ON_DINE'
                  ? 'bg-[#FFEDD5] border-[#FED7AA]'
                  : 'bg-[#E2F0EC] border-[#A7D8CC]';

              const textColor =
                table.status === 'AVAILABLE'
                  ? 'text-[#00A389]'
                  : table.status === 'ON_DINE'
                  ? 'text-[#EA580C]'
                  : 'text-[#064E3B]';

              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTableDetail(table)}
                  className="flex flex-col items-center cursor-pointer group hover:scale-[1.03] transition-all duration-200 select-none"
                >
                  {/* Top Row Chairs */}
                  {topChairs > 0 && (
                    <div className="flex items-center gap-3.5 mb-1.5">
                      {Array.from({ length: topChairs }).map((_, i) => (
                        <Armchair
                          key={i}
                          size={15}
                          className={
                            table.status === 'AVAILABLE'
                              ? 'text-[#00A389]'
                              : table.status === 'ON_DINE'
                              ? 'text-[#FF7A59]'
                              : 'text-[#064E3B]'
                          }
                        />
                      ))}
                    </div>
                  )}

                  {/* Center Row: Left Chair + Table Rectangle/Circle + Right Chair */}
                  <div className="flex items-center gap-2">
                    {sideLeft > 0 && (
                      <Armchair
                        size={15}
                        className={
                          table.status === 'AVAILABLE'
                            ? 'text-[#00A389]'
                            : table.status === 'ON_DINE'
                            ? 'text-[#FF7A59]'
                            : 'text-[#064E3B]'
                        }
                      />
                    )}

                    {/* Table Surface Card */}
                    <div
                      className={`min-w-[130px] px-6 py-4 rounded-3xl border-2 ${cardBg} shadow-sm text-center transition-all group-hover:shadow-md`}
                    >
                      <h4 className={`font-black text-[13.5px] ${textColor}`}>
                        {table.tableName}
                      </h4>
                      <div className="flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-[#64748B] mt-0.5">
                        <Users size={12} className={textColor} />
                        <span>{table.capacity}</span>
                      </div>
                      {table.currentCustomer && (
                        <span className="block text-[10px] text-[#94A3B8] truncate max-w-[100px] mt-0.5">
                          {table.currentCustomer}
                        </span>
                      )}
                    </div>

                    {sideRight > 0 && (
                      <Armchair
                        size={15}
                        className={
                          table.status === 'AVAILABLE'
                            ? 'text-[#00A389]'
                            : table.status === 'ON_DINE'
                            ? 'text-[#FF7A59]'
                            : 'text-[#064E3B]'
                        }
                      />
                    )}
                  </div>

                  {/* Bottom Row Chairs */}
                  {bottomChairs > 0 && (
                    <div className="flex items-center gap-3.5 mt-1.5">
                      {Array.from({ length: bottomChairs }).map((_, i) => (
                        <Armchair
                          key={i}
                          size={15}
                          className={
                            table.status === 'AVAILABLE'
                              ? 'text-[#00A389]'
                              : table.status === 'ON_DINE'
                              ? 'text-[#FF7A59]'
                              : 'text-[#064E3B]'
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table Detail Quick Status Modal */}
      {selectedTableDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E2E8F0] relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedTableDetail(null)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-full hover:bg-[#F8FAFC]"
            >
              <X size={18} />
            </button>

            <h3 className="font-black text-[18px] text-[#0F172A] mb-1">
              {selectedTableDetail.tableName}
            </h3>
            <p className="text-[12px] text-[#64748B] mb-4">
              Khu vực {selectedTableDetail.area} • Sức chứa {selectedTableDetail.capacity} khách
            </p>

            <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0] space-y-2 mb-5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Trạng thái hiện tại:</span>
                <span className="font-extrabold text-[#00A389]">{selectedTableDetail.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Khách đang ngồi:</span>
                <span className="font-bold text-[#0F172A]">
                  {selectedTableDetail.currentCustomer || '—'}
                </span>
              </div>
            </div>

            {/* Quick Status Changers */}
            <div className="pt-2 border-t border-[#F1F5F9] space-y-2">
              <p className="text-[11.5px] font-bold text-[#94A3B8] uppercase">Đổi nhanh trạng thái:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    handleUpdateTableStatus(selectedTableDetail.id, 'AVAILABLE');
                    setSelectedTableDetail({ ...selectedTableDetail, status: 'AVAILABLE', currentCustomer: undefined });
                  }}
                  className="py-2 rounded-xl text-[11.5px] font-extrabold bg-[#E6F7F4] text-[#00A389] hover:bg-[#d0f2eb]"
                >
                  Trống
                </button>
                <button
                  onClick={() => {
                    handleUpdateTableStatus(selectedTableDetail.id, 'ON_DINE');
                    setSelectedTableDetail({ ...selectedTableDetail, status: 'ON_DINE', currentCustomer: 'Khách vãng lai' });
                  }}
                  className="py-2 rounded-xl text-[11.5px] font-extrabold bg-[#FFEDD5] text-[#EA580C] hover:bg-[#fed7aa]"
                >
                  Đang ăn
                </button>
                <button
                  onClick={() => {
                    handleUpdateTableStatus(selectedTableDetail.id, 'RESERVED');
                    setSelectedTableDetail({ ...selectedTableDetail, status: 'RESERVED' });
                  }}
                  className="py-2 rounded-xl text-[11.5px] font-extrabold bg-[#E2F0EC] text-[#064E3B] hover:bg-[#c4e9de]"
                >
                  Đã đặt
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setSelectedTableDetail(null)}
                className="w-full h-11 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px] font-bold text-[#64748B] hover:bg-[#F1F5F9]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Reservation Modal */}
      <AddReservationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddReservation={handleAddReservation}
      />
    </div>
  );
};

export default ManageTableView;
