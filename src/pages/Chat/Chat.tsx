import React, { useEffect } from "react";
import UserSidebar from "../../components/Chat/Navbar";
import { Outlet, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hoocks";
import {
  fetchChatConversation,
  fetchConversationCurrentUser,
  fetchMessagesThunk,
  markAsRead,
  updateLastMessage,
} from "../../redux/features/chat/chatSlice";
import {
  fetChatConversation,
  fetchConversationUser,
  fetchUser,
} from "../../components/Chat/chatFonction";
import { setUser } from "../../redux/features/user/user";
import { socket } from "../../socket";
import { ChatMessage } from "../../data/typeData";
import { RootState } from "../../redux";

const ChatApp: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const chatConversations = useAppSelector((state: RootState) => state.chat.chatConversations);
  const currentUser = useAppSelector((state: RootState) => state.user.currentUser);
  const messages = useAppSelector((state: RootState) => state.chat.messages);
  const loading = useAppSelector((state: RootState) => state.chat.loading);

  useEffect(() => {
    if (!currentUser.idUser) return;
    socket.emit("userConnected", currentUser.idUser);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser.idUser) return;

    const handleNotif = ({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: ChatMessage;
    }) => {
      // même si on est pas dans la room, on met à jour Redux
      dispatch(updateLastMessage({ conversationId, message }));
      // si on veut aussi marquer comme non lu
      dispatch(
        markAsRead({
          idConversation: conversationId,
          idUser: currentUser.idUser,
          isRead: false,
        })
      );
    };

    socket.on("new_message_notification", handleNotif);

    return () => {
      socket.off("new_message_notification", handleNotif);
    };
  }, [currentUser.idUser, dispatch]);

  useEffect(() => {
    if (!currentUser?.idUser) return;

    const getDataChat = async () => {
      try {
        console.log('[Chat] Fetching chat data for user:', currentUser.idUser);
        const [chatConversation, currentConversationUser] = await Promise.all([
          fetChatConversation(currentUser.idUser),
          fetchConversationUser(currentUser.idUser),
        ]);

        if (chatConversation) {
          console.log('[Chat] Dispatching fetchChatConversation with', chatConversation.length, 'conversations');
          dispatch(fetchChatConversation(chatConversation));
        } else {
          console.warn('[Chat] No chat conversations received');
        }

        // Don't fetch users here - already done in App.tsx
        // if (user) {
        //   dispatch(setUser(user));
        // }

        if (currentConversationUser) {
          console.log('[Chat] Dispatching fetchConversationCurrentUser with', currentConversationUser.length, 'conversation users');
          dispatch(fetchConversationCurrentUser(currentConversationUser));
        } else {
          console.warn('[Chat] No conversation users received');
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    getDataChat();
  }, [currentUser?.idUser]); // Only depend on user ID to prevent repeated calls

  const isConversationSelected = /^\/chat\/[^/]+/.test(location.pathname);
  return (
    <div className="flex h-screen text-gray-800">
      <UserSidebar
        conversation={chatConversations}
        currentUserId={currentUser?.idUser || ""}
      />
      <div className="h-screen flex-1 flex flex-col">
        {isConversationSelected ? (
          <Outlet />
        ) : (
          <div className="text-center bg-white flex-1 flex flex-col items-center justify-center text-gray-500 text-lg">
            📭 Aucune conversation sélectionnée
            <br />
            <span className="text-sm text-gray-400">
              Veuillez choisir une conversation à gauche.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatApp;
