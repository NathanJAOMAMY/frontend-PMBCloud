import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import ModalDialoge from "./UI/ModalDialoge";

export default function PostMenu({ onEdit, post, isOwner, onDeleteSuccess }) {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) 
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  if (!isOwner) return null;
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen((v) => !v)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}>⋯</button>
      {open && (
        <div className="post-menu-dropdown" >
          <button onClick={() => { setOpen(false); onEdit(); }} >Modifier</button>
          <button onClick={() => { setOpen(false); setShowModal(true); }} style={{color: "red"}}>Supprimer</button>
        </div>
      )}
      {showModal && (
        <ModalDialoge
         title="Supprimer la publication"
          type="Post"
          action="delete"
          content={post}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            if (onDeleteSuccess) onDeleteSuccess();
          }}
        />
      )}
    </div>
  );
}

PostMenu.propTypes = {
  onEdit: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired,
  isOwner: PropTypes.bool.isRequired,
  onDeleteSuccess: PropTypes.func.isRequired,
};