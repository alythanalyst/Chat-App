import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { PlayCircle } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [
    selectedUser._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const playVoiceNote = (url) => {
    const audio = new Audio(url);
    audio.play().catch((e) => console.error("Error playing audio:", e));
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const senderIdString =
            message.senderId && typeof message.senderId === "object"
              ? message.senderId._id
              : message.senderId;

          const isMyMessage = senderIdString === authUser._id;

          const messageSenderProfilePic = isMyMessage
            ? authUser.profilePic
            : message.senderId &&
              typeof message.senderId === "object" &&
              message.senderId.profilePic
            ? message.senderId.profilePic
            : selectedUser.profilePic;

          return (
            <div
              key={message._id}
              className={`chat ${isMyMessage ? "chat-end" : "chat-start"}`}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={messageSenderProfilePic || "/avatar.png"}
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className="chat-bubble flex flex-col">
                {message.type === "image" && message.fileUrl && (
                  <img
                    src={message.fileUrl}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.type === "text" && message.content && (
                  <p className="m-0 p-0">{message.content}</p>
                )}
                {message.type === "voice" && message.fileUrl && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playVoiceNote(message.fileUrl)}
                      className="p-1 rounded-full bg-white text-blue-500 hover:bg-gray-100"
                    >
                      <PlayCircle size={20} />
                    </button>
                    <span className="text-sm text-gray-700">Voice Note</span>
                  </div>
                )}
                {!message.type && message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {!message.type && message.text && (
                  <p className="m-0 p-0">{message.text}</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>
      <MessageInput />
    </div>
  );
};
export default ChatContainer;
