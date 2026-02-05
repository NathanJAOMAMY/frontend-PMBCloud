import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";
import fileEmpty from "../../assets/images/file empty.jpg";
import { supabase } from "../../supabase";
import * as XLSX from "sheetjs";
import { API_BASE_URL } from "../../api";
import WordViewer from "../../components/WordViewer";
import { getFileIcon, getTypeFile } from "../../tools/fileHelpers";
import ImageWithPlaceholder from "../../components/ImageWithPlaceholder";

const SingleFile = () => {
  const [insertedFile, setInsertedFile] = useState([]);
  const [fileUrl, setFileUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [fileTypeOpen, setFileTypeOpen] = useState("");
  const [excelData, setExcelData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleRows, setVisibleRows] = useState(20);

  let params = useParams();
  const folderName = params.folder;

  const handleViewFile = async (type, url) => {
    setFileUrl(url);
    setIsOpen(true);
    setFileTypeOpen(type);

    if (type === "excel") {
      setLoading(true);
      try {
        const response = await supabase.storage
          .from("intranet")
          .download(`file/${url.split("/").pop()}`);

        // console.log(response.data);
        const arrayBuffer = await response.data.arrayBuffer();
        const dataArray = new Uint8Array(arrayBuffer);

        const workbook = XLSX.read(dataArray, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        setExcelData(json);
      } catch (err) {
        console.error("Erreur lecture Excel:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const openFile = () => {
    if (loading) {
      return (
        <p className="text-center text-blue-500">Chargement du fichier...</p>
      );
    }

    if (fileTypeOpen === "pdf") {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-full"
          title="Aperçu du fichier"
        ></iframe>
      );
    } else if (fileTypeOpen === "image") {
      return <img src={fileUrl} className="h-[400px] mx-auto" alt="" />;
    } else if (fileTypeOpen === "excel") {
      return (
        <div className="relative flex flex-col w-full h-full overflow-scroll text-gray-700 bg-white shadow-md rounded-lg bg-clip-border">
          <table className="w-full text-left table-auto min-w-max">
            <tbody>
              {excelData.slice(0, visibleRows).map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`${rowIndex === 0
                        ? "p-4 border-b border-slate-300 bg-slate-50"
                        : "p-4 border-b border-slate-200"
                        }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {visibleRows < excelData.length && (
            <div className="my-2 mx-2">
              <button
                onClick={() => setVisibleRows((prev) => prev + 20)}
                className="mt-2 px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Charger plus
              </button>
            </div>
          )}
        </div>
      );
    } else if (fileTypeOpen === "word") {
      return <WordViewer fileUrl={fileUrl} folder={folderName} loading={loading} />;
    } else {
      return (
        <p className="text-gray-500 text-center">
          Type de fichier pas encore pris en charge.
        </p>
      );
    }
  };

  const handleImageClick = (url) => {
    setFileUrl(url);
    setIsImageOpen(true);
  };

  const closeModal = () => {
    setFileUrl("");
    setIsImageOpen(false);
  };

  const getFiles = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/file/`, {
        params: {
          id: params.id,
        },
      });

      const myFile = response.data.data;
      setInsertedFile(myFile);
    } catch (error) {
      console.log(error);
    }
  }, [params.id]);

  useEffect(() => {
    getFiles();
  }, [getFiles]);

  useEffect(() => {
    console.log(fileUrl);
  }, [fileUrl]);
  return (
    <>
      {/* Modal ou Viewer */}
      {isOpen && (
        <div className="fixed  inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white overflow-auto w-3/4 h-3/4 py-14 px-4 relative">
            <button
              className="absolute top-2 right-2 text-red-500 px-2 rounded-md transition-all duration-100 hover:bg-red-500 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              Fermer
            </button>
            {openFile()}
          </div>
        </div>
      )}

      {/* Modal image avec animation */}
      <AnimatePresence>
        {isImageOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center"
            onClick={closeModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.img
              src={`${fileUrl}`}
              alt="Aperçu"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-[80vw] max-h-[80vh] rounded-md shadow-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-normal">
        <div className="mb-2">
          <p className="text-lg">{folderName}</p>
          <hr />
        </div>
        {insertedFile.length > 0 ? (
          <div className="grid lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 gap-2 justify-center items-center">
            {insertedFile.map((item, key) => {
              return (
                <div key={key} className="grid justify-between items-center">
                  <div className="flex items-center flex-col justify-center cursor-pointer">
                    {getTypeFile(item.type_file) === "image" ? (
                      <div
                        className="flex items-center justify-center w-full h-36"
                        onClick={() => handleImageClick(item.url)}
                      >
                        <ImageWithPlaceholder
                          src={`${item.url}`}
                          alt={item.libelle_file}
                        />
                      </div>
                    ) : (
                      <Icon
                        className="size-24"
                        icon={getFileIcon(item.type_file)}
                        onClick={() => handleViewFile(getTypeFile(item.type_file), item.url)}
                      />
                    )}
                    <p className="truncate w-28 mx-auto">
                      {item.libelle_file.split(".")[0]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center flex justify-center">
            <img src={fileEmpty} alt="empty folder" className="h-96" />
          </div>
        )}
      </div>
    </>
  );
};

export default SingleFile;
