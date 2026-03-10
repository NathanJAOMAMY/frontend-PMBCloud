import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../../../data/typeData";

interface UserState {
  users: User[];
  currentUser: User;
}
const initialState: UserState = {
  users: [],
  currentUser: {
    idUser: "1",
    userName: "John",
    surname: "Doe",
    pseudo: "johndoe",
    roleUser: ["admin"],
    password: "password123",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusUser: false,
    email: "",
    responsibilities: [], // Optional responsibilities
    avatar: "", // Optional avatar URL
  },
};
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCurrentUser(state, action: PayloadAction<User>) {
      if (!action.payload) {
        console.error('[setCurrentUser] Invalid payload:', action.payload);
        return;
      }
      state.currentUser = action.payload;
    },
    setUser(state, action: PayloadAction<User[]>) {
      if (!action.payload) {
        console.error('[setUser] Invalid payload:', action.payload);
        return;
      }
      state.users = action.payload;
    },
    addUserLocal(state, action: PayloadAction<User>) {
      if (!action.payload) {
        console.error('[addUserLocal] Invalid payload:', action.payload);
        return;
      }
      const existingUser = state.users.findIndex(
        (u) => u.idUser === action.payload.idUser
      );
      if (existingUser !== -1) {
        state.users[existingUser] = action.payload;
      } else {
        state.users.push(action.payload);
      }
    },
    deletUser(state, action: PayloadAction<User>) {
      if (!action.payload) {
        console.error('[deletUser] Invalid payload:', action.payload);
        return;
      }
      state.users = state.users.filter(
        (u) => u.idUser !== action.payload.idUser
      );
    },
  },
});

export const { setCurrentUser, setUser, addUserLocal,deletUser } = userSlice.actions;
export default userSlice.reducer;
