import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import {
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Send,
  Phone,
  Video,
  MoreVertical,
  Search,
  CheckCheck,
  Smile,
  Plus,
  X,
  Loader2,
  UserPlus,
} from "lucide-react";

const safeArray = (...candidates) => {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "??";
  return name.substring(0, 2).toUpperCase();
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const ChatPage = () => {
  const { logout, user } = useAuth();
  const {
    chats,
    activeChat,
    setActiveChat,
    messages,
    messagesLoading,
    socket,
    typingUser, // 👈 Context se dynamic text status extract kiya
    fetchChats,
    createGroup,
    sendMessage,
  } = useChat();

  const [typedMessage, setTypedMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [modalError, setModalError] = useState("");

  // Local state loops to manage text debounce timers
  const [isLocalTyping, setIsLocalTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const messagesEndRef = useRef(null);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  // ⌨️ Custom Debounced Handling for Keypress/Input Events
  const handleInputChange = (e) => {
    setTypedMessage(e.target.value);

    if (!socket || !activeChat) return;

    // Agar hum pehle se typing event nahi bhej rahe hain, toh emit karo
    if (!isLocalTyping) {
      setIsLocalTyping(true);
      socket.emit("typing", { chatId: activeChat._id, userName: user?.name });
    }

    // Purana timeout timer clear karo
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Agar agle 1.5 second tak user chup rehta hai, toh stop event trigger karo
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", { chatId: activeChat._id });
      setIsLocalTyping(false);
    }, 1500);
  };

  const searchUsers = useCallback(
    async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await api.get("/user", { params: { search: query.trim() } });
        const users = safeArray(res.data?.users, res.data?.data, res.data);
        const selectedIds = new Set(selectedUsers.map((u) => u._id));
        const filtered = users.filter(
          (u) => u?._id && u._id !== user?._id && !selectedIds.has(u._id)
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error("User search failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [selectedUsers, user?._id]
  );

  useEffect(() => {
    if (!isModalOpen) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      searchUsers(userSearch);
    }, 350);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [userSearch, isModalOpen, searchUsers]);

  const addUser = (selectedUser) => {
    if (!selectedUser?._id) return;
    setSelectedUsers((prev) =>
      prev.some((u) => u._id === selectedUser._id) ? prev : [...prev, selectedUser]
    );
    setSearchResults((prev) => prev.filter((u) => u._id !== selectedUser._id));
  };

  const removeUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setModalError("");
    setNewGroupName("");
    setSelectedUsers([]);
    setUserSearch("");
    setSearchResults([]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeChat || isSending) return;

    // Send click par instant tracking cancel karo
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (socket && activeChat) {
      socket.emit("stop-typing", { chatId: activeChat._id });
    }
    setIsLocalTyping(false);

    const messageToSend = typedMessage.trim();
    setTypedMessage("");
    setSendError("");
    setIsSending(true);

    const result = await sendMessage(messageToSend, activeChat._id);
    setIsSending(false);

    if (!result.success) {
      setSendError(result.message || "Failed to send message");
      setTypedMessage(messageToSend);
    }
  };

  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    if (selectedUsers.length === 0) {
      setModalError("Select at least one co-worker to create a group.");
      return;
    }

    setModalError("");
    setIsCreating(true);

    const userIds = selectedUsers.map((u) => u._id);
    const result = await createGroup(newGroupName.trim(), userIds);

    setIsCreating(false);

    if (result?.success) {
      resetModal();
    } else {
      setModalError(result?.message || "Something went wrong");
    }
  };

  const activeChatTitle = activeChat?.chatName || activeChat?.name || "Group Channel";

  return (
    <div className="h-screen w-screen bg-[#0F0F1E] text-white flex overflow-hidden font-sans relative">
      {/* Ambient backgrounds background element layers */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-purple-600/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-[90px]" />
      </div>

      {/* PANEL 1: Utility Action Bar */}
      <div className="relative z-10 w-16 bg-[#131324]/80 backdrop-blur-xl border-r border-white/5 flex flex-col items-center justify-between py-6">
        <div className="flex flex-col gap-6 items-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold tracking-tight text-lg shadow-md glow-indigo">
            S
          </div>
          <button className="p-3 bg-white/5 text-indigo-400 rounded-xl cursor-pointer">
            <MessageSquare className="h-5 w-5" />
          </button>
          <button className="p-3 text-gray-500 hover:text-white rounded-xl transition-all cursor-pointer">
            <Users className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5 items-center">
          <button className="p-3 text-gray-500 hover:text-white rounded-xl transition-all cursor-pointer">
            <Settings className="h-5 w-5" />
          </button>
          <button
            onClick={logout}
            className="p-3 text-red-400/80 hover:text-red-400 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xs font-semibold uppercase">
            {getInitials(user?.name)}
          </div>
        </div>
      </div>

      {/* PANEL 2: Channel Sidebar */}
      <div className="relative z-10 w-80 glass-surface border-r border-white/5 flex flex-col">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Chats</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-400 border border-indigo-500/20 rounded-lg transition-all cursor-pointer"
              title="Create New Group"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-[#0F0F1E]/60 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-indigo-500 transition-all text-gray-300"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-glass pb-4">
          {Array.isArray(chats) && chats.length > 0 ? (
            chats.map((chat, index) => {
              if (!chat) return null;
              const chatTitle = chat?.chatName || chat?.name || "Group Channel";
              const isActive = activeChat?._id === chat?._id;

              return (
                <div
                  key={chat?._id || index}
                  onClick={() => setActiveChat(chat)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all ${
                    isActive
                      ? "bg-indigo-500/10 border border-indigo-500/20"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/10 flex items-center justify-center font-semibold text-sm uppercase shrink-0">
                    {getInitials(chatTitle)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold truncate text-gray-200">
                        {chatTitle}
                      </h3>
                      <span className="text-[10px] text-gray-500 shrink-0">Now</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      Tap to open channel
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-8 text-center">
              <p className="text-xs text-gray-500">No channels yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* PANEL 3: Messaging Canvas */}
      <div className="relative z-10 flex-1 flex flex-col">
        {activeChat ? (
          <>
            <div className="h-16 border-b border-white/5 px-6 flex items-center justify-between glass-surface">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                  {getInitials(activeChatTitle)}
                </div>
                <div>
                  <h2 className="text-sm font-bold">{activeChatTitle}</h2>
                  
                  {/* 🔥 REFRESH PROOF: Dynamic live interface indicator banner toggles here */}
                  {typingUser && typingUser.userId !== user?._id ? (
                    <p className="text-[10px] text-indigo-400 flex items-center gap-1 mt-0.5 font-bold animate-pulse">
                      @{typingUser.userName} is typing...
                    </p>
                  ) : (
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Channel
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-gray-400">
                <button className="hover:text-white cursor-pointer"><Phone className="h-4 w-4" /></button>
                <button className="hover:text-white cursor-pointer"><Video className="h-4 w-4" /></button>
                <button className="hover:text-white cursor-pointer"><MoreVertical className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-glass">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                </div>
              ) : Array.isArray(messages) && messages.length > 0 ? (
                messages.map((msg, index) => {
                  const isMe = msg?.sender === user?._id || msg?.sender?._id === user?._id;
                  const senderName = typeof msg?.sender === "object" ? msg.sender?.name : msg?.senderName;

                  return (
                    <div key={msg?._id || index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-br-none glow-indigo" : "bg-[#16162a] border border-white/5 text-gray-200 rounded-bl-none"}`}>
                        {!isMe && <p className="text-[10px] font-bold text-indigo-400 mb-1">@{senderName || "User"}</p>}
                        <p className="leading-relaxed">{msg?.content || msg?.text || ""}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className={`text-[9px] ${isMe ? "text-white/40" : "text-gray-500"}`}>{formatTime(msg?.createdAt)}</span>
                          {isMe && <CheckCheck className="h-3 w-3 text-indigo-300" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-8 w-8 text-indigo-400/40 mb-3" />
                  <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {sendError && (
              <div className="mx-4 mb-2 bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-4 py-2.5 rounded-xl backdrop-blur-sm flex items-center gap-2">
                <X className="h-3.5 w-3.5 shrink-0 cursor-pointer hover:text-red-200" onClick={() => setSendError("")} />
                {sendError}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="p-4 glass-surface border-t border-white/5 flex items-center gap-3">
              <button type="button" className="text-gray-400 hover:text-white p-1 cursor-pointer"><Smile className="h-5 w-5" /></button>
              <input
                type="text"
                placeholder="Type your message here..."
                className="flex-1 bg-[#131324] border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-indigo-500 transition-all text-gray-200"
                value={typedMessage}
                onChange={handleInputChange} // 🔥 Connect custom dynamic input change tracking with debouncer
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || !typedMessage.trim()}
                className="bg-indigo-500 text-white p-3 rounded-xl hover:bg-indigo-600 transition-all shadow-md shadow-indigo-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px]"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06),transparent_60%)]">
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 glow-indigo">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">No Chat Selected</h3>
          </div>
        )}
      </div>

      {/* Group Creation Modal code boundaries ... (Saves standard mapping) */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-surface border border-white/10 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={resetModal} className="absolute right-4 top-4 p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"><X className="h-4 w-4" /></button>
            <div className="mb-5">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2"><UserPlus className="h-5 w-5 text-indigo-400" /> Create New Group</h3>
            </div>
            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Group Name</label>
                <input type="text" required placeholder="e.g., Alpha Developers" className="w-full bg-[#0F0F1E] border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={resetModal} className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-400 hover:bg-white/5 hover:text-white">Cancel</button>
                <button type="submit" disabled={isCreating} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-semibold shadow-lg">{isCreating ? "Creating..." : "Create Channel"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;