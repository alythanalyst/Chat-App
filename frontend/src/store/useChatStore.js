import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    if (!selectedUser) {
      toast.error("No user selected to send message to.");
      return;
    }

    let requestBody = {};
    const endpoint = `/messages/send/${selectedUser._id}`;

    if (
      messageData.type === "voice" &&
      messageData.audio instanceof ArrayBuffer
    ) {
      try {
        const uint8 = new Uint8Array(messageData.audio);
        let binaryString = "";
        uint8.forEach((byte) => {
          binaryString += String.fromCharCode(byte);
        });
        const base64Audio = btoa(binaryString);

        if (!base64Audio || base64Audio.length === 0) {
          console.error(
            "Voice note conversion resulted in empty base64 string."
          );
          toast.error("Failed to process voice note.");
          return;
        }

        requestBody = {
          fileData: `data:audio/webm;base64,${base64Audio}`,
          type: "voice",
          content: messageData.content || "Voice Note",
        };
      } catch (e) {
        console.error("Error converting audio to base64:", e);
        toast.error("Failed to prepare voice note for sending.");
        return;
      }
    } else if (
      messageData.type === "image" &&
      typeof messageData.image === "string" &&
      messageData.image.startsWith("data:image/")
    ) {
      requestBody = {
        fileData: messageData.image,
        type: "image",
        content: messageData.content || "Image",
      };
    } else if (
      messageData.type === "text" &&
      typeof messageData.text === "string" &&
      messageData.text.trim().length > 0
    ) {
      requestBody = {
        content: messageData.text.trim(),
        type: "text",
      };
    } else {
      console.warn(
        "Frontend: Attempted to send empty message or unknown type. MessageData:",
        messageData
      );
      toast.error("Nothing valid to send.");
      return;
    }

    console.log("Frontend: Sending message payload:", requestBody);

    try {
      const res = await axiosInstance.post(endpoint, requestBody);
      set((state) => ({ messages: [...state.messages, res.data] }));
      toast.success("Message sent!");
    } catch (error) {
      console.error("Frontend: Failed to send message:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to send message."
      );
      throw error;
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    if (!socket) {
      console.warn("Socket not initialized. Cannot subscribe to messages.");
      return;
    }

    socket.off("newMessage");

    console.log("Subscribing to newMessage events.");

    socket.on("newMessage", (newMessage) => {
      console.log("-------------------------------------------------");
      console.log("Received new message via socket on RECEIVER SIDE:");
      console.log("Full newMessage object:", newMessage);

      const messageSenderId =
        typeof newMessage.senderId === "object"
          ? newMessage.senderId._id
          : newMessage.senderId;
      const messageReceiverId =
        typeof newMessage.receiverId === "object"
          ? newMessage.receiverId._id
          : newMessage.receiverId;

      const currentSelectedUser = get().selectedUser;
      const currentAuthUser = useAuthStore.getState().authUser;

      console.log(
        "Extracted IDs: Sender =",
        messageSenderId,
        "Receiver =",
        messageReceiverId
      );
      console.log("Current State: selectedUser =", currentSelectedUser);
      console.log("Current State: authUser =", currentAuthUser);
      console.log(
        "Comparing to: selectedUser._id =",
        currentSelectedUser?._id,
        "authUser._id =",
        currentAuthUser?._id
      );

      const isMessageForCurrentChat =
        (currentSelectedUser &&
          currentAuthUser &&
          messageSenderId === currentSelectedUser._id &&
          messageReceiverId === currentAuthUser._id) ||
        (currentSelectedUser &&
          currentAuthUser &&
          messageSenderId === currentAuthUser._id &&
          messageReceiverId === currentSelectedUser._id);

      console.log(
        "isMessageForCurrentChat evaluates to:",
        isMessageForCurrentChat
      );

      if (isMessageForCurrentChat) {
        console.log(
          "Message is for current chat. Adding to messages state for receiver."
        );
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
        console.log("Messages array after update:", get().messages.length);
      } else {
        console.log(
          "Message is NOT for current chat for receiver. Not adding."
        );
      }
      console.log("-------------------------------------------------");
    });

    socket.on("getOnlineUsers", (onlineUsers) => {
      const setOnlineUsers = useAuthStore.getState().setOnlineUsers;
      if (typeof setOnlineUsers === "function") {
        setOnlineUsers(onlineUsers);
      } else {
        console.warn(
          "setOnlineUsers function not found in useAuthStore. Skipping online users update."
        );
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("getOnlineUsers");
      console.log("Unsubscribed from newMessage and getOnlineUsers events.");
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
