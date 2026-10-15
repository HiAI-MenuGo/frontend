'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';
import { useBranchStore } from '@/stores/branch.store';
import { createTaggedLogger } from '@/lib/logger';

const log = createTaggedLogger('SOCKET');
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinTable: (tableId: string) => void;
  leaveTable: (tableId: string) => void;
  on: (event: string, handler: (...args: any[]) => void) => () => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
  emit: (event: string, data: any) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketConfig {
  tableId?: string;
  // For QR menu: pass tableId to join table room
  // For staff: don't pass tableId (joins tenant/branch rooms)
}

export function SocketProvider({ children, config = {} }: { 
  children: React.ReactNode; 
  config?: SocketConfig 
}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const initRef = useRef(false);
  const configRef = useRef(config);

  // Update config ref when config changes
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  // Initialize socket connection once
  useEffect(() => {
    if (initRef.current || typeof window === 'undefined') return;
    initRef.current = true;

    const tenantId = user?.tenantId || 'default-tenant';
    const branchId = selectedBranchId && selectedBranchId !== 'ALL' ? selectedBranchId : user?.branchId || 'default-branch';
    const tableId = configRef.current?.tableId;

    log.info('[SocketContext] Initializing socket:', { tenantId, branchId, tableId, hasToken: !!token });

    // Build auth object - send token in both auth and query for compatibility
    const auth = {
      token,
      tenantId,
      branchId,
      ...(tableId ? { tableId } : {}),
    };

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth,
      query: {
        tenantId,
        branchId,
        ...(tableId ? { tableId } : {}),
      },
    });

    newSocket.on('connect', () => {
      log.info(`[SocketContext] Connected: ${newSocket.id}, transport: ${newSocket.io.engine.transport.name}`);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      log.info(`[SocketContext] Disconnected: ${reason}`);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      log.error(`[SocketContext] Connection error: ${err.message}`, { details: err });
    });

    newSocket.io.on('reconnect_attempt', (attemptNumber) => {
      log.info(`[SocketContext] Reconnect attempt: ${attemptNumber}`);
    });

    newSocket.io.on('reconnect', (attemptNumber) => {
      log.info(`[SocketContext] Reconnected after ${attemptNumber} attempts`);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      log.info('SOCKET', '[SocketContext] Cleaning up socket');
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      initRef.current = false;
    };
  }, []); // Only run once on mount

  // Handle auth/branch changes - recreate socket instead of mutating
  useEffect(() => {
    if (!initRef.current) return;
    
    // Skip if no socket yet
    if (!socketRef.current) return;

    const tenantId = user?.tenantId || 'default-tenant';
    const branchId = selectedBranchId && selectedBranchId !== 'ALL' ? selectedBranchId : user?.branchId || 'default-branch';
    const tableId = configRef.current?.tableId;

    // Only reconnect if critical auth info changed
    const currentAuth = (typeof socketRef.current.auth === 'object' && socketRef.current.auth ? socketRef.current.auth : {}) as Record<string, any>;
    const authChanged = 
      currentAuth.token !== token ||
      currentAuth.tenantId !== tenantId ||
      currentAuth.branchId !== branchId ||
      currentAuth.tableId !== tableId;

    if (authChanged && socketRef.current.connected) {
      log.info('[SocketContext] Auth changed, reconnecting...', {
        old: { token: !!currentAuth.token, tenantId: currentAuth.tenantId, branchId: currentAuth.branchId },
        new: { token: !!token, tenantId, branchId, tableId }
      });
      
      socketRef.current.auth = { token, tenantId, branchId, ...(tableId ? { tableId } : {}) };
      socketRef.current.io.opts.query = { tenantId, branchId, ...(tableId ? { tableId } : {}) };
      
      // Force reconnect
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  }, [token, user?.tenantId, selectedBranchId, user?.branchId]);

  const joinTable = useCallback((tableId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:table', { tableId });
      log.info(`[SocketContext] Joined table: ${tableId}`);
    }
  }, []);

  const leaveTable = useCallback((tableId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:table', { tableId });
      log.info(`[SocketContext] Left table: ${tableId}`);
    }
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    socketRef.current?.off(event, handler);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const value = useMemo(() => ({
    socket,
    isConnected,
    joinTable,
    leaveTable,
    on,
    off,
    emit,
  }), [socket, isConnected, joinTable, leaveTable, on, off, emit]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

const noop = () => {};

export function useSocket(config?: SocketConfig): SocketContextType {
  const context = useContext(SocketContext);
  
  // If used outside provider (e.g., QR menu pages without MainLayout), 
  // fallback to legacy getSocket for backward compatibility
  if (!context) {
    if (typeof window !== 'undefined') {
      // Dynamic import to avoid circular dependency
      try {
        const { getSocket } = require('@/lib/socket');
        const sock = getSocket(config);
        return {
          socket: sock,
          isConnected: Boolean(sock?.connected),
          joinTable: (tId: string) => sock?.emit('join:table', { tableId: tId }),
          leaveTable: (tId: string) => sock?.emit('leave:table', { tableId: tId }),
          on: (ev: string, handler: (...args: any[]) => void) => {
            sock?.on(ev, handler);
            return () => sock?.off(ev, handler);
          },
          off: (ev: string, handler?: (...args: any[]) => void) => {
            if (handler) sock?.off(ev, handler);
            else sock?.off(ev);
          },
          emit: (ev: string, data: any) => sock?.emit(ev, data),
        };
      } catch {
        // Fallback below
      }
    }

    return {
      socket: null,
      isConnected: false,
      joinTable: noop,
      leaveTable: noop,
      on: () => noop,
      off: noop,
      emit: noop,
    };
  }
  return context;
}

export default SocketContext;