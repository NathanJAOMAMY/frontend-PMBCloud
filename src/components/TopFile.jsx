import React, { useState } from 'react';
import logo from '../assets/images/logo-pmbcloud.png';
import { Icon } from "@iconify/react";
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import ProfileModal from './Profile';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { useDispatch } from 'react-redux';
import { setCurrentUser } from '../redux/features/user/user';
import { AnimatePresence } from 'framer-motion';
import { FiEdit, FiLogOut, FiSearch, FiXCircle } from 'react-icons/fi';

const TopFile = () => {
  const localStoreUser = localStorage.getItem('userInfo') || null;
  const userInfo = JSON.parse(localStoreUser);
  const [infoClient, setInfoClient] = useState(false);
  const dispatch = useDispatch();

  const { logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(userInfo || {
    idUser: "1",
    userName: "John",
    surname: "Doe",
    pseudo: "johndoe",
    role: "admin",
    password: "password123",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusUser: false,
  });

  const updateUser = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
    localStorage.setItem('userInfo', JSON.stringify({ ...userInfo, ...updatedUser }));
    axios.put(`${API_BASE_URL}/users/${userInfo.idUser}`, { ...userInfo, ...updatedUser });
    dispatch(setCurrentUser({ ...userInfo, ...updatedUser }));
  };

  return (
    <div className="">
      <div className="flex items-center px-10 py-2 justify-between">
        {/* Logo */}
        <div>
          <img src={logo} className="w-[150px] h-auto" alt="Logo" />
        </div>

        {/* Search Field */}
          {/* <div className="w-[40%] relative text-gray-800">
            <input
              type="text"
              placeholder="Rechercher ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-3 pr-10 border-2 border-primary bg-white rounded-lg text-sm outline-none focus:border-primary"
            />
            <AnimatePresence>
              {searchTerm && (
                <motion.div
                  key="close-icon"
                  initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                  transition={{ duration: 0.25 }}
                  className="absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => setSearchTerm("")} // Efface le champ
                >
                  <FiXCircle size={18} className="text-primary hover:text-gray-800 transition-colors" />
                </motion.div>
              )}
            </AnimatePresence>
            <FiSearch
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
              size={18}
            />
          </div> */}

        {/* User & Notifications */}
        <div className="relative flex items-center gap-4">
          <Icon
            icon="tdesign:notification"
            className="text-gray-600 text-2xl cursor-pointer hover:text-primary transition-colors"
          />

          {/* Avatar */}
          <div
            onClick={() => setInfoClient(!infoClient)}
            className="w-10 h-10 rounded-full overflow-hidden cursor-pointer hover:scale-105 transition-transform"
          >
            {userInfo.avatar ? (
              <img src={userInfo.avatar} className="w-full h-full object-cover" alt="profil" />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center font-bold text-lg text-white">
                {userInfo.userName[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          {
            infoClient && (<div className="fixed inset-0 z-10" onClick={() => setInfoClient(!infoClient)}></div>)
          }
          {/* Dropdown Menu */}
          <AnimatePresence>
            {infoClient && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute flex flex-col cursor-pointer right-0 top-14 w-60 text-gray-800 bg-white rounded-xl shadow-lg p-4 z-50"
              >
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full editable flex flex-col items-center gap-3 p-2 rounded-lg transition "
                >
                  <div className="w-25 h-25 rounded-full overflow-hidden">
                    {userInfo.avatar ? (
                      <img src={userInfo.avatar} className="w-full h-full object-cover" alt="profil" />
                    ) : (
                      <div className="w-full h-full bg-primary flex items-center justify-center font-bold text-lg text-white">
                        {userInfo.userName[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Bonjour {userInfo.userName}</p>
                    <p className="text-xs text-gray-500">{userInfo.role}</p>
                  </div>
                  <div className='flex gap-2 items-center bg-primary text-white px-4 py-2 rounded'>
                    <FiEdit></FiEdit>
                    <span>Modifier Profile</span>
                  </div>
                </button>
                <button
                  onClick={logout}
                  className="border border-primary text-primary rounded self-center cursor-pointer flex gap-2 hover:bg-black/5 items-center px-4 py-2 transition"
                >
                  <FiLogOut></FiLogOut>
                  <span>Se déconnecter</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {showModal && (
            <ProfileModal
              user={user}
              onClose={() => setShowModal(false)}
              onUpdate={updateUser}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TopFile;
