import { createContext, useContext, useState, useEffect } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import api from "../api/axios";

const ChatContext = createContext();

const safeArray = (...candidates) => {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

export const ChatProvider = ({ children }) => {
  const { accessToken, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  
  // 🔥 Live typing status state tracking
  const [typingUser, setTypingUser] = useState(null); 

  // 🔌 Socket Connection Initialization
  useEffect(() => {
    if (!accessToken || !user) return;

    const newSocket = io("http://localhost:8000", {
      auth: { token: accessToken },
      withCredentials: true,
      transports: ["websocket"],
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [accessToken, user]);

  // 📥 Global Sockets Message & Typing Event Listeners
  useEffect(() => {
    if (!socket) return;

    // A. Live Message Handler
    const handleMessageReceived = (newMessageReceived) => {
      const incomingChatId = 
        newMessageReceived?.chatId?._id || 
        newMessageReceived?.chatId || 
        newMessageReceived?.chat?._id || 
        newMessageReceived?.chat;

      if (!incomingChatId) return;

      setActiveChat((currentActiveChat) => {
        if (currentActiveChat && currentActiveChat._id.toString() === incomingChatId.toString()) {
          setMessages((prev) => {
            const isDuplicate = prev.some((m) => m._id === newMessageReceived._id);
            if (isDuplicate) return prev;
            return [...prev, newMessageReceived];
          });
        }
        return currentActiveChat;
      });
    };

    // ⌨️ B. Typing Started Handler
    const handleTypingReceived = ({ chatId, userId, userName }) => {
      setActiveChat((currentActiveChat) => {
        if (currentActiveChat && currentActiveChat._id.toString() === chatId.toString()) {
          setTypingUser({ userId, userName });
        }
        return currentActiveChat;
      });
    };

    // ⌨️ C. Typing Stopped Handler
    const handleStopTypingReceived = ({ chatId }) => {
      setActiveChat((currentActiveChat) => {
        if (currentActiveChat && currentActiveChat._id.toString() === chatId.toString()) {
          setTypingUser(null);
        }
        return currentActiveChat;
      });
    };

    socket.on("message-received", handleMessageReceived);
    socket.on("typing-received", handleTypingReceived);
    socket.on("stop-typing-received", handleStopTypingReceived);

    return () => {
      socket.off("message-received", handleMessageReceived);
      socket.off("typing-received", handleTypingReceived);
      socket.off("stop-typing-received", handleStopTypingReceived);
    };
  }, [socket]);

  // 🚪 Active Chat Badalne Par Socket Room Join Karo
  useEffect(() => {
    if (!socket || !activeChat) return;

    socket.emit("join-chat", activeChat._id);
    fetchMessages(activeChat._id);
    setTypingUser(null); // Chat badalte hi purana status clear
  }, [activeChat, socket]);

  // 📨 Fetch All Chats List
  const fetchChats = async () => {
    try {
      const res = await api.get("/chat/get-chats");
      setChats(safeArray(res.data?.chats, res.data?.data));
    } catch (err) {
      console.error("Error fetching chats:", err);
      setChats([]);
    }
  };

  // 📝 Fetch Messages for Active Chat
  const fetchMessages = async (chatId) => {
    setMessagesLoading(true);
    try {
      const res = await api.get(`/message/get-messages/${chatId}`);
      setMessages(safeArray(res.data?.messages, res.data?.data, res.data));
    } catch (err) {
      console.error("Error fetching messages:", err);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  // 📨 Send Message Function
  const sendMessage = async (content, chatId) => {
    const localMessage = {
      _id: `local-${Date.now()}`,
      content,
      sender: user,
      chatId: chatId,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, localMessage]);

    if (socket) {
      socket.emit("new-message", localMessage);
    }

    try {
      const formData = new FormData();
      formData.append("chatId", chatId);
      formData.append("content", content);
      formData.append("messageType", "text");

      const res = await api.post("/message/send-message", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const savedMessage = res.data?.data ?? res.data;

      setMessages((prev) =>
        prev.map((m) => (m._id === localMessage._id ? savedMessage : m))
      );

      return { success: true, message: savedMessage };
    } catch (err) {
      console.error("Error in context sendMessage:", err);
      setMessages((prev) => prev.filter((m) => m._id !== localMessage._id));
      return { success: false, message: "Failed to send message" };
    }
  };

  // 👥 Create Group Channel
  const createGroup = async (groupName, selectedUsers = []) => {
    try {
      const payload = { groupName, users: selectedUsers };
      const res = await api.post("/chat/create-chat", payload);

      if (res.status === 201 || res.status === 200 || res.data?.success) {
        await fetchChats();
        return { success: true, data: res.data };
      }
      return { success: false, message: "Failed to create group" };
    } catch (err) {
      console.error("Error creating chat:", err);
      return { success: false, message: "Failed to create group" };
    }
  };

  return (
    <ChatContext.Provider
      value={{
        socket,
        chats,
        setChats,
        activeChat,
        setActiveChat,
        messages,
        setMessages,
        messagesLoading,
        typingUser, // 👈 Export kiya panel layout sync ke liye
        fetchChats,
        fetchMessages,
        sendMessage,
        createGroup,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);