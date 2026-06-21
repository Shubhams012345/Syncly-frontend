import { createContext, useContext, useState, useEffect } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import api from "../api/axios";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { accessToken, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);

  // 🔌 Socket Connection Initialization
  useEffect(() => {
    if (!accessToken || !user) return;

    const newSocket = io("http://localhost:8000", {
      auth: { token: accessToken },
      withCredentials: true,
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [accessToken, user]);

  // 🚪 Active Chat Badalne Par Socket Room Join Karo
  useEffect(() => {
    if (!socket || !activeChat) return;

    // Backend par 'join-chat' ya 'joinRoom' event trigger karo
    socket.emit("join-chat", activeChat._id);
    
    // Purane messages load karo
    fetchMessages(activeChat._id);

  }, [activeChat, socket]);

  // 📨 Fetch All Chats List
  const fetchChats = async () => {
    try {
      const res = await api.get("/chat/get-chats");
      setChats(res.data.chats || res.data.data || []);
    } catch (err) {
      console.error("Error fetching chats:", err);
    }
  };

 
  const fetchMessages = async (chatId) => {
    try {
      const res = await api.get(`/message/get-messages/${chatId}`);
      
      setMessages(res.data.messages || res.data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setMessages([]); 
    }
  };

  // ➕ Create Group
  const createGroup = async (groupName) => {
    try {
      const payload = {
        groupName: groupName,
        users: ["65c1a2b3c4d5e6f7a8b9c0d1", "65c1a2b3c4d5e6f7a8b9c0d2"] 
      };
      const res = await api.post("/chat/create-chat", payload);
      if (res.data && res.data.success) {
        await fetchChats();
        return { success: true };
      }
    } catch (err) {
      console.error("Error creating chat:", err);
      return { success: false, message: err.response?.data?.message };
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
        fetchChats,
        fetchMessages,
        createGroup
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);