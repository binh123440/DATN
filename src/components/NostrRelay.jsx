import { useState, useEffect, useRef } from 'react';
import * as nostrTools from 'nostr-tools';
import { Wifi, WifiOff, Send, Eye, EyeOff, Trash2, Key, MessageSquare } from 'lucide-react';

const NostrRelay = () => {
  // State cho kết nối multiple relays
  const [newRelayUrl, setNewRelayUrl] = useState('');
  const [relays, setRelays] = useState(new Map()); // Map<url, {ws, status, logs}>
  const [defaultRelays] = useState([
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.nostr.band',
    'wss://nostr.wine'
  ]);
  
  // State cho keys (fixed keys của user)
  const [privateKey] = useState('nsec1abc123...'); // Replace with actual user's private key
  const [publicKey] = useState('npub1xyz789...'); // Replace with actual user's public key
  
  // State cho publishing
  const [noteContent, setNoteContent] = useState('Xin chào Nostr từ UTE Social!');
  
  // State cho subscription
  const [subId, setSubId] = useState('ute-social-sub');
  const [filter, setFilter] = useState('{"kinds":[1],"limit":20}');
  const [activeSubscriptions, setActiveSubscriptions] = useState(new Set());
  
  // State cho UI
  const [logs, setLogs] = useState([]);
  const [receivedNotes, setReceivedNotes] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  
  const logRef = useRef(null);

  // Helper functions
  const truncatePubkey = (pubkey) => {
    if (!pubkey) return '';
    return `${pubkey.substring(0, 8)}...${pubkey.substring(pubkey.length - 8)}`;
  };

  const addLog = (message, type) => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = {
      id: Date.now(),
      timestamp,
      message,
      type // 'sent', 'received', 'system'
    };
    setLogs(prev => [...prev, newLog]);
  };

  const updateSubscriptionTracker = (newSubs) => {
    setActiveSubscriptions(new Set(newSubs));
  };

  // Relay management functions
  const addRelay = (url) => {
    if (!url.startsWith('wss://')) {
      alert('URL của Relay phải bắt đầu bằng wss://');
      return;
    }
    if (relays.has(url)) {
      alert('Relay này đã tồn tại!');
      return;
    }
    setRelays(prev => new Map(prev.set(url, { ws: null, status: 'disconnected', logs: [] })));
  };

  const removeRelay = (url) => {
    const relay = relays.get(url);
    if (relay?.ws) {
      relay.ws.close();
    }
    setRelays(prev => {
      const newRelays = new Map(prev);
      newRelays.delete(url);
      return newRelays;
    });
  };

  // Connect to relay
  const connectToRelay = (url) => {
    const relay = relays.get(url);
    if (!relay || relay.status === 'connecting' || relay.status === 'connected') {
      return;
    }

    setRelays(prev => new Map(prev.set(url, { ...relay, status: 'connecting' })));
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setRelays(prev => new Map(prev.set(url, { ...prev.get(url), ws, status: 'connected' })));
      addLog(`Đã kết nối tới ${url}`, 'received');
    };

    ws.onmessage = (event) => {
      const rawMessage = event.data;
      addLog(`[${url}] ${rawMessage}`, 'received');

      try {
        const data = JSON.parse(rawMessage);
        if (Array.isArray(data) && data[0] === 'EVENT') {
          const eventObject = data[2];
          if (eventObject && eventObject.kind === 1) {
            setReceivedNotes(prev => [{ ...eventObject, relay: url }, ...prev]);
          }
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      addLog(`[${url}] Lỗi WebSocket: ${error}`, 'system');
      setRelays(prev => new Map(prev.set(url, { ...prev.get(url), status: 'error' })));
    };

    ws.onclose = () => {
      setRelays(prev => new Map(prev.set(url, { ...prev.get(url), ws: null, status: 'disconnected' })));
      addLog(`[${url}] WebSocket đã đóng`, 'system');
    };
  };

  // Disconnect from relay
  const disconnectFromRelay = (url) => {
    const relay = relays.get(url);
    if (relay?.ws) {
      relay.ws.close();
    }
  };

  // Connect to all relays
  const connectAll = () => {
    relays.forEach((_, url) => {
      connectToRelay(url);
    });
  };

  // Disconnect from all relays
  const disconnectAll = () => {
    relays.forEach((_, url) => {
      disconnectFromRelay(url);
    });
  };

  // Publish note
  const publishNote = async () => {
    if (!publicKey || !privateKey) {
      alert('Vui lòng cấu hình khóa trước khi gửi');
      return;
    }
    if (!noteContent.trim()) {
      alert('Nội dung không được để trống');
      return;
    }

    const connectedRelays = Array.from(relays.entries()).filter(([_, relay]) => relay.status === 'connected');
    if (connectedRelays.length === 0) {
      alert('Vui lòng kết nối ít nhất một relay trước khi gửi');
      return;
    }

    try {
      let event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['t', 'ute_social']], // Thêm tag ute_social
        content: noteContent,
        pubkey: publicKey,
      };

      event.id = nostrTools.getEventHash(event);
      event.sig = nostrTools.signEvent(event, privateKey);

      const message = ["EVENT", event];
      const messageString = JSON.stringify(message);

      // Gửi đến tất cả relay đã kết nối
      connectedRelays.forEach(([url, relay]) => {
        if (relay.ws) {
          relay.ws.send(messageString);
          addLog(`[${url}] ${messageString}`, 'sent');
        }
      });

      setNoteContent('');
      addLog(`Đã gửi note đến ${connectedRelays.length} relay(s)`, 'system');
    } catch (error) {
      addLog(`Lỗi gửi note: ${error.message}`, 'system');
    }
  };

  // Subscribe
  const subscribe = () => {
    if (!subId.trim()) {
      alert('Subscription ID không được để trống');
      return;
    }

    const connectedRelays = Array.from(relays.entries()).filter(([_, relay]) => relay.status === 'connected');
    if (connectedRelays.length === 0) {
      alert('Vui lòng kết nối ít nhất một relay trước khi subscribe');
      return;
    }

    try {
      const filterObj = JSON.parse(filter);
      const message = ["REQ", subId, filterObj];
      const messageString = JSON.stringify(message);

      connectedRelays.forEach(([url, relay]) => {
        if (relay.ws) {
          relay.ws.send(messageString);
          addLog(`[${url}] ${messageString}`, 'sent');
        }
      });
      
      setActiveSubscriptions(prev => new Set([...prev, subId]));
      addLog(`Đã subscribe "${subId}" đến ${connectedRelays.length} relay(s)`, 'system');
    } catch (error) {
      alert('Filter JSON không hợp lệ: ' + error.message);
    }
  };
  
  // Unsubscribe
  const unsubscribe = () => {
    if (!subId.trim()) {
      alert('Subscription ID không được để trống');
      return;
    }

    const connectedRelays = Array.from(relays.entries()).filter(([_, relay]) => relay.status === 'connected');
    
    const message = ["CLOSE", subId];
    const messageString = JSON.stringify(message);

    connectedRelays.forEach(([url, relay]) => {
      if (relay.ws) {
        relay.ws.send(messageString);
        addLog(`[${url}] ${messageString}`, 'sent');
      }
    });
    
    setActiveSubscriptions(prev => {
      const newSubs = new Set(prev);
      newSubs.delete(subId);
      return newSubs;
    });

    addLog(`Đã unsubscribe "${subId}" từ ${connectedRelays.length} relay(s)`, 'system');
  };

  // Clear functions
  const clearLogs = () => setLogs([]);
  const clearNotes = () => setReceivedNotes([]);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  // Initialize default relays on mount
  useEffect(() => {
    const initialRelays = new Map();
    defaultRelays.forEach(url => {
      initialRelays.set(url, { ws: null, status: 'disconnected', logs: [] });
    });
    setRelays(initialRelays);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Quản lý Nostr Relays
        </h1>

        {/* Relay Management Section */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-700">1. Quản lý Relays</h2>
          
          {/* Add new relay */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newRelayUrl}
              onChange={(e) => setNewRelayUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="wss://relay.example.com"
            />
            <button
              onClick={() => {
                if (newRelayUrl) {
                  addRelay(newRelayUrl);
                  setNewRelayUrl('');
                }
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
            >
              <Wifi className="h-4 w-4" />
              Thêm Relay
            </button>
            <button
              onClick={connectAll}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Kết nối tất cả
            </button>
            <button
              onClick={disconnectAll}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Ngắt kết nối tất cả
            </button>
          </div>

          {/* Relay list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from(relays.entries()).map(([url, relay]) => (
              <div key={url} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 truncate" title={url}>
                      {url.replace('wss://', '')}
                    </h3>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      relay.status === 'connected' ? 'bg-green-100 text-green-800' :
                      relay.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                      relay.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {relay.status === 'connected' ? 'Đã kết nối' :
                       relay.status === 'connecting' ? 'Đang kết nối' :
                       relay.status === 'error' ? 'Lỗi' :
                       'Đã ngắt kết nối'}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {relay.status === 'connected' ? (
                      <button
                        onClick={() => disconnectFromRelay(url)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      >
                        <WifiOff className="h-3 w-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => connectToRelay(url)}
                        disabled={relay.status === 'connecting'}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:bg-gray-400"
                      >
                        <Wifi className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => removeRelay(url)}
                      className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {relays.size === 0 && (
            <p className="text-gray-500 text-center py-4">
              Chưa có relay nào. Thêm relay để bắt đầu.
            </p>
          )}
        </div>

        {/* User Keys Section */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-700">2. Khóa người dùng</h2>
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
            <p className="text-blue-800 text-sm">
              <strong>Thông tin:</strong> Đây là khóa cố định của người dùng. Cần cấu hình từ hệ thống.
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Public Key:</label>
            <input
              type="text"
              value={publicKey}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Private Key:</label>
            <input
              type="password"
              value={privateKey}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
            />
          </div>
        </div>

        {/* Publish Section */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-700">3. Publish Note (với tag #ute_social)</h2>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Nhập nội dung ghi chú..."
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Sẽ được gửi đến {Array.from(relays.values()).filter(r => r.status === 'connected').length} relay(s) đã kết nối
            </span>
            <button
              onClick={publishNote}
              disabled={Array.from(relays.values()).filter(r => r.status === 'connected').length === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Publish Note
            </button>
          </div>
        </div>

        {/* Subscribe Section */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-700">4. Đăng ký nhận tin</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subscription ID:</label>
              <input
                type="text"
                value={subId}
                onChange={(e) => setSubId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter (JSON):</label>
              <textarea
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows="2"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={subscribe}
              disabled={Array.from(relays.values()).filter(r => r.status === 'connected').length === 0}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
            >
              Đăng ký (REQ)
            </button>
            <button
              onClick={unsubscribe}
              disabled={Array.from(relays.values()).filter(r => r.status === 'connected').length === 0}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400"
            >
              Hủy đăng ký (CLOSE)
            </button>
            <span className="text-sm text-gray-500 flex items-center">
              Sẽ áp dụng cho {Array.from(relays.values()).filter(r => r.status === 'connected').length} relay(s) đã kết nối
            </span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-700">5. Subscription đang hoạt động</h2>
          <div className="bg-gray-50 border rounded-md p-4">
            <p className="text-sm text-gray-600 mb-2">
              Số lượng: <span className="font-bold">{activeSubscriptions.size}</span> | 
              Relay đã kết nối: <span className="font-bold">{Array.from(relays.values()).filter(r => r.status === 'connected').length}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {activeSubscriptions.size === 0 ? (
                <span className="text-gray-500 text-sm">Không có subscription nào đang hoạt động</span>
              ) : (
                Array.from(activeSubscriptions).map(sub => (
                  <span key={sub} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">
                    {sub}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Received Notes */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">6. Ghi chú nhận được</h2>
            <button
              onClick={clearNotes}
              className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Xóa
            </button>
          </div>
          <div className="bg-gray-50 border rounded-md p-4 max-h-96 overflow-y-auto space-y-3">
            {receivedNotes.length === 0 ? (
              <p className="text-gray-500 text-sm">Chưa có ghi chú nào</p>
            ) : (
              receivedNotes.map((note, index) => (
                <div key={index} className="bg-white border rounded-md p-3">
                  <div className="flex justify-between items-center mb-2 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-600" title={note.pubkey}>
                        {truncatePubkey(note.pubkey)}
                      </span>
                      {note.relay && (
                        <span className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-xs">
                          {note.relay.replace('wss://', '')}
                        </span>
                      )}
                    </div>
                    <span>{new Date(note.created_at * 1000).toLocaleString('vi-VN')}</span>
                  </div>
                  <p className="text-gray-800">{note.content}</p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {note.tags.map((tag, tagIndex) => (
                        tag[0] === 't' && (
                          <span key={tagIndex} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                            #{tag[1]}
                          </span>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Logs Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">7. Log giao tiếp</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center gap-1"
              >
                {showLogs ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showLogs ? 'Ẩn' : 'Hiện'}
              </button>
              <button
                onClick={clearLogs}
                className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Xóa
              </button>
            </div>
          </div>
          {showLogs && (
            <div
              ref={logRef}
              className="bg-gray-900 text-green-400 p-4 rounded-md max-h-64 overflow-y-auto font-mono text-sm space-y-1"
            >
              {logs.length === 0 ? (
                <p className="text-gray-500">Chưa có log nào</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className={`${
                    log.type === 'sent' ? 'text-blue-400' :
                    log.type === 'received' ? 'text-green-400' :
                    'text-yellow-400'
                  }`}>
                    <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NostrRelay;
