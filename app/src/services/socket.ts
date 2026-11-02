const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8787';

export class AdoraSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  connect(userId: string, deviceId: string, deviceName: string) {
    try {
      this.ws = new WebSocket(WS_BASE);

      this.ws.onopen = () => {
        console.log('[Adora Socket] Connected to Companion Hub WebSocket');
        this.emit('DEVICE_REGISTER', {
          userId,
          deviceId,
          deviceName,
          volume: 0.85
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const handlers = this.listeners.get(message.type) || [];
          handlers.forEach((h) => h(message));
        } catch (err) {
          console.error('[Adora Socket] Error parsing message:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('[Adora Socket] Disconnected. Reconnecting in 3s...');
        setTimeout(() => this.connect(userId, deviceId, deviceName), 3000);
      };
    } catch (err) {
      console.warn('[Adora Socket] Connection failed:', err);
    }
  }

  on(type: string, handler: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(handler);
  }

  emit(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...payload }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const socketService = new AdoraSocket();
