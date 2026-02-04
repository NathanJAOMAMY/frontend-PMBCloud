import { useState, useEffect } from 'react';
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

  // Récupération des posts au montage
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchPosts();
        setPosts(data);
      } catch (err) {
        setError(err.message);
        console.error("Erreur chargement posts:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();

    
  }, []);

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
          <NewsForm onNewPost={handleNewPost} user={userInfo} />
          {loading ? (
            <div className="loading-spinner">Chargement...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <NewsFeed posts={posts} refreshTrigger={refreshTrigger} users={users} />
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