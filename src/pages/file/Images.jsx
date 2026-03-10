import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from "../../api";
import { AnimatePresence, motion } from "framer-motion";

const Images = () => {
  const [images, setImages] = useState([])
  const [fileUrl, setFileUrl] = useState("");
  const [isImageOpen, setIsImageOpen] = useState(false);

  const handleImageClick = (url) => {
    setFileUrl(url);
    setIsImageOpen(true)
  };

  const closeModal = () => {
    setFileUrl("");
    setIsImageOpen(false)
  };


  const getImages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/file`)

      const myFile = response.data.data;
      console.log('Fetched files:', myFile);

      const f = myFile.filter((file) => file.type_file.indexOf('jpg') > -1 || file.type_file.indexOf('png') > -1 || file.type_file.indexOf('jpeg') > -1)

      setImages(f)
    } catch (error) {
      console.log(error);
    }

  }

  useEffect(() => {
    getImages()
  }, [])

  useEffect(() => {
    console.log('Images fetched:', images);

  }, [images])
  return (

    <>
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
      <div>
        <p className='mb-2 text-lg'> My images</p>
        <hr />
        <div className='list-images mt-4 grid grid-cols-6 gap-2'>
          {images.map((item, index) => (
            <img key={index} className='h-full w-full cursor-pointer' src={`${item.url}`} onClick={() => handleImageClick(item.url)} />
          ))}
        </div>
      </div>
    </>
  );
};

export default Images;