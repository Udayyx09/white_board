import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Users,
  Copy,
  Check,
  Radio,
  Play,
  Square,
  QrCode,
  Download,
  Wifi,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { Collaborator } from '../types/canvas';

interface CollabModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string | null;
  onStartSession: () => void;
  onStopSession: () => void;
  collaborators: Collaborator[];
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  myColor: string;
  myUsername: string;
  isDark: boolean;
}

export const CollabModal: React.FC<CollabModalProps> = ({
  isOpen,
  onClose,
  roomId,
  onStartSession,
  onStopSession,
  collaborators,
  connectionStatus,
  myColor,
  myUsername,
  isDark,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'link' | 'qr'>('qr');
  const [useNetworkIp, setUseNetworkIp] = useState(true);

  // Auto-detect local Wi-Fi / LAN IP or fallback to window.location.hostname
  const networkHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '192.168.0.232'
    : window.location.hostname;

  const port = window.location.port ? `:${window.location.port}` : '';
  const currentOrigin = window.location.origin;
  const networkOrigin = `${window.location.protocol}//${networkHost}${port}`;

  const shareableUrl = roomId
    ? `${useNetworkIp ? networkOrigin : currentOrigin}/?room=${roomId}`
    : '';

  // Generate QR code whenever shareableUrl changes
  useEffect(() => {
    if (!shareableUrl) {
      setQrDataUrl(null);
      return;
    }

    QRCode.toDataURL(shareableUrl, {
      width: 260,
      margin: 1.5,
      color: {
        dark: '#1e1e24',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [shareableUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!shareableUrl) return;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `whiteboard-qr-${roomId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in pointer-events-auto">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-dialog overflow-hidden flex flex-col max-h-[90vh] transition-all ${
          isDark
            ? 'bg-[#232329] border-[#34343e] text-[#f0f0f0]'
            : 'bg-white border-[#e0e0e0] text-[#2c2c2c]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Radio
              className={`w-5 h-5 ${
                connectionStatus === 'connected'
                  ? 'text-emerald-500 animate-pulse'
                  : 'text-gray-400'
              }`}
            />
            <h3 className="font-semibold text-sm">Live Collaboration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2e2e38] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs font-sans overflow-y-auto">
          {roomId ? (
            <>
              {/* Status info */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-semibold">Session is Active!</span>
                </div>
                <span className="text-[11px] font-mono">
                  {collaborators.length + 1} online
                </span>
              </div>

              {/* View Tabs: QR Code vs Link */}
              <div className="flex border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setActiveTab('qr')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'qr'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan QR Code</span>
                </button>
                <button
                  onClick={() => setActiveTab('link')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'link'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  <span>Invite Link</span>
                </button>
              </div>

              {/* QR Code Tab Content */}
              {activeTab === 'qr' && (
                <div className="flex flex-col items-center justify-center py-2 space-y-3">
                  {/* QR Card with white backdrop for scan reliability */}
                  <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="Collaboration Room QR Code"
                        className="w-48 h-48 rounded-lg"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-xs">
                        Generating QR code...
                      </div>
                    )}
                  </div>

                  {/* Network / Localhost selector */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      onClick={() => setUseNetworkIp(true)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md border transition-colors ${
                        useNetworkIp
                          ? isDark
                            ? 'bg-[#3b387e] border-indigo-500 text-indigo-200'
                            : 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : isDark
                          ? 'border-[#3a3a46] text-gray-400'
                          : 'border-gray-200 text-gray-600'
                      }`}
                      title="Best for scanning from phones & tablets on Wi-Fi"
                    >
                      <Wifi className="w-3 h-3" />
                      <span>Wi-Fi / LAN IP</span>
                    </button>
                    <button
                      onClick={() => setUseNetworkIp(false)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md border transition-colors ${
                        !useNetworkIp
                          ? isDark
                            ? 'bg-[#3b387e] border-indigo-500 text-indigo-200'
                            : 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : isDark
                          ? 'border-[#3a3a46] text-gray-400'
                          : 'border-gray-200 text-gray-600'
                      }`}
                      title="For localhost browser tabs on the same computer"
                    >
                      <span>Localhost</span>
                    </button>
                  </div>

                  <p className="text-center text-[11px] text-gray-400 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Scan with your phone camera to join this canvas instantly</span>
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleCopyLink}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium text-xs transition-colors ${
                        isDark
                          ? 'border-[#3a3a46] hover:bg-[#2c2c36] text-gray-200'
                          : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownloadQr}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium text-xs transition-colors ${
                        isDark
                          ? 'border-[#3a3a46] hover:bg-[#2c2c36] text-gray-200'
                          : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save QR Image</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Link Tab Content */}
              {activeTab === 'link' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Shareable Room Link
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={shareableUrl}
                        className={`flex-1 px-3 py-2 rounded-lg border font-mono text-[11px] focus:outline-none ${
                          isDark
                            ? 'bg-[#1e1e24] border-[#3a3a46] text-gray-200'
                            : 'bg-gray-50 border-gray-200 text-gray-800'
                        }`}
                      />
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shrink-0"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-300" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Active Collaborators */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Connected Collaborators ({collaborators.length + 1})
                    </label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      <div
                        className={`flex items-center justify-between p-2 rounded-lg border ${
                          isDark ? 'bg-[#1e1e24] border-[#34343e]' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: myColor }}
                          />
                          <span className="font-medium text-xs">{myUsername} (You)</span>
                        </div>
                        <span className="text-[10px] text-emerald-500 font-mono">host</span>
                      </div>

                      {collaborators.map((c) => (
                        <div
                          key={c.id}
                          className={`flex items-center justify-between p-2 rounded-lg border ${
                            isDark ? 'bg-[#1e1e24] border-[#34343e]' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: c.color }}
                            />
                            <span className="font-medium text-xs">{c.username}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">active</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Stop Session Button */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={onStopSession}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium transition-colors"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop Collaboration Session</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">
                  Start a Live Collaboration Session
                </h4>
                <p className="text-gray-400 text-xs max-w-xs mx-auto">
                  Invite your team, phone, or tablet to sketch together on this canvas in real time with a shareable QR code and link.
                </p>
              </div>

              <button
                onClick={onStartSession}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Start Session & Generate QR Code</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
