import { useEffect, useState } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { 
  MessageSquare, Users, Settings, LogOut, Send, 
  Phone, Video, MoreVertical, Search, CheckCheck, Smile,
  Plus, X, Loader2
} from "lucide-react";

const ChatPage = () => {
  const { logout, user } = useAuth();
  const { chats, activeChat, setActiveChat, messages, setMessages, socket, fetchChats, createGroup } = useChat();
  const [typedMessage, setTypedMessage] = useState("");
  
  // 🧭 Modal State Management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    fetchChats();
  }, []);

  
useEffect(() => {
  if (!socket) return;

  socket.on("message-received", (newMessageReceived) => {

    if (!activeChat || activeChat._id !== newMessageReceived.chat._id) {
    } else {
      setMessages((prev) => [...prev, newMessageReceived]);
    }
  });

  return () => socket.off("message-received");
}, [socket, activeChat]);


// 🔥 ChatPage.jsx ke andar ka Message Send Handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeChat) return;

    try {
      const messageToSend = typedMessage;
      setTypedMessage(""); // UI instantly clear for premium speed

      // 🔥 FIX: Route badal kar '/message/send-message' kiya aapke backend ke hisab se
      const res = await api.post("/message/send-message", {
        content: messageToSend,
        chatId: activeChat._id
      });

      // Socket ke jariye room me baki logo ko live trigger karo
      if (socket) {
        socket.emit("new-message", res.data.data || res.data);
      }
      
      // Apni screen par message instantly render karo
      setMessages((prev) => [...prev, res.data.data || res.data]);

    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };
  
  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setModalError("");
    setIsCreating(true);
    
    const result = await createGroup(newGroupName);
    setIsCreating(false);

    if (result && result.success) {
      setNewGroupName("");
      setIsModalOpen(false); 
    } else {
      setModalError(result?.message || "Something went wrong");
    }
  };

  
  return (
    <div className="h-screen w-screen bg-[#0F0F1E] text-white flex overflow-hidden font-sans relative">
      
      {/* 🧭 PANEL 1: Minimal Utility Action Bar */}
      <div className="w-16 bg-[#131324] border-r border-white/5 flex flex-col items-center justify-between py-6">
        <div className="flex flex-col gap-6 items-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold tracking-tight text-lg shadow-md">
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
          <button onClick={logout} className="p-3 text-red-400/80 hover:text-red-400 rounded-xl transition-all cursor-pointer">
            <LogOut className="h-5 w-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xs font-semibold uppercase">
            {user?.name?.substring(0, 2)}
          </div>
        </div>
      </div>

      {/* 👥 PANEL 2: Chat Stream Channel Lists */}
      <div className="w-80 bg-[#16162a]/40 backdrop-blur-md border-r border-white/5 flex flex-col">
        <div className="p-5">
          {/* 🔥 Plus Icon Button Added Next to Heading */}
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

        {/* Scrollable Conversation Stack */}
            {/* Scrollable Conversation Stack */}
<div className="flex-1 overflow-y-auto px-3 space-y-1">
  {chats && chats.map((chat) => {
    // 🔥 SAFE GUARD: Agar chat object galti se null ya undefined ho, toh render mat karo
    if (!chat) return null; 

    return (
      <div 
        key={chat._id || Math.random().toString()} // 🔥 Safe fallback for ID
        onClick={() => setActiveChat(chat)}
        className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all ${
          activeChat?._id === chat._id 
            ? "bg-indigo-500/10 border border-indigo-500/20" 
            : "hover:bg-white/5 border border-transparent"
        }`}
      >
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/10 flex items-center justify-center font-semibold text-sm uppercase">
          {chat.chatName?.substring(0, 2) || chat.name?.substring(0, 2) || "GP"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold truncate text-gray-200">
              {chat.chatName || chat.name || "Group Room"} {/* 🔥 Backend me 'chatName' use ho raha hai */}
            </h3>
            <span className="text-[10px] text-gray-500">Just Now</span>
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">Click to open chat window...</p>
        </div>
      </div>
    );
  })}
</div>
        </div>

      {/* 💬 PANEL 3: Core Messaging Canvas */}
      <div className="flex-1 bg-[#0F0F1E] flex flex-col relative">
        {activeChat ? (
          <>
            {/* Header Content Topbar */}
            <div className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-[#16162a]/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                  {activeChat.name?.substring(0, 2)}
                </div>
                <div>
                  <h2 className="text-sm font-bold">{activeChat.name}</h2>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Channel
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-gray-400">
                <button className="hover:text-white cursor-pointer"><Phone className="h-4 w-4" /></button>
                <button className="hover:text-white cursor-pointer"><Video className="h-4 w-4" /></button>
                <button className="hover:text-white cursor-pointer"><MoreVertical className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Chat Body Message Stream Grid */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, index) => {
                const isMe = msg.sender === user?._id || msg.sender?._id === user?._id;
                return (
                  <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                      isMe 
                        ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-500/10" 
                        : "bg-[#16162a] border border-white/5 text-gray-200 rounded-bl-none"
                    }`}>
                      {!isMe && <p className="text-[10px] font-bold text-indigo-400 mb-1">@{msg.sender?.name || "User"}</p>}
                      <p className="leading-relaxed">{msg.content || msg.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[9px] text-white/40">18:46</span>
                        {isMe && <CheckCheck className="h-3 w-3 text-indigo-300" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Action Textbox Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 bg-[#16162a]/20 border-t border-white/5 flex items-center gap-3">
              <button type="button" className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <Smile className="h-5 w-5" />
              </button>
              <input 
                type="text" 
                placeholder="Type your message here..." 
                className="flex-1 bg-[#131324] border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-indigo-500 transition-all text-gray-200"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
              />
              <button 
                type="submit" 
                className="bg-indigo-500 text-white p-3 rounded-xl hover:bg-indigo-600 transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03),transparent_60%)]">
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">No Chat Selected</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-xs">Select a group or conversation from the sidebar channel list to initialize streaming real-time communication.</p>
          </div>
        )}
      </div>

      {/* 🔥 DRIBBBLE INSPIRED GLASSMORPHIC POPUP MODAL */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all">
          <div className="w-full max-w-sm bg-[#16162a]/95 border border-white/10 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            
            {/* Close Button */}
            <button 
              onClick={() => { setIsModalOpen(false); setModalError(""); }}
              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-white tracking-tight">Create New Group</h3>
              <p className="text-xs text-gray-400 mt-1">Start a new dynamic workspace communication channel.</p>
            </div>

            {modalError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-2.5 rounded-xl mb-4 text-center">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Alpha Developers, Final Project"
                  className="w-full bg-[#0F0F1E] border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder-gray-600"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setModalError(""); }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-semibold shadow-lg hover:shadow-indigo-500/20 hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Create Channel"
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default ChatPage;