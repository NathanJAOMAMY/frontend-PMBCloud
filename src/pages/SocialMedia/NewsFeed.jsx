import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FiDownload, FiExternalLink, FiPaperclip, FiLoader } from 'react-icons/fi';
import { FaRegCommentDots, FaRegPaperPlane, FaRegThumbsUp, FaHandsClapping, FaHeart, FaLightbulb, FaFaceSmile, FaFaceGrinStars } from "react-icons/fa6";
// import { fetchPosts, addReaction, addComment, addCommentReaction, replyToComment, addReplyReaction } from '../../api/socialApi';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { supabase } from '../../supabase';
import {useRef} from 'react';
import fileDownload, {} from 'js-file-download'; // Assurez-vous d'avoir installé js-file-download
import { findeUser } from '../../tools/tools';
import { useSelector } from 'react-redux';
import NewsForm from './NewsForm';
import { createPost, fetchPosts, addReaction, addComment, addCommentReaction, replyToComment, addReplyReaction } from '../../api/socialApi';
// import { createPost, fetchPosts } from '../../api/socialApi';
import { API_BASE_URL } from '../../api';
import PostMenu from '../../components/PostMenu';
import { updatePost } from '../../api/socialApi'; 
import { toast } from 'react-toastify';


const reactions = [
  { label: "J'aime", icon: <FaRegThumbsUp color="#378fe9" /> },
  { label: "Bravo", icon: <FaHandsClapping color="#f7b928" /> },
  { label: "Soutien", icon: <FaHeart color="#6fda44" /> },
  { label: "J’adore", icon: <FaHeart color="#f25268" /> },
  { label: "Instructif", icon: <FaLightbulb color="#e7a33e" /> },
  { label: "Interessant", icon: <FaFaceSmile color="#a9a9a9" /> },
];

function ReactionBar({ onSelect }) {
  return (
    <div className="reaction-bar">
      {reactions.map((r) => (
        <button
          key={r.label}
          className="reaction-btn"
          onClick={() => onSelect(r.label)}
          title={r.label}
          type="button"
        >
          {r.icon}
        </button>
      ))}
    </div>
  );
}

const getReactionCounts = (reactionsArr = []) => {
  const counts = {};
  reactionsArr.forEach(r => {
    if (r && r.types) {
      counts[r.types] = (counts[r.types] || 0) + 1;
    }
  });
  return counts;
};


// Download a file from a post
const downloadFile = async (link) => {

  try {
    const {data, error} = await supabase
      .storage
      .from('intranet')
      .download(`socialMedia/${link.split('/').pop()}`);
    if (error) {
      console.error('Error downloading file:', error);
      return null;
    }

    console.log("file downloaded clicked", data);
    
    
    fileDownload(data, link.split('/').pop())

  } catch (error) {
    console.log(error);
    
  }

}

const NewsFeed = ({ refreshTrigger }) => {
  const currentUser = useSelector(state => state.user.currentUser);
  const userInfo = useSelector(state => state.user.currentUser);
  const users = useSelector(state => state.user.users) || [];
  const [imageLoading, setImageLoading] = useState({});
  // console.log(users)
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [showReactions, setShowReactions] = useState(null);
  const reactionTimeout = useRef();
  const [selectedReaction, setSelectedReaction] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [showCommentInput, setShowCommentInput] = useState({});
  const [showReplyInput, setShowReplyInput] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  // const [showReactUsers, setShowReactUsers] = useState(null); 
  // // { level: "post"|"comment"|"reply", id, type }
  const [showPostReactionsModal, setShowPostReactionsModal] = useState(null); // postId ou null
  const [showCommentReactionsModal, setShowCommentReactionsModal] = useState(null); // { postId, commentId } ou null
  const [showReplyReactionsModal, setShowReplyReactionsModal] = useState(null); // { postId, commentId, replyId } ou null
  const [postReactionsFilter, setPostReactionsFilter] = useState("Tout");
  const [commentReactionsFilter, setCommentReactionsFilter] = useState("Tout");
  const [replyReactionsFilter, setReplyReactionsFilter] = useState("Tout");
  const [mediaModal, setMediaModal] = useState(null); // { type: 'image'|'video', url: string } ou null
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [editingPost, setEditingPost] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const handleEditPost = (post) => {
  setEditingPost(post);
  setShowEditModal(true);
};

const handleNewPost = async (postData) => {
  try {
    const newPost = await createPost(postData); // Récupère le post créé
    setPosts(prev => [newPost, ...prev]);       // Ajoute-le en haut de la liste
    setShowEditModal(false);
    setEditingPost(null);
  } catch (err) {
    setError(err.message);
    console.error("Erreur lors de la création du post:", err);
  }
};



const handleUpdatePost = async (postData, postId) => {
  try {
    const updated = await updatePost(postId, postData);
    setPosts(prev =>
      prev.map(post =>
        post._id === postId ? updated : post
      )
    );
    setShowEditModal(false);
    setEditingPost(null);
  } catch (err) {
    setError(err.message);
    console.error("Erreur lors de la modification du post:", err);
  }
};

  const handleMouseEnter = (id) => {
    clearTimeout(reactionTimeout.current);
    setShowReactions(id);
  };

  const handleMouseLeave = () => {
    reactionTimeout.current = setTimeout(() => setShowReactions(null), 700);
  };

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const data = await fetchPosts();
        setPosts(data);
        setError(null);

        // Récupère l'id utilisateur connecté
        const userId = JSON.parse(localStorage.getItem("user"))?.idUser;
        const newSelected = {};
        data.forEach(post => {
          const userReaction = post.reactions?.find(r => r.userId === userId);
          if (userReaction) {
            newSelected[post._id] = userReaction.types;
          }
        });
        setSelectedReaction(newSelected);

      } catch (err) {
        setError(err.message);
        console.error("Erreur chargement posts:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [refreshTrigger]);

  const toggleExpand = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const formatDate = (dateString) => {
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const renderMedia = (file, index, postId) => {
    const fileUrl = `${file.url}`;
    const isImage = fileUrl && /\.(jpg|jpeg|png|gif)$/i.test(fileUrl);
    const isVideo = fileUrl && /\.(mp4|webm|ogg)$/i.test(fileUrl);
    const isFile = !isImage && !isVideo;

    if (isImage) {
      return (
        <div className="media-container" key={`img-${index}`} style={{ position: "relative" }}>
          {imageLoading[`${postId}-${index}`] && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.7)", zIndex: 2
            }}>
              <FiLoader className="spin" size={32} color="var(--color-primary)" />
            </div>
          )}
          <img
            src={fileUrl}
            alt="Post media"
            className="post-image"
            style={{ cursor: "pointer", opacity: imageLoading[`${postId}-${index}`] ? 0.5 : 1 }}
            onClick={() => setMediaModal({ type: 'image', url: fileUrl })}
            onLoad={() => setImageLoading(prev => ({ ...prev, [`${postId}-${index}`]: false }))}
            onError={() => setImageLoading(prev => ({ ...prev, [`${postId}-${index}`]: false }))}
          />
        </div>
      );
    } else if (isVideo) {
      return (
        <div className="media-container" key={`vid-${index}`} style={{ position: "relative" }}>
          <video
            controls
            className="post-video"
            style={{ width: "100%", borderRadius: 8 }}
            src={fileUrl}
          >
            <source src={fileUrl} type={`video/${file.url.split('.').pop()}`} />
          </video>
          <button
            className="expand-media-btn"
            title="Agrandir"
            onClick={() => setMediaModal({ type: 'video', url: fileUrl })}
          >
            {/* Icône loupe ou plein écran */}
            <svg width="18" height="18" fill="#2563eb" viewBox="0 0 20 20"><path d="M10 2a8 8 0 105.293 14.293l3.853 3.854a1 1 0 001.415-1.415l-3.854-3.853A8 8 0 0010 2zm-6 8a6 6 0 1112 0A6 6 0 014 10z" /></svg>
          </button>
        </div>
      );
    } else if (isFile) {
      return (
        <span onClick={()=>downloadFile(fileUrl)} className='text-gray-500 cursor-pointer gap-2 flex items-center'>
          <FiPaperclip/>Telecharger
        </span>
      );
    }
  };

  const handleReaction = async (postId, label) => {
    try {
      const userId = userInfo?.idUser;
      const reactions = await addReaction(postId, label, userId);
      setPosts(prev =>
        prev.map(post =>
          post._id === postId ? { ...post, reactions } : post
        )
      );
      const userReaction = reactions.find(r => r.userId === userId);
      setSelectedReaction(prev => ({
        ...prev,
        [postId]: userReaction ? userReaction.types : label
      }));
    } catch (err) {
      console.log(err)
      toast.error("Erreur lors de la réaction");
    }
  };

  const handleCommentInput = (postId, value) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const handleAddComment = async (postId) => {
    const content = commentInputs[postId];
    if (!content || !content.trim()) return;
    try {
      console.log(userInfo)
      const comments = await addComment(postId, content, userInfo.idUser);
      setPosts(prev =>
        prev.map(post =>
          post._id === postId ? { ...post, comments } : post
        )
      );
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.log(err)
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  // Réagir à un commentaire
  const handleCommentReaction = async (postId, commentId, label) => {
    try {
      await addCommentReaction(postId, commentId, label, userInfo.idUser);
      const data = await fetchPosts();
      setPosts(data);
    } catch (err) {
      toast.error("Erreur lors de la réaction au commentaire", err);
    }
  };

  // Répondre à un commentaire
  const handleReplyToComment = async (postId, commentId) => {
    const content = replyInputs[commentId];
    if (!content || !content.trim()) return;
    try {
      await replyToComment(postId, commentId, content, userInfo.idUser);
      const data = await fetchPosts();
      setPosts(data);
      setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
      setShowReplyInput(prev => ({ ...prev, [commentId]: false }));
    } catch (err) {
      toast.error("Erreur lors de la réponse au commentaire", err);
    }
  };

  // Réagir à une réponse
  const handleReplyReaction = async (postId, commentId, replyId, label) => {
    try {
      await addReplyReaction(postId, commentId, replyId, label, userInfo.idUser);
      const data = await fetchPosts();
      setPosts(data);
    } catch (err) {
      toast.error("Erreur lors de la réaction à la réponse", err);
    }
  };

  const renderPostReactionsModal = () => {
    if (!showPostReactionsModal) return null;
    const post = posts.find(p => p._id === showPostReactionsModal);
    if (!post) return null;

    // Liste des types présents dans ce post
    const availableTypes = reactions.filter(r =>
      post.reactions.some(x => x.types === r.label)
    );

    // Filtrage des utilisateurs selon le type sélectionné
    let usersToShow = [];
    if (postReactionsFilter === "Tout") {
      usersToShow = post.reactions;
    } else {
      usersToShow = post.reactions.filter(x => x.types === postReactionsFilter);
    }

    return (
      <div className="modal-overlay" onClick={() => setShowPostReactionsModal(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span>Réactions à la publication</span>
            <button className="modal-close-btn" onClick={() => setShowPostReactionsModal(null)}>×</button>
          </div>
          {/* Onglets de filtre */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              className={postReactionsFilter === "Tout" ? "active" : ""}
              onClick={() => setPostReactionsFilter("Tout")}
              style={{ fontWeight: postReactionsFilter === "Tout" ? "bold" : "normal" }}
            >
              Tout
            </button>
            {availableTypes.map(r => (
              <button
                key={r.label}
                className={postReactionsFilter === r.label ? "active" : ""}
                onClick={() => setPostReactionsFilter(r.label)}
                style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: postReactionsFilter === r.label ? "bold" : "normal" }}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>
          {/* Liste des utilisateurs */}
          {usersToShow.length === 0 ? (
            <div>Aucun utilisateur</div>
          ) : (
            usersToShow.map((reaction, idx) => {
              // Trouver l'utilisateur complet à partir de son userId
              const fullUser = findeUser(reaction.userId, users);

              return (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {fullUser?.avatar ? (
                    <img src={fullUser.avatar} alt="avatar" style={{ width: 24, height: 24, borderRadius: "50%" }} />
                  ) : (
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {fullUser?.userName?.charAt(0) || "?"}
                    </span>
                  )}
                  <span>{`${fullUser?.userName || ""} ${fullUser?.surname || ""}`.trim() || reaction.userId}</span>
                  <span style={{ marginLeft: "auto", opacity: 0.7 }}>{reaction.types}</span>
                </div>
              );
            })
          )}

        </div>
      </div>
    );
  };

  // Affichage de la modale des réactions d'un commentaire
  const renderCommentReactionsModal = () => {
    if (!showCommentReactionsModal) return null;
    const post = posts.find(p => p._id === showCommentReactionsModal.postId);
    const comment = post?.comments.find(c => c._id === showCommentReactionsModal.commentId);
    if (!comment) return null;

    const availableTypes = reactions.filter(r =>
      comment.reactions.some(x => x.types === r.label)
    );

    let usersToShow = [];
    if (commentReactionsFilter === "Tout") {
      usersToShow = comment.reactions || [];
    } else {
      usersToShow = (comment.reactions || []).filter(x => x.types === commentReactionsFilter);
    }

    return (
      <div className="modal-overlay" onClick={() => { setShowCommentReactionsModal(null); setCommentReactionsFilter("Tout"); }}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span>Réactions au commentaire</span>
            <button className="modal-close-btn" onClick={() => { setShowCommentReactionsModal(null); setCommentReactionsFilter("Tout"); }}>×</button>
          </div>
          {/* Onglets de filtre */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              className={commentReactionsFilter === "Tout" ? "active" : ""}
              onClick={() => setCommentReactionsFilter("Tout")}
              style={{ fontWeight: commentReactionsFilter === "Tout" ? "bold" : "normal" }}
            >
              Tout
            </button>
            {availableTypes.map(r => (
              <button
                key={r.label}
                className={commentReactionsFilter === r.label ? "active" : ""}
                onClick={() => setCommentReactionsFilter(r.label)}
                style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: commentReactionsFilter === r.label ? "bold" : "normal" }}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>
          {/* Liste des utilisateurs */}
          {usersToShow.length === 0 ? (
            <div>Aucun utilisateur</div>
          ) : (
            usersToShow.map((reaction, idx) => {
              // Trouver l'utilisateur complet à partir de son userId
              const fullUser = findeUser(reaction.userId, users);

              return (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {fullUser?.avatar ? (
                    <img src={fullUser.avatar} alt="avatar" style={{ width: 24, height: 24, borderRadius: "50%" }} />
                  ) : (
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {fullUser?.userName?.charAt(0) || "?"}
                    </span>
                  )}
                  <span>{`${fullUser?.userName || ""} ${fullUser?.surname || ""}`.trim() || reaction.userId}</span>
                  <span style={{ marginLeft: "auto", opacity: 0.7 }}>{reaction.types}</span>
                </div>
              );
            })
          )}

        </div>
      </div>
    );
  };

  // Affichage de la modale des réactions d'une réponse
  const renderReplyReactionsModal = () => {
    if (!showReplyReactionsModal) return null;
    const post = posts.find(p => p._id === showReplyReactionsModal.postId);
    const comment = post?.comments.find(c => c._id === showReplyReactionsModal.commentId);
    const reply = comment?.replies.find(r => r._id === showReplyReactionsModal.replyId);
    if (!reply) return null;

    const availableTypes = reactions.filter(r =>
      reply.reactions.some(x => x.types === r.label)
    );

    let usersToShow = [];
    if (replyReactionsFilter === "Tout") {
      usersToShow = reply.reactions;
    } else {
      usersToShow = reply.reactions.filter(x => x.types === replyReactionsFilter);
    }

    return (
      <div className="modal-overlay" onClick={() => { setShowReplyReactionsModal(null); setReplyReactionsFilter("Tout"); }}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span>Réactions à la réponse</span>
            <button className="modal-close-btn" onClick={() => { setShowReplyReactionsModal(null); setReplyReactionsFilter("Tout"); }}>×</button>
          </div>
          {/* Onglets de filtre */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              className={replyReactionsFilter === "Tout" ? "active" : ""}
              onClick={() => setReplyReactionsFilter("Tout")}
              style={{ fontWeight: replyReactionsFilter === "Tout" ? "bold" : "normal" }}
            >
              Tout
            </button>
            {availableTypes.map(r => (
              <button
                key={r.label}
                className={replyReactionsFilter === r.label ? "active" : ""}
                onClick={() => setReplyReactionsFilter(r.label)}
                style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: replyReactionsFilter === r.label ? "bold" : "normal" }}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>
          {/* Liste des utilisateurs */}
          {usersToShow.length === 0 ? (
            <div>Aucun utilisateur</div>
          ) : (
            usersToShow.map((reaction, idx) => {
              // Trouver l'utilisateur complet à partir de son userId
              const fullUser = findeUser(reaction.userId, users);

              return (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {fullUser?.avatar ? (
                    <img src={fullUser.avatar} alt="avatar" style={{ width: 24, height: 24, borderRadius: "50%" }} />
                  ) : (
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {fullUser?.userName?.charAt(0) || "?"}
                    </span>
                  )}
                  <span>{`${fullUser?.userName || ""} ${fullUser?.surname || ""}`.trim() || reaction.userId}</span>
                  <span style={{ marginLeft: "auto", opacity: 0.7 }}>{reaction.types}</span>
                </div>
              );
            })
          )}

        </div>
      </div>
    );
  };

  const handleImageChange = (postId, newIndex) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [postId]: newIndex
    }));
    setImageLoading(prev => ({
      ...prev,
      [`${postId}-${newIndex}`]: true
    }));
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="news-feed">
      {posts.length === 0 ? (
        <div className="no-posts-message">
          Aucune publication pour le moment. Soyez le premier à partager !
        </div>
      ) : (
        posts.map(post => {
          const userInfo = findeUser(post.idUser, users);
          return (
            <div className="news-card" key={post._id}>
              {/* ...header... */}
              <div className="news-header">
                <div className="user-avatar-mini">
                  {userInfo?.avatar ? (
                    <img src={userInfo.avatar} alt="avatar" />
                  ) : (
                    <span>{userInfo?.userName?.charAt(0) || 'A'}</span>
                  )}
                </div>
                <div className="user-info">
                  <span className="post-username">{`${userInfo?.userName || ''} ${userInfo?.surname || ''}`.trim() || 'Utilisateur inconnu'}</span>
                  <div className="post-date">{formatDate(post.createdAt)}</div>
                </div>
                <div className="post-menu" >
                  <PostMenu
                    onEdit={() => handleEditPost(post)}
                    isOwner={currentUser.idUser === post.idUser}
                    post={post}
                    onDeleteSuccess={async () => {
                      // Recharge les posts après suppression
                      try {
                        setLoading(true);
                        const data = await fetchPosts();
                        setPosts(data);
                        setError(null);
                      } catch (err) {
                        setError(err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  />
                </div>
              </div>

              {/* ...article/content/media... */}
              {post.isArticle && (
                <div className="article-container">
                  <h3 className="article-title">{post.articleTitle}</h3>
                  <div className="article-content">
                    {post.content}
                  </div>
                  {(post.files?.length > 0 || post.links?.length > 0) && (
                    <div className="post-attachments">
                      {post.files?.length > 0 && (
                        <div className="media-slider-container" style={{ position: "relative", display: "inline-block" }}>
                          {renderMedia(post.files[currentImageIndex[post._id] || 0], currentImageIndex[post._id] || 0, post)}
                          {post.files.length > 1 && (
                            <>
                              <button
                                className="media-nav-btn left"
                                disabled={(currentImageIndex[post._id] || 0) === 0}
                                onClick={() =>
                                  handleImageChange(post._id, (currentImageIndex[post._id] || 0) - 1)
                                }
                              >
                                &lt;
                              </button>
                              <button
                                className="media-nav-btn right"
                                disabled={(currentImageIndex[post._id] || 0) === post.files.length - 1}
                                onClick={() =>
                                  handleImageChange(post._id, (currentImageIndex[post._id] || 0) + 1)
                                }
                              >
                                &gt;
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {post.links?.map((link, index) => (
                        <a
                          key={`link-${index}`}
                          href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="post-link"
                        >
                          <FiExternalLink /> {link.url}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!post.isArticle && (
                <>
                  {(post.content && post.content.trim() !== '') && (
                    <div className={`news-content ${expandedPosts[post._id] ? 'expanded' : ''}`}>
                      {post.content}
                      {post.content.length > 300 && (
                        <button
                          onClick={() => toggleExpand(post._id)}
                          className="expand-btn"
                        >
                          {expandedPosts[post._id] ? 'Voir moins' : 'Voir plus'}
                        </button>
                      )}
                    </div>
                  )}
                  {(post.files?.length > 0 || post.links?.length > 0) && (
                    <div className="post-attachments">
                      {post.files?.length > 0 && (
                        <div className="media-slider-container" style={{ position: "relative", display: "inline-block" }}>
                          {renderMedia(post.files[currentImageIndex[post._id] || 0], currentImageIndex[post._id] || 0, post._id)}
                          {post.files.length > 1 && (
                            <>
                              <button
                                className="media-nav-btn left"
                                disabled={(currentImageIndex[post._id] || 0) === 0}
                                onClick={() =>
                                  handleImageChange(post._id, (currentImageIndex[post._id] || 0) - 1)
                                }
                              >
                                &lt;
                              </button>
                              <button
                                className="media-nav-btn right"
                                disabled={(currentImageIndex[post._id] || 0) === post.files.length - 1}
                                onClick={() =>
                                  handleImageChange(post._id, (currentImageIndex[post._id] || 0) + 1)
                                }
                              >
                                &gt;
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {post.links?.map((link, index) => (
                        <a
                          key={`link-${index}`}
                          href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="post-link"
                        >
                          <FiExternalLink /> {link.url}
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Résumé des réactions à gauche et nombre de commentaires à droite */}
              <div className="post-reactions-comments-summary" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <div
                  className="post-reactions-summary"
                  style={{ display: "flex", alignItems: "center", gap: "0.7em", cursor: "pointer" }}
                  onClick={() => {
                    setShowPostReactionsModal(post._id);
                    setPostReactionsFilter("Tout");
                  }}
                >
                  {reactions.map(r => {
                    const count = getReactionCounts(post.reactions)[r.label] || 0;
                    return count > 0 && (
                      <span key={r.label} className="reaction-summary-item">
                        {r.icon}
                        <span style={{ marginLeft: "0.2em" }}>{count}</span>
                      </span>
                    );
                  })}
                </div>
                {post.comments && post.comments.length > 0 && (
                  <div className="post-comments-count">
                    <FaRegCommentDots size={18} style={{ marginRight: "0.3em" }} />
                    <span>{post.comments.length}</span>
                  </div>
                )}
              </div>

              {/* Barre d'actions */}
              <div className="post-actions">
                <div
                  className="action-btn like-btn"
                  onMouseEnter={() => handleMouseEnter(post._id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3em" }}>
                    {
                      (() => {
                        const selected = selectedReaction[post._id];
                        const reaction = reactions.find(r => r.label === selected);
                        if (!selected) {
                          return <FaRegThumbsUp size={18} color="#666" />;
                        }
                        return reaction?.icon || <FaRegThumbsUp size={18} color="#666" />;
                      })()
                    }
                    <span>
                      {selectedReaction[post._id] || "Réagir"}
                    </span>
                  </span>
                  {showReactions === post._id && (
                    <div
                      onMouseEnter={() => handleMouseEnter(post._id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <ReactionBar
                        onSelect={label => {
                          handleReaction(post._id, label);
                          setShowReactions(null);
                        }}
                      />
                    </div>
                  )}
                </div>
                <button
                  className="action-btn"
                  onClick={() =>
                    setShowCommentInput(prev => ({
                      ...prev,
                      [post._id]: !prev[post._id]
                    }))
                  }
                >
                  <FaRegCommentDots size={18} />
                  <span>Commenter</span>
                </button>
              </div>

              {/* Affichage des commentaires seulement après clic */}
              {showCommentInput[post._id] && (
                <div className="post-comments">
                  {post.comments?.map((comment, idx) => {
                    const commentUser = findeUser(comment.userId, users);
                    return (
                      <div key={idx} className="comment">
                        <div className="comment-header" style={{ display: "flex", alignItems: "center", gap: "0.7em" }}>
                          {commentUser?.avatar ? (
                            <img src={commentUser.avatar} alt="avatar" className="comment-avatar" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                          ) : (
                            <span className="comment-avatar" style={{ width: 32, height: 32, borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {commentUser?.userName?.charAt(0) || "?"}
                            </span>
                          )}
                          <span className="comment-username" style={{ fontWeight: "bold", color: "#2563eb" }}>{`${commentUser?.userName || ''} ${commentUser?.surname || ''}`.trim() || commentUser?.userName || comment.userName}</span>
                          <span className="comment-date" style={{ fontSize: "0.95em", color: "#888" }}>
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleString("fr-FR") : ""}
                          </span>
                        </div>
                        <div className="comment-content" style={{ marginLeft: 40 }}>
                          {comment.content}
                        </div>
                        {/* Affichage des réactions sur le commentaire */}
                        {comment.reactions && comment.reactions.length > 0 && (
                          <div className="comment-reactions-summary" style={{ display: "flex", alignItems: "center", gap: "0.7em", marginLeft: 40, marginBottom: 4, cursor: "pointer" }} onClick={() => {
                            setShowCommentReactionsModal({ postId: post._id, commentId: comment._id });
                            setCommentReactionsFilter("Tout");
                          }}>
                            {reactions.map(r => {
                              const count = getReactionCounts(comment.reactions)[r.label] || 0;
                              return count > 0 && (
                                <span key={r.label} className="reaction-summary-item">
                                  {r.icon}
                                  <span style={{ marginLeft: "0.2em" }}>{count}</span>
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Barre de réactions et bouton répondre */}
                        <div className="comment-actions" style={{ display: "flex", alignItems: "center", gap: "1em", marginLeft: 40 }}>
                          <div
                            className="action-btn like-btn"
                            onMouseEnter={() => handleMouseEnter(`comment-${comment._id}`)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3em" }}>
                              {
                                (() => {
                                  const userId = JSON.parse(localStorage.getItem("user"))?.idUser;
                                  const userReaction = comment.reactions?.find(r => r.userId === userId);
                                  const reaction = reactions.find(r => r.label === userReaction?.types);
                                  if (!userReaction) {
                                    return <FaRegThumbsUp size={18} color="#666" />;
                                  }
                                  return reaction?.icon || <FaRegThumbsUp size={18} color="#666" />;
                                })()
                              }
                              <span>
                                {
                                  (() => {
                                    const userId = JSON.parse(localStorage.getItem("user"))?.idUser;
                                    const userReaction = comment.reactions?.find(r => r.userId === userId);
                                    return userReaction?.types || "Réagir";
                                  })()
                                }
                              </span>
                            </span>
                            {showReactions === `comment-${comment._id}` && (
                              <ReactionBar
                                onSelect={label => {
                                  handleCommentReaction(post._id, comment._id, label);
                                  setShowReactions(null);
                                }}
                              />
                            )}
                          </div>
                          <button
                            className="reply-btn"
                            onClick={() => setShowReplyInput({ ...showReplyInput, [comment._id]: !showReplyInput?.[comment._id] })}
                          >
                            Répondre
                          </button>
                        </div>
                        {/* Champ de réponse */}
                        {showReplyInput?.[comment._id] && (
                          <div className="add-reply" style={{ marginLeft: 40 }}>
                            <input
                              type="text"
                              value={replyInputs?.[comment._id] || ''}
                              onChange={e => setReplyInputs({ ...replyInputs, [comment._id]: e.target.value })}
                              placeholder="Votre réponse..."
                            />
                            <button onClick={() => handleReplyToComment(post._id, comment._id)}>Envoyer</button>
                          </div>
                        )}
                        {/* Affichage des réponses */}
                        {comment.replies?.length > 0 && comment.replies.map((reply, rIdx) => {
                          const replyUser = findeUser(reply.userId, users);
                          return (
                            <div key={rIdx} className="comment-reply" style={{ marginLeft: 60, background: "#f3f6fa", borderRadius: 8, padding: "0.2em 0.7em", marginTop: "0.2em" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {replyUser?.avatar ? (
                                  <img
                                    src={replyUser.avatar}
                                    alt="avatar"
                                    style={{ width: 32, height: 32, borderRadius: "50%" }}
                                  />
                                ) : (
                                  <span
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: "50%",
                                      background: "#eee",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontWeight: "bold",
                                      color: "#555",
                                    }}
                                  >
                                    {replyUser?.userName?.charAt(0) || "?"}
                                  </span>
                                )}

                                <div>
                                  <b style={{ marginRight: 8 }}>
                                    {`${replyUser?.userName || ""} ${replyUser?.surname || ""}`.trim() || reply.userName}
                                  </b>
                                  <span style={{ color: "#888", fontSize: "0.95em" }}>
                                    {reply.createdAt ? new Date(reply.createdAt).toLocaleString("fr-FR") : ""}
                                  </span>
                                </div>
                              </div>


                              <div>{reply.content}</div>
                              {/* Affichage des réactions sur la réponse */}
                              {reply.reactions && reply.reactions.length > 0 && (
                                <div className="reply-reactions-summary" style={{ display: "flex", alignItems: "center", gap: "0.7em", marginLeft: 20, marginBottom: 4, cursor: "pointer" }} onClick={() => setShowReplyReactionsModal({ postId: post._id, commentId: comment._id, replyId: reply._id })}>
                                  {reactions.map(r => {
                                    const count = getReactionCounts(reply.reactions)[r.label] || 0;
                                    return count > 0 && (
                                      <span key={r.label} className="reaction-summary-item">
                                        {r.icon}
                                        <span style={{ marginLeft: "0.2em" }}>{count}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                              {/* Bouton Réagir sur la réponse */}
                              <div
                                className="action-btn like-btn"
                                onMouseEnter={() => handleMouseEnter(`reply-${reply._id}`)}
                                onMouseLeave={handleMouseLeave}
                              >
                                <span style={{ display: "flex", alignItems: "center", gap: "0.3em" }}>
                                  {
                                    (() => {
                                      const userId = JSON.parse(localStorage.getItem("user"))?.idUser;
                                      const userReaction = reply.reactions?.find(r => r.userId === userId);
                                      const reaction = reactions.find(r => r.label === userReaction?.types);
                                      if (!userReaction) {
                                        return <FaRegThumbsUp size={18} color="#666" />;
                                      }
                                      return reaction?.icon || <FaRegThumbsUp size={18} color="#666" />;
                                    })()
                                  }
                                  <span>
                                    {
                                      (() => {
                                        const userId = JSON.parse(localStorage.getItem("user"))?.idUser;
                                        const userReaction = reply.reactions?.find(r => r.userId === userId);
                                        return userReaction?.types || "Réagir";
                                      })()
                                    }
                                  </span>
                                </span>
                                {showReactions === `reply-${reply._id}` && (
                                  <ReactionBar
                                    onSelect={label => {
                                      handleReplyReaction(post._id, comment._id, reply._id, label);
                                      setShowReactions(null);
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  <div className="add-comment">
                    <input
                      id={`comment-input-${post._id}`}
                      type="text"
                      value={commentInputs[post._id] || ''}
                      onChange={e => handleCommentInput(post._id, e.target.value)}
                      placeholder="Votre commentaire..."
                    />
                    <button onClick={() => handleAddComment(post._id)}>Envoyer</button>
                  </div>
                </div>
              )}
              {showEditModal && editingPost && (
                <div className="modal-overlay"onClick={() => {setShowEditModal(false);setEditingPost(null);}}>
                  <div className="modal-content"onClick={(e) => e.stopPropagation()}>
                    <NewsForm
                      user={currentUser}
                      onNewPost={handleNewPost}
                      onUpdatePost={handleUpdatePost}
                      editMode={!!editingPost}
                      initialData={editingPost}
                      onClose={() => {
                        setShowEditModal(false);
                        setEditingPost(null);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
      {renderPostReactionsModal()}
      {renderCommentReactionsModal()}
      {renderReplyReactionsModal()}
      {mediaModal && (
        <div className="media-modal-overlay" onClick={() => setMediaModal(null)}>
          <div className="media-modal-content" style={{ maxWidth: "90vw", maxHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setMediaModal(null)} style={{ position: "absolute", top: 10, right: 20, zIndex: 2, fontSize: "2em" }}>×</button>
            {mediaModal.type === "image" ? (
              <img src={mediaModal.url} alt="media" style={{ maxWidth: "80vw", maxHeight: "80vh", borderRadius: 8 }} />
            ) : (
              <video src={mediaModal.url} controls autoPlay style={{ maxWidth: "80vw", maxHeight: "80vh", borderRadius: 8 }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

ReactionBar.propTypes = {
  onSelect: PropTypes.func.isRequired,
};

NewsFeed.propTypes = {
  refreshTrigger: PropTypes.any,
};

export default NewsFeed;