import { motion } from "framer-motion";
import { FileText, MessageSquare, Users } from "lucide-react";
import { FC } from "react";
import TopFile from "../components/TopFile";
import { NavLink } from "react-router-dom";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  link: string
}
const FeatureCard: FC<FeatureCardProps> = ({ icon, title, desc, link }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
    >
      <NavLink className="bg-white shadow-md rounded-2xl p-6 flex flex-col items-center text-center" to={link}>
        <div className="flex flex-col gap-2">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-500">{desc}</p>
      </NavLink>
    </motion.div>
  );
}
const LandingPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <TopFile></TopFile>
      {/* Hero Section */}
      <main className="flex flex-col gap-6 px-4 items-center text-center">
        <div className="flex flex-col items-center justify-center">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-bold text-gray-800"
          >
            Votre espace intranet moderne et collaboratif
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 max-w-xl"
          >
            Gérez vos fichiers, échangez avec vos collègues et restez connectés
            dans un environnement sécurisé et fluide dans <strong>Promabio</strong>.
          </motion.p>
        </div>

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-8 max-w-6xl">
          <FeatureCard
            icon={<FileText className="w-10 h-10 text-primary" />}
            title="Gestion de fichiers"
            desc="Importez, organisez et partagez facilement vos documents d’entreprise."
            link="/file"
          />
          <FeatureCard
            icon={<MessageSquare className="w-10 h-10 text-primary" />}
            title="Message instantanée"
            desc="Discutez en temps réel avec vos collègues via un espace chat fluide."
            link="/chat"
          />
          <FeatureCard
            icon={<Users className="w-10 h-10 text-primary" />}
            title="Espace social"
            desc="Partagez vos actualités, réactions et idées dans le fil d’activité interne."
            link="/social-media"
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Promabio — PmbCloud
      </footer>
    </div>
  );
}

export default LandingPage