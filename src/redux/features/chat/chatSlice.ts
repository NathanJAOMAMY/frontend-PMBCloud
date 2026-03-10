import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import type {
  ChatConversation,
  ConversationUser,
  ChatMessage as ChatMessageType,
} from "../../../data/typeData";
import {
  fetchMessages,
  sendMessage,
  setAsRead,
  setChatConversation,
  setConversationUser,
} from "../../../components/Chat/chatFonction";

export const fetchMessagesThunk = createAsyncThunk<
  { conversationId: string; messages: ChatMessageType[] },
  string
>("chat/fetchMessages", async (conversationId, { rejectWithValue }) => {
  try {
    const messages = await fetchMessages(conversationId);
    return { conversationId, messages };
  } catch (err) {
    return rejectWithValue("Erreur chargement messages");
  }
});

// Exemple : envoyer un message
export const sendMessageThunk = createAsyncThunk<
  ChatMessageType,
  { message: ChatMessageType; receiverId?: string }
>("chat/sendMessage", async ({ message, receiverId }, { rejectWithValue }) => {
  try {
    await sendMessage(message);
    return message;
  } catch (err) {
    return rejectWithValue("Erreur envoi message");
  }
});

interface ChatState {
  chatConversations: ChatConversation[];
  conversationUser: ConversationUser[]; // lecture par user+conversation
  messages: Record<string, ChatMessageType[]>; // par conversationId
  currentConversationId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  chatConversations: [],
  conversationUser: [],
  messages: {},
  currentConversationId: null,
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setCurrentConversation(state, action: PayloadAction<string | null>) {
      state.currentConversationId = action.payload;
      if (action.payload) {
        // marquer comme lu localement
        const idx = state.conversationUser.findIndex(
          (cu) => cu.idConversation === action.payload
        );
        if (idx !== -1) {
          state.conversationUser[idx].isRead = true;
        }
      }
    },

    markAsRead(
      state,
      action: PayloadAction<{
        idConversation: string;
        idUser: string;
        isRead: boolean;
      }>
    ) {
      const { idConversation, idUser, isRead } = action.payload;
      const idx = state.conversationUser.findIndex(
        (cu) => cu.idConversation === idConversation && cu.idUser === idUser
      );
      if (idx !== -1) {
        state.conversationUser[idx].isRead = isRead;
      }
      setAsRead(idConversation, isRead, idUser);
    },

    addConversation(state, action: PayloadAction<ChatConversation>) {
      const existingConv = state.chatConversations.find(
        (c) => c.id === action.payload.id
      );

      if (!existingConv) {
        // Si la conversation n'existe pas → on l'ajoute
        setChatConversation(action.payload);
        state.chatConversations.unshift(action.payload);
      } else {
        // Si elle existe → mise à jour des membres
        const newMembers = action.payload.userIdConversations || [];
        const currentMembers = existingConv.userIdConversations || [];
        const newName = action.payload.name;

        // On ajoute uniquement les nouveaux sans doublons
        const mergedMembers = Array.from(
          new Set([...currentMembers, ...newMembers])
        );

        existingConv.userIdConversations = mergedMembers;
        existingConv.name = newName;
        if (action.payload.icon) {
          const newIcon = action.payload.icon;
          existingConv.icon = newIcon;
        }
      }
    },

    addConversationUser(
      state,
      action: PayloadAction<{
        idConversation: string;
        idUser: string;
        isRead: boolean;
        idCurrentUser?: string;
      }>
    ) {
      const { idConversation, idUser, isRead } = action.payload;
      const exists = state.conversationUser.find(
        (cu) => cu.idConversation === idConversation && cu.idUser === idUser
      );
      if (!exists) {
        setConversationUser(idConversation, idUser, isRead);
        state.conversationUser.push({ idConversation, idUser, isRead });
      }
    },

    // Ajouter localement un message (ex: reçu via socket)
    addMessage(
      state,
      action: PayloadAction<{
        conversationId: string;
        message: ChatMessageType;
      }>
    ) {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(message);
    },

    // Réinitialiser les messages d'une conversation (ex : reload)
    setMessages(
      state,
      action: PayloadAction<{
        conversationId: string;
        messages: ChatMessageType[];
      }>
    ) {
      state.messages[action.payload.conversationId] = action.payload.messages;
    },

    setConversations(state, action: PayloadAction<ChatConversation[]>) {
      state.chatConversations = action.payload;
    },

    setConversationUserList(state, action: PayloadAction<ConversationUser[]>) {
      state.conversationUser = action.payload;
    },

    clearUnread(
      state,
      action: PayloadAction<{ conversationId: string; idUser: string }>
    ) {
      const { conversationId, idUser } = action.payload;
      const idx = state.conversationUser.findIndex(
        (cu) => cu.idConversation === conversationId && cu.idUser === idUser
      );
      if (idx !== -1) {
        state.conversationUser[idx].isRead = true;
      }
    },
    fetchConversationCurrentUser(
      state,
      action: PayloadAction<ConversationUser[]>
    ) {
      state.conversationUser = action.payload;
    },
    fetchChatConversation(state, action: PayloadAction<ChatConversation[]>) {
      state.chatConversations = action.payload;
    },
    updateLastMessage(
      state,
      action: PayloadAction<{
        conversationId: string;
        message: ChatMessageType;
      }>
    ) {
      const { conversationId, message } = action.payload;
      const conv = state.chatConversations.find((c) => c.id === conversationId);
      if (!state.messages[conversationId]) state.messages[conversationId] = [];
      if (conv) {
        conv.lastMessage = message;
        state.messages[conversationId].push(action.payload.message);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessagesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessagesThunk.fulfilled, (state, action) => {
        state.loading = false;
        // Safety check: only update if payload exists
        if (action.payload?.conversationId && action.payload?.messages) {
          state.messages[action.payload.conversationId] = action.payload.messages;
        } else {
          state.error = "Invalid payload received from fetchMessages";
        }
      })
      .addCase(fetchMessagesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(sendMessageThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(sendMessageThunk.fulfilled, (state, action) => {
        const convId = action.payload.conversationId;
        if (!state.messages[convId]) state.messages[convId] = [];
        state.messages[convId].push(action.payload);
      })
      .addCase(sendMessageThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentConversation,
  markAsRead,
  addConversation,
  addConversationUser,
  addMessage,
  setMessages,
  setConversations,
  setConversationUserList,
  clearUnread,
  fetchChatConversation,
  fetchConversationCurrentUser,
  updateLastMessage,
} = chatSlice.actions;

export default chatSlice.reducer;

// Sélecteur : est-ce non lu pour un user
export const selectIsConversationUnread = (
  state: { chat: ChatState },
  conversationId: string,
  userId: string
) => {
  const cu = state.chat.conversationUser.find(
    (c) => c.idConversation === conversationId && c.idUser === userId
  );
  return cu ? !cu.isRead : false;
};
