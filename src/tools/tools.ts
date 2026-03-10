import { supabase } from "../supabase";
import { v4 as uuid } from "uuid";
import { User } from "../data/typeData";
import axios from "axios";
import { API_BASE_URL } from "../api";
import fileDownload from "js-file-download";

const userVoid: User = {
  idUser: "",
  userName: "Inconnu",
  surname: "Inconnu",
  pseudo: "",
  password: "",
  email: "",
  responsibilities: [],
  statusUser: true,
  roleUser: ["admin"],
  createdAt: "",
  updatedAt: "",
  avatar: "",
};
export const uploadFile = async (
  file: File,
  uploadTo: string
): Promise<string | undefined> => {
  if (!file) return undefined;

  try {

  const fileExt = file.name.split(".").pop();
  const filePath = `${uploadTo}/${uuid()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("intranet")
    .upload(filePath, file, {
      cacheControl: "1500",
      upsert: false, // empêche l’écrasement si le fichier existe déjà
    });

  if (error) {
    console.error("Erreur lors de l'upload :", error.message);
    return undefined;
  }

  const { data: urlData } = supabase.storage
    .from("intranet")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
  } catch (error) {
    console.error("[uploadFile] Supabase error:", error);
    return undefined;
  }
};

export const deleteFile = async (fileUrl: string) => {
  if (!fileUrl) return false;

  try {
    // Extraire le chemin relatif du fichier dans le bucket
    const baseUrl =
      "https://mxbzfekwbvybtxlutkpz.supabase.co/storage/v1/object/public/intranet/";
    const filePath = fileUrl.replace(baseUrl, "");

    if (!filePath) return false;

    const { data, error } = await supabase.storage
      .from("intranet")
      .remove([filePath]);

    if (error) {
      console.error("Erreur suppression fichier :", error.message);
      return false;
    }

    // console.log("Fichier supprimé avec succès :", data);
    return true;
  } catch (err) {
    console.error("Erreur deleteFile :", err);
    return false;
  }
};

export const updateFile = async (id: string, name: string) => {
  try {
    let response = await axios.put(`${API_BASE_URL}/file/update`, {
      id,
      newFileName: name,
    });
    if (response.data.status === 201) {
      return true;
    } else return false;
  } catch (err) {
    console.log(err);
    return false;
  }
};
export const updateFolder = async (id: string, name: string) => {
  try {
    await axios.put(`${API_BASE_URL}/folder/update`, {
      id,
      newFolderName: name,
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const downloadFile = async (url: string, filename: string) => {
  const response = await fetch(url);
  const blob = await response.blob();

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl); // nettoyage
};

export const downloadFolder = async (folderId: string, folderName: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/download-folder/${folderName}`,
      {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          const total = progressEvent.total as number;
          const current = progressEvent.loaded;
          const percentCompleted = Math.floor((current / total) * 100);
          console.log(percentCompleted);
        },
      }
    );

    fileDownload(response.data, `${folderName}.zip`);
  } catch (error) {
    console.error("Erreur de téléchargement", error);
  }
};
export const findeUser = (idUser: string, allUsers: User[]) => {
  let userFinded = allUsers.find((u) => u.idUser === idUser);
  return userFinded ? userFinded : userVoid;
};
export const removeFolder = async (id: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/folder/${id}`);
    // response.data
  } catch (error) {
    console.log(error);
  }
};

export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    throw new Error("Date invalide !");
  }

  let formatted = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

  // formatted = formatted.replace(".", "");

  return formatted;
};
