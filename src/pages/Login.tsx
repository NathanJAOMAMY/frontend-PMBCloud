import { useEffect, useState, FormEvent, useRef } from "react";
import bg from "../assets/images/bg-login.jpeg";
import logo from "../assets/images/logo-pmbcloud.png";
import { Button, Modal } from "../components/Utils";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "../redux/features/user/user";
import { API_BASE_URL, apiRequest } from "../api";
import { toast } from "react-toastify";
import { User } from "../data/typeData";
import { FiEye, FiEyeOff, FiLoader } from "react-icons/fi";

interface LoginResponse {
  token: string;
  user: User;
}

type ApiError = { message?: string; errors?: Record<string, string[]> };

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [show, setShow] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAlreadyLoggedIn, setIsAlreadyLoggedIn] = useState<boolean>(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const redirectCheckRef = useRef<boolean>(false);

  useEffect(() => {
    // Only check once on mount - avoid repeated checks
    if (redirectCheckRef.current) return;
    redirectCheckRef.current = true;

    const localStoreUser = localStorage.getItem("userInfo");
    if (localStoreUser) {
      try {
        const user = JSON.parse(localStoreUser) as User;
        if (user && user.idUser) {
          setIsAlreadyLoggedIn(true);
          dispatch(setCurrentUser(user));
          navigate("/", { replace: true });
        } else {
          localStorage.removeItem("userInfo");
        }
      } catch (err) {
        console.error('[Login] Error parsing stored user:', err);
        localStorage.removeItem("userInfo");
      }
    }
  }, []); // Empty dependency array - run only once

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent multiple submissions
    setIsLoading(true);
    loginClient(username, password);
  };

  

  const loginClient = async (userName: string, password: string): Promise<boolean> => {
    if (!userName || !password) {
      toast.error("Veuillez entrer votre identifiant et votre mot de passe");
      setIsLoading(false);
      return false;
    }

    try {
      const response = await apiRequest<LoginResponse>({
        method: 'POST',
        url: `${API_BASE_URL}/auth/login`,
        data: { identifiant: userName, password },
        withCredentials: true
      });
      const { data } = response;
      localStorage.setItem("token", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data.user));

      await login(data.user);
      dispatch(setCurrentUser(data.user));
      navigate("/");
      return true;

    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const apiMsg = (err.response?.data as ApiError | undefined)?.message;

        if (!err.response || err.code === "ERR_NETWORK") {
          toast.error("Impossible de joindre le serveur. Vérifiez votre connexion Internet.");
        } else if (status === 400 || status === 401) {
          toast.error(apiMsg ?? "Identifiant ou mot de passe incorrect.");
        } else if (status === 403) {
          toast.error("Accès refusé. Vous n'avez pas les droits nécessaires.");
        } else if (status === 404) {
          toast.error("Compte non disponible.");
        } else if (status === 422) {
          toast.error(apiMsg ?? "Données invalides (422).");
        } else if (status === 429) {
          toast.error("Trop de tentatives. Réessayez plus tard.");
        } else {
          toast.error(apiMsg ?? "Une erreur est survenue.");
        }
      } else {
        toast.error("Erreur inattendue.");
      }
      return false;
    }
    finally {
      setIsLoading(false);
    }
  };

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  if (isAlreadyLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 text-gray-700">
        <FiLoader className="animate-spin text-primary" size={40} />
        <span className="text-lg font-medium">Redirection en cours...</span>
      </div>
    );
  }

  return (
      <div
        className="h-screen w-screen flex items-center justify-center relative text-gray-800"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <Modal
          open={modalOpen}
          title="Veuillez entrer votre code d'inscription"
          handleClose={closeModal}
          handleValidate={() => { /* console.log('Validé'); */ }}
        >
          <input
            type="text"
            className="w-full mb-2 border-2 border-primary rounded-md py-2 px-3 transition focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </Modal>

        <div className="relative z-10 w-full max-w-md p-8 bg-white backdrop-blur-md rounded-xl shadow-xl flex flex-col items-center">
          <img src={logo} alt="Logo promabio" className="w-48 mb-6" />

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div>
              <label htmlFor="username" className="block font-semibold text-gray-700 mb-1">
                Nom ou email
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full transition border-2 border-primary px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Entrez votre identifiant"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block font-semibold text-gray-800 mb-1">
                Mot de passe
              </label>
              <div className="relative w-full">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full transition px-4 py-2 rounded-lg border-2 border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Entrez votre mot de passe"
                  autoComplete="current-password"
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer z-10 text-primary"
                  onClick={() => setShow(!show)}
                >
                  {show ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <Button
                htmlType="submit"
                title={isLoading ? "Connexion..." : "Se connecter"}
                type="success"
              />
            </div>
          </form>

          {isLoading && (
            <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center rounded-xl">
              <FiLoader className="animate-spin text-primary" size={40} />
              <span className="mt-2 text-gray-700 font-medium">Connexion en cours...</span>
            </div>
          )}
        </div>
      </div>
    );
};

export default Login;
