import { API_BASE_URL } from "../../api";
import {
  ChatConversation,
  ChatMessage,
  ConversationUser,
  User,
} from "../../data/typeData";
import axios, { AxiosResponse } from "axios";

export const sendMessage = async (message: ChatMessage) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/chat/send`, message);
    if (response.status === 201) {
      // console.log(response.data);
    }
  } catch (error) {
    console.log(error);
  }
};
export const setChatConversation = async (
  chatConversation: ChatConversation
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/chat/setChatConversation`,
      chatConversation
    );
    if (response.status === 201) {
      // console.log(response.data);
    }
  } catch (error) {
    console.log(error);
  }
};
export const setConversationUser = async (
  idConversation: string,
  idUser: string,
  isRead: boolean
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/chat/setConversationUser`,
      {
        idConversation,
        idUser,
        isRead,
      }
    );
    if (response.status === 201) {
      // console.log("Conversation user set successfully");
    }
  } catch (error) {
    console.log(error);
  }
};
export const fetChatConversation = async (idUser: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/chat/getChatConvesation/${idUser}`
    );
    return response.data as ChatConversation[];
  } catch (error) {
    console.log(error);
    return [];
  }
};
export const fetchMessages = async (idConversation: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/chat/get/${idConversation}`
    );
    return response.data as ChatMessage[];
  } catch (error) {
    console.log(error);
    return [];
  }
};
export const fetchConversation = async (
  idConversation: string,
  idUser: string
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/chat/get/${idConversation}/${idUser}`
    );
    return response.data as ChatConversation[];
  } catch (error) {
    console.log(error);
    return [];
  }
};
export const fetchConversationUser = async (idUser: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/chat/getConversationUsers/${idUser}`
    );
    return response.data as ConversationUser[];
  } catch (error) {
    console.log(error);
    return [];
  }
};
export const findConversationUser = async(idUser :string, idConversation : string )=>{
  try{
    const response = await axios.get(`${API_BASE_URL}/chat/findConversationUser/${idConversation}/${idUser}`);
    return response.data as ConversationUser;
  }
  catch(error){
    console.log(error);
    return null;
  }
}
export const fetchUser = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/allUser`);
    if (response.status === 200 && Array.isArray(response.data)) {
      return response.data as User[];
    } else {
      console.warn('[fetchUser] Invalid response format:', response.data);
      return [];
    }
  } catch (error) {
    console.error('[fetchUser] Failed to fetch users:', error instanceof Error ? error.message : error);
    return [];
  }
};
export const setAsRead = async (
  idConversation: string,
  isRead: boolean,
  idUser?: string
) => {
  try {
    let response: AxiosResponse<any, any>;
    if (idUser) {
      response = await axios.put(
        `${API_BASE_URL}/chat/updateConversationUser`,
        {
          idConversation,
          idUser,
          isRead: isRead,
        }
      );
    } else {
      response = await axios.put(
        `${API_BASE_URL}/chat/updateConversationUser`,
        {
          idConversation,
          isRead: isRead,
        }
      );
    }
    if (response.status === 200) {
      // console.log("Conversation marked as read");
    }
  } catch (error) {
    console.error("Error marking conversation as read:", error);
  }
};
export const updatedConversation = async (
  idConversation: string,
  userIds?: string[],
  conversation?: ChatConversation
) => {
  try {
    let response;

    if (userIds) {
      // Mise à jour uniquement des membres
      response = await axios.put(`${API_BASE_URL}/chat/updatedConversation`, {
        conversationId: idConversation,
        userIds,
      });
    } 
    else if (conversation) {
      // Mise à jour uniquement des infos de conversation
      response = await axios.put(`${API_BASE_URL}/chat/updatedConversation`, {
        conversationId: idConversation,
        conversation,
      });
    } 
    else {
      console.warn("Aucune donnée à mettre à jour.");
      return null;
    }

    return response.data as ChatConversation;
  } catch (err) {
    console.error("Erreur update conversation:", err);
    return null;
  }
};

