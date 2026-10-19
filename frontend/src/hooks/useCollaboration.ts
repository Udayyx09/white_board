import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { CanvasElement, Collaborator, LaserPoint, LaserTrail } from '../types/canvas';

const COLLABORATOR_COLORS = [
  '#e03131', // red
  '#2f9e44', // green
  '#1971c2', // blue
  '#f08c00', // orange
  '#9c36b5', // violet
  '#099268', // teal
  '#d6336c', // pink
  '#1098ad', // cyan
];

interface UseCollaborationOptions {
  roomId: string | null;
  onRemoteElements: (elements: CanvasElement[]) => void;
  currentUser?: { id?: number; username?: string } | null;
}

export function useCollaboration({
  roomId,
  onRemoteElements,
  currentUser,
}: UseCollaborationOptions) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [remoteLaserTrails, setRemoteLaserTrails] = useState<LaserTrail[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error'
  >('disconnected');

  const stompClientRef = useRef<Client | null>(null);

  // Generate persistent user color and ID
  const myUserId = useRef<string>(
    currentUser?.id
      ? `user-${currentUser.id}`
      : `guest-${Math.random().toString(36).substring(2, 7)}`
  ).current;

  const myUsername = useRef<string>(
    currentUser?.username || `Guest ${myUserId.slice(-4)}`
  ).current;

  const myColor = useRef<string>(
    COLLABORATOR_COLORS[
      Math.abs(
        myUserId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      ) % COLLABORATOR_COLORS.length
    ]
  ).current;

  // Last broadcasted cursor position to throttle network packets
  const lastCursorSend = useRef<number>(0);

  // Initialize and connect STOMP client
  useEffect(() => {
    if (!roomId) {
      setConnectionStatus('disconnected');
      setCollaborators([]);
      return;
    }

    setConnectionStatus('connecting');

    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const isDevServer = typeof window !== 'undefined' && window.location.port === '5173';
    const brokerUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL)
      ? import.meta.env.VITE_WS_URL
      : (isDevServer
          ? `${protocol}//${window.location.hostname}:8080/ws`
          : `${protocol}//${window.location.host}/ws`);

    const client = new Client({
      brokerURL: brokerUrl,
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setConnectionStatus('connected');

        // 1. Subscribe to Remote Cursors
        client.subscribe(`/topic/drawings/${roomId}/cursor`, (message) => {
          try {
            const data = JSON.parse(message.body);
            if (data.userId === myUserId) return; // ignore own cursor

            setCollaborators((prev) => {
              const existingIdx = prev.findIndex((c) => c.id === data.userId);
              const updatedCollab: Collaborator = {
                id: data.userId,
                username: data.username || 'Collaborator',
                color: data.userColor || '#6965db',
                cursor: { x: data.x, y: data.y },
                lastSeen: Date.now(),
              };

              if (existingIdx >= 0) {
                const next = [...prev];
                next[existingIdx] = updatedCollab;
                return next;
              } else {
                return [...prev, updatedCollab];
              }
            });
          } catch (e) {
            console.error('Failed to parse cursor message', e);
          }
        });

        // 2. Subscribe to Remote Elements Changes
        client.subscribe(`/topic/drawings/${roomId}/elements`, (message) => {
          try {
            const data = JSON.parse(message.body);
            if (data.userId === myUserId) return; // ignore own element broadcasts
            if (data.elementsJson) {
              const elements: CanvasElement[] = JSON.parse(data.elementsJson);
              onRemoteElements(elements);
            }
          } catch (e) {
            console.error('Failed to parse elements message', e);
          }
        });

        // 3. Subscribe to Remote Laser Pen Trails
        client.subscribe(`/topic/drawings/${roomId}/laser`, (message) => {
          try {
            const data = JSON.parse(message.body);
            if (data.userId === myUserId) return; // ignore own laser

            if (data.laserPointsJson) {
              const points: LaserPoint[] = JSON.parse(data.laserPointsJson);
              setRemoteLaserTrails((prev) => {
                const filtered = prev.filter((t) => t.userId !== data.userId);
                return [
                  ...filtered,
                  {
                    userId: data.userId,
                    color: data.userColor || '#ff2a5f',
                    points,
                  },
                ];
              });
            }
          } catch (e) {
            console.error('Failed to parse laser message', e);
          }
        });

        // 4. Subscribe to Presence (Joins / Leaves)
        client.subscribe(`/topic/drawings/${roomId}/presence`, (message) => {
          try {
            const data = JSON.parse(message.body);
            if (data.userId === myUserId) return;

            if (data.type === 'PRESENCE_JOIN') {
              setCollaborators((prev) => {
                if (prev.some((c) => c.id === data.userId)) return prev;
                return [
                  ...prev,
                  {
                    id: data.userId,
                    username: data.username || 'Collaborator',
                    color: data.userColor || '#6965db',
                    lastSeen: Date.now(),
                  },
                ];
              });
            } else if (data.type === 'PRESENCE_LEAVE') {
              setCollaborators((prev) => prev.filter((c) => c.id !== data.userId));
            }
          } catch (e) {
            console.error('Failed to parse presence message', e);
          }
        });

        // Announce presence on connect
        client.publish({
          destination: `/app/drawings/${roomId}/presence`,
          body: JSON.stringify({
            type: 'PRESENCE_JOIN',
            drawingId: roomId,
            userId: myUserId,
            username: myUsername,
            userColor: myColor,
          }),
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        setConnectionStatus('error');
      },
      onWebSocketClose: () => {
        setConnectionStatus('disconnected');
      },
    });

    client.activate();
    stompClientRef.current = client;

    // Heartbeat cleanup for inactive collaborator cursors (> 6 seconds silent)
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setCollaborators((prev) => prev.filter((c) => now - c.lastSeen < 6000));
    }, 3000);

    return () => {
      clearInterval(cleanupInterval);
      if (client.connected) {
        client.publish({
          destination: `/app/drawings/${roomId}/presence`,
          body: JSON.stringify({
            type: 'PRESENCE_LEAVE',
            drawingId: roomId,
            userId: myUserId,
            username: myUsername,
            userColor: myColor,
          }),
        });
      }
      client.deactivate();
    };
  }, [roomId, myUserId, myUsername, myColor, onRemoteElements]);

  // Broadcast Cursor (throttled to ~30fps max)
  const broadcastCursor = useCallback(
    (x: number, y: number) => {
      if (!roomId || !stompClientRef.current?.connected) return;
      const now = Date.now();
      if (now - lastCursorSend.current < 33) return; // ~30ms throttle
      lastCursorSend.current = now;

      stompClientRef.current.publish({
        destination: `/app/drawings/${roomId}/cursor`,
        body: JSON.stringify({
          type: 'CURSOR',
          drawingId: roomId,
          userId: myUserId,
          username: myUsername,
          userColor: myColor,
          x,
          y,
        }),
      });
    },
    [roomId, myUserId, myUsername, myColor]
  );

  // Broadcast Elements Changes
  const broadcastElements = useCallback(
    (elements: CanvasElement[]) => {
      if (!roomId || !stompClientRef.current?.connected) return;

      stompClientRef.current.publish({
        destination: `/app/drawings/${roomId}/elements`,
        body: JSON.stringify({
          type: 'ELEMENTS_CHANGE',
          drawingId: roomId,
          userId: myUserId,
          username: myUsername,
          userColor: myColor,
          elementsJson: JSON.stringify(elements),
        }),
      });
    },
    [roomId, myUserId, myUsername, myColor]
  );

  // Broadcast Laser Pen Stroke
  const broadcastLaser = useCallback(
    (points: LaserPoint[]) => {
      if (!roomId || !stompClientRef.current?.connected) return;

      stompClientRef.current.publish({
        destination: `/app/drawings/${roomId}/laser`,
        body: JSON.stringify({
          type: 'LASER',
          drawingId: roomId,
          userId: myUserId,
          username: myUsername,
          userColor: myColor,
          laserPointsJson: JSON.stringify(points),
        }),
      });
    },
    [roomId, myUserId, myUsername, myColor]
  );

  return {
    collaborators,
    remoteLaserTrails,
    connectionStatus,
    myColor,
    myUserId,
    myUsername,
    broadcastCursor,
    broadcastElements,
    broadcastLaser,
  };
}
