import axios from "axios";
import {  User } from "../../data/typeData";
import { API_BASE_URL, apiRequest } from "../../api";

// CREATE
export const onAddService = async (
  nameAdd: string,
  params: User
): Promise<"success" | "error"> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/${nameAdd.toLowerCase()}`, params);
    return response.status >= 200 && response.status < 300 ? "success" : "error";
  } catch (error) {
    console.error(error);
    return "error";
  }
};

// UPDATE
export const onUpdateService = async (
  nameUpdate: string,
  params: User
): Promise<"success" | "error"> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${nameUpdate.toLowerCase()}/${params.idUser}`, params);
    return response.status >= 200 && response.status < 300 ? "success" : "error";
  } catch (error) {
    console.log(error);
    return "error";
  }
};

// GET (all)
export const onGetService = async <T>(endPoint: string): Promise<T[]> => {
  try {
    const response = await axios.get<T[]>(`${API_BASE_URL}/${endPoint.toLowerCase()}`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la requête GET", error);
    return [];
  }
};
// GET (one by id)
export const onGetByIdService = async <T>(endPoint: string, id: string): Promise<T | null> => {
  try {
    const response = await apiRequest<T>({
      method: 'GET',
      url: `${API_BASE_URL}/${endPoint.toLowerCase()}/${id}`
    });
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la requête GET by ID", error);
    return null;
  }
};

// DELETE
export const onDeleteService = async (nameDelete: string, id: string): Promise<"success" | "error"> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${nameDelete.toLowerCase()}/${id}`);
    return response.status >= 200 && response.status < 300 ? "success" : "error";
  } catch (error) {
    console.error(error);
    return "error";
  }
};
