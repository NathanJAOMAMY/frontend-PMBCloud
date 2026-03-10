import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiImage, FiPaperclip, FiVideo, FiEdit3, FiLink } from 'react-icons/fi';
import { createPost} from '../../api/socialApi';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
// import { RootState } from '../../redux';
// import { useAuth } from '../../context/AuthContext';


const NewsForm = ({ onNewPost, user, editMode = false, initialData = null, onUpdatePost }) => {
  const [showModal, setShowModal] = useState(editMode);
  // const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [video, setVideo] = useState(null);
  const [links, setLinks] = useState([]);
  const [showArticleEditor, setShowArticleEditor] = useState(false);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [currentLink, setCurrentLink] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = useSelector((state) => state.user.currentUser);

    // Remplir les champs si édition
  useEffect(() => {
    if (editMode && initialData) {
      setShowModal(true);
      setContent(initialData.content || '');
      setArticleContent(initialData.content || '');
      setArticleTitle(initialData.articleTitle || '');
      setLinks(initialData.links?.map(l => l.url || l) || []);
      setImages([]); // Les anciens fichiers sont gérés à part
      setFiles([]);
      setVideo(null);
      setShowArticleEditor(initialData.isArticle || false);
    }
  }, [editMode, initialData]);

  // const user = useSelector((state : RootState) => state.user.currentUser);
  const handleContentChange = (e) => setContent(e.target.value);
  const handleArticleTitleChange = (e) => setArticleTitle(e.target.value);
  const handleArticleContentChange = (e) => setArticleContent(e.target.value);

  const handleImageChange = (e) => {
    images.push(...Array.from(e.target.files));
    setImages([...images]);
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleFileChange = (e) => {
    files.push(...Array.from(e.target.files));
    setFiles([...files]);
  };

  const handleVideoChange = (e) => {
    const selected = e.target.files[0];
    setVideo(selected);
  };

  const handleAddLink = () => {
    if (currentLink.trim()) {
      setLinks([...links, currentLink.trim()]);
      setCurrentLink('');
    }
  };

  const handleRemoveLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleOpenArticleEditor = () => setShowArticleEditor(true);
  const handleCloseArticleEditor = () => setShowArticleEditor(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const hasContent = showArticleEditor ? articleContent.trim() : content.trim();
    const hasFiles = images.length > 0 || files.length > 0 || video;

    if (!hasContent && !hasFiles) {
      toast.warn("Veuillez écrire un texte ou ajouter un média.");
      setIsSubmitting(false);
      return;
    }

    try {
      const postData = {
        content: showArticleEditor ? articleContent : content,
        isArticle: showArticleEditor,
        files: [...images, ...files, ...(video ? [video] : [])],
        links,
        idUser : currentUser.idUser
      };

      if (showArticleEditor) {
        postData.articleTitle = articleTitle;
      }

      if (editMode && initialData) {
        // Appel API de modification
        await onUpdatePost(postData, initialData._id);
      } else {
        // Création
        const newPost = await createPost(postData);
        onNewPost(newPost);
      }

      // Reset form
      setContent('');
      setArticleContent('');
      setArticleTitle('');
      setImages([]);
      setFiles([]);
      setVideo(null);
      setLinks([]);
      setShowModal(false);
      setShowArticleEditor(false);
    } catch (error) {
      console.error("Erreur lors de la publication:", error);
      toast.error(error.message || "Une erreur est survenue lors de la publication");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArticleSubmit = (e) => {
    e.preventDefault();
    handleSubmit(e);
  };

  return (
    <div className="news-form">
      <div className="post-composer-header">
        <div className="user-avatar-mini">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" style={{width: '100%', borderRadius: '50%'}} />
          ) : (
            <span>{user?.userName?.charAt(0) || 'A'}</span>
          )}
        </div>
        <div 
          className="open-post-modal with-avatar" 
          onClick={() => setShowModal(true)}
        >
          Exprimer vous...
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="user-avatar-mini">
                {user?.avatar ? (
                  <img src={user.avatar} alt="avatar" style={{width: '100%', borderRadius: '50%'}} />
                ) : (
                  <span>{user?.userName?.charAt(0) || 'A'}</span>
                )}
              </div>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setShowArticleEditor(false);
                }} 
                className="modal-close-btn"
              >
                ×
              </button>
            </div>

            <form onSubmit={showArticleEditor ? handleArticleSubmit : handleSubmit}>
              {showArticleEditor ? (
                <>
                  <input
                    className="news-article-title"
                    placeholder="Titre de l'article"
                    value={articleTitle}
                    onChange={handleArticleTitleChange}
                    required
                  />
                  <textarea
                    className="news-article-textarea"
                    placeholder="Votre article..."
                    rows={8}
                    value={articleContent}
                    onChange={handleArticleContentChange}
                    required
                  />
                </>
              ) : (
                <textarea
                  className="news-form-textarea"
                  placeholder="Exprimer vous"
                  rows={3}
                  value={content}
                  onChange={handleContentChange}
                />
              )}

              {links.length > 0 && (
                <div className="links-preview">
                  <h4>Liens ajoutés:</h4>
                  <ul>
                    {links.map((link, idx) => (
                      <li key={idx}>
                        <a href={link.startsWith('http') ? link : `https://${link}`} 
                           target="_blank" 
                           rel="noopener noreferrer">
                          {link}
                        </a>
                        <button type="button" onClick={() => handleRemoveLink(idx)}>
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {showLinkInput && (
                <div className="add-link-container">
                  <input
                    type="text"
                    placeholder="Ajouter un lien (URL)"
                    value={currentLink}
                    onChange={(e) => setCurrentLink(e.target.value)}
                    className="link-input"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddLink}
                    className="add-link-btn"
                  >
                    Ajouter
                  </button>
                </div>
              )}

              <div className="news-form-actions">
                {!showArticleEditor && (
                  <>
                    <label className="news-form-action">
                      <FiVideo size={20} />
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoChange}
                        hidden
                      />
                    </label>
                    <label className="news-form-action">
                      <FiImage size={22} />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        hidden
                      />
                    </label>
                    <label className="news-form-action">
                      <FiPaperclip size={20} />
                      <input
                        type="file"
                        accept=".txt,.rtf,.doc,.docx,.odt,.pdf,.ppt,.pptx,.odp,.xls,.xlsx,.ods,.csv/*"
                        multiple
                        onChange={handleFileChange}
                        className="news-form-file"
                        hidden
                      />
                    </label>
                    <div 
                      className="news-form-action"
                      onClick={() => setShowLinkInput(!showLinkInput)}
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => e.key === 'Enter' && setShowLinkInput(!showLinkInput)}
                    >
                      <FiLink size={20} />
                    </div>
                  </>
                )}

                <button 
                  type="button" 
                  onClick={showArticleEditor ? handleCloseArticleEditor : handleOpenArticleEditor}
                  className="write-article-btn"
                >
                  <FiEdit3 size={18} />
                  {showArticleEditor ? 'Annuler' : 'Rédiger un article'}
                </button>
                
                <button 
                  type="submit" 
                  className="news-form-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Publication...' : 'Publier'}
                </button>
              </div>

              {(images.length > 0 || files.length > 0 || video) && !showArticleEditor && (
                <div className="news-form-preview">
                  <div className="images-preview-container">
                    {images.map((img, idx) => (
                      <div key={idx} className="image-preview-wrapper">
                        <img 
                          src={URL.createObjectURL(img)} 
                          alt={`Preview ${idx}`} 
                          className="news-form-image" 
                        />
                        <button 
                          type="button" 
                          className="remove-image-btn" 
                          onClick={() => handleRemoveImage(idx)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {video && (
                    <video controls className="news-form-video">
                      <source src={URL.createObjectURL(video)} />
                    </video>
                  )}
                  {files.length > 0 && (
                    <ul className="files-list">
                      {files.map((file, idx) => (
                        <li key={idx}>{file.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

NewsForm.propTypes = {
  onNewPost: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
  editMode: PropTypes.bool,
  initialData: PropTypes.object,
  onUpdatePost: PropTypes.func.isRequired,
};

export default NewsForm;