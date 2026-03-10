import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import TopFile from '../../components/TopFile';
import './SocialMedia.css';
import NewsForm from './NewsForm';
import NewsFeed from './NewsFeed';
import UserProfile from '../../components/UserProfile';
import logo from '../../assets/images/logo-pmbcloud.png';
import { fetchPosts } from '../../api/socialApi';

const SocialMedia = () => {
  const userInfo = useSelector(state => state.user.currentUser); // profil connecté
  const users = useSelector(state => state.user.users) || [];

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Vérifier si l'utilisateur est connecté
  const isLoggedIn = !!userInfo && !!localStorage.getItem('token');

  // Récupération des posts au montage
  useEffect(() => {
    const loadPosts = async () => {
      // Ne charger les posts que si l'utilisateur est connecté
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }

      try {
        console.log('[SocialMedia] Loading posts...');
        const data = await fetchPosts();
        console.log('[SocialMedia] Posts loaded:', data?.length || 0);
        setPosts(data || []);
      } catch (err) {
        console.error('[SocialMedia] Error loading posts:', err);
        setError(err.message || 'Erreur lors du chargement des publications');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [isLoggedIn]);

  // Callback après création d'un nouveau post
  const handleNewPost = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
    setRefreshTrigger(rt => rt + 1);
  };

  return (
    <div className="social-media-layout-container">
      <TopFile />
      <div className="social-media-layout">
        <aside className="social-media-sidebar">
          <UserProfile user={userInfo} />
        </aside>
        <main className="social-media-main">
          {!isLoggedIn ? (
            <div className="social-media-not-logged-in">
              <div className="not-logged-in-message">
                <h2>Connexion requise</h2>
                <p>Vous devez être connecté pour accéder aux réseaux sociaux.</p>
                <p>Veuillez vous connecter pour partager et voir les publications.</p>
              </div>
            </div>
          ) : (
            <>
              <NewsForm onNewPost={handleNewPost} user={userInfo} />
              {loading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Chargement des publications...</p>
                </div>
              ) : error ? (
                <div className="error-message">
                  <p>❌ {error}</p>
                  <button onClick={() => window.location.reload()} className="retry-btn">
                    Réessayer
                  </button>
                </div>
              ) : (
                <NewsFeed posts={posts} refreshTrigger={refreshTrigger} users={users} />
              )}
            </>
          )}
        </main>
        <aside className="social-media-right">
          <div className="sharing-space-card">
            <img src={logo} alt="Logo" className='logo' />
            <p className="msgSocial-black">Espace partage</p>
            <p className="msgSocial-gray">Partagez vos documents et ressources</p>
            <p className="msgSocial-gray">avec la communauté <span className="highlight">PmbCloud</span>.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SocialMedia;