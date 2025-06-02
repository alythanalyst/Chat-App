// frontend/src/pages/HomePage.jsx
import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "react-hot-toast";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const ADMIN_USER_ID_FRONTEND = "682e7db87b82ee0c1d2a99a4";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  const { onlineUsers, authUser, socket } = useAuthStore();

  const hasAdminToastShownRef = useRef(false);

  useEffect(() => {
    if (!authUser || !socket || !socket.connected) {
      console.log(
        "HomePage: AuthUser not set or socket not connected. Skipping admin online check."
      );
      return;
    }

    if (authUser._id === ADMIN_USER_ID_FRONTEND) {
      console.log("HomePage: Current user is admin, skipping toast.");
      return;
    }

    const isAdminOnline = onlineUsers.includes(ADMIN_USER_ID_FRONTEND);
    console.log(
      "HomePage: Is Admin Online?",
      isAdminOnline,
      "Toast Shown?",
      hasAdminToastShownRef.current
    );

    if (isAdminOnline && !hasAdminToastShownRef.current) {
      toast.success("Our Admin is Online right now!", {
        duration: 3000,
        position: "top-center",
      });
      hasAdminToastShownRef.current = true;
    } else if (!isAdminOnline && hasAdminToastShownRef.current) {
      hasAdminToastShownRef.current = false;
    }
  }, [onlineUsers, authUser, socket]);

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />
            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
