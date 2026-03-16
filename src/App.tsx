import { HashRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense, useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { ToastContainer } from "react-toastify";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";

const GlobalLayout = lazy(() => import("./components/GlobalLayout"));
const FileLayout = lazy(() => import("./components/FileLayout"));
const Chat = lazy(() => import("./pages/Chat/Chat"));
const SocialMedia = lazy(() => import("./pages/SocialMedia/SocialMedia"));
const Images = lazy(() => import("./pages/file/Images"));
const Share = lazy(() => import("./pages/file/Share"));
const ShareMe = lazy(() => import("./pages/file/ShareMe"));
const Login = lazy(() => import("./pages/Login"));
const SignCode = lazy(() => import("./pages/Admin/SignCode"));
const Users = lazy(() => import("./pages/Admin/Users"));
const ChatRoom = lazy(() => import("./components/Chat/ChatRoom"));
const FileComponant = lazy(() => import("./pages/HomeFile"));
const Admin = lazy(() => import("./pages/Admin/Admin"));
const LeadingPage = lazy(() => import("./pages/LeadingPage"));

const XSSTest = lazy(() => import("./components/XSSTest")); // Page de test XSS

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { fetchUser } from "./components/Chat/chatFonction";
import { setUser } from "./redux/features/user/user";
import { departmentRoutes, thematicRoutes } from "./AppRouteConfig";
import LoadingSpinner from "./pages/SocialMedia/LoadingSpinner";

const App = () => {

  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(true);
  const usersLoadedRef = useRef(false);

  useEffect(() => {
    const getData = async () => {
      // Prevent multiple calls - only run once on mount
      if (usersLoadedRef.current) return;

      try {
        console.log('[App] Fetching users on mount...');
        const allUser = await fetchUser();
        if (allUser && Array.isArray(allUser) && allUser.length > 0) {
          console.log('[App] Dispatching setUser with', allUser.length, 'users');
          dispatch(setUser(allUser))
          usersLoadedRef.current = true; // Mark as loaded
        } else {
          console.warn('[App] fetchUser returned empty or invalid data:', allUser);
        }
      } catch (error) {
        console.error('[App] Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    }
    getData()
  }, []); // Empty dependency array - only run once on mount

  return (
    <AuthProvider>
      <HashRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<ProtectedRoute><GlobalLayout /></ProtectedRoute>}>

              <Route index element={<LeadingPage />}></Route>
              {/* <Route path="/" element={<FileLayout />}>
            </Route> */}
              <Route path="/file/*" element={<FileLayout />}>
                {/* <Route path="file" element={<Files />} /> */}
                <Route path="image" element={<Images />} />
                <Route path="share" element={<Share title="Mes fichiers et dossiers partagés" />} />
                <Route path="share-with-me" element={<ShareMe title="Fichiers et dossiers partagés avec moi" />} />
                <Route path="file" element={<FileComponant title="Bienvenu dans PmbCloud" path="/" />} />
                {/* Sous-menus Département */}
                {departmentRoutes.map(({ path, title }) => (
                  <Route
                    key={path}
                    path={path.slice(1)}
                    element={<FileComponant title={title} path={path} departement departementRoutes={path} />}
                  />
                ))}

                {/* Sous-menus Thématique */}
                {thematicRoutes.map(({ path, title }) => (
                  <Route
                    key={path}
                    path={path}
                    element={<FileComponant title={title} path={path} departement departementRoutes={path} />}
                  />
                ))}
              </Route>
              <Route path="/chat/*" element={<Chat />}>
                <Route path=":conversationId" element={<ChatRoom />} />
              </Route>
              <Route path="/admin/*" element={<Admin />}>
                {/* Administration */}
                <Route path="sign-code" element={<SignCode />} />
                <Route path="users" element={<Users />} />
              </Route>
              <Route path="/social-media" element={<SocialMedia />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/xss" element={<XSSTest />} /> {/* Page de test XSS */}
          </Routes>
        </Suspense>

        <ToastContainer
          position="top-right"
          autoClose={7000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          //@ts-ignore : Ne connais pas le bodyClassName
          bodyClassName="bg-primary text-white"
        />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
