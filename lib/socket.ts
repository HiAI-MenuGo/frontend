import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;
let currentKey = '';

export interface QRSocketConfig {
  tableId?: string;
  token?: string | null;
  tenantId?: string;
  branchId?: string;
}

function buildKey(cfg: QRSocketConfig): string {
  return [cfg.tableId || '', cfg.token || '', cfg.tenantId || '', cfg.branchId || ''].join('|');
}

export function getSocket(config: QRSocketConfig = {}): Socket {
  if (typeof window === 'undefined') {
    return null as unknown as Socket;
  }
  const key = buildKey(config);
  // QR chuyển bàn hoặc có token mới -> reconnect với params mới để join đúng table room
  if (socket && key !== currentKey) {
    try {
      socket.disconnect();
    } catch {}
    socket = null;
  }
  if (!socket) {
    currentKey = key;
    const token = config.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: {
        ...(token ? { token } : {}),
        ...(config.tableId ? { tableId: config.tableId } : {}),
        ...(config.tenantId ? { tenantId: config.tenantId } : {}),
        ...(config.branchId ? { branchId: config.branchId } : {}),
      },
      query: {
        ...(config.tableId ? { tableId: config.tableId } : {}),
        ...(config.tenantId ? { tenantId: config.tenantId } : {}),
        ...(config.branchId ? { branchId: config.branchId } : {}),
      },
    });
  }
  return socket!;
}

export default getSocket;
