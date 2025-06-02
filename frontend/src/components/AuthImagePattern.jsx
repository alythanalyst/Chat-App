import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaDiscord,
  FaGithub,
  FaReddit,
} from "react-icons/fa";
import { FaXTwitter, FaSquareGithub } from "react-icons/fa6";

const socialMediaLinks = [
  { icon: FaFacebook, url: "https://www.facebook.com/aliabdelrahmanjr" },
  { icon: FaXTwitter, url: "https://x.com/Alythanalyst" },
  { icon: FaInstagram, url: "https://instagram.com/mostofaly" },
  { icon: FaLinkedin, url: "https://www.linkedin.com/in/alyanalyzed/" },
  { icon: FaYoutube, url: "https://www.youtube.com/@mostofaly" },
  { icon: FaDiscord, url: "https://discord.com/users/465995269738332161" },
  { icon: FaSquareGithub, url: "https://github.com/Sir-Aly" },
  { icon: FaGithub, url: "https://github.com/alythanalyst" },
  { icon: FaReddit, url: "https://www.reddit.com/user/Unlucky_Meringue9835/e" },
];

const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200 p-12">
      <div className="max-w-md text-center">
        <div className="grid grid-cols-3 gap-3 mb-8">
          {socialMediaLinks.map((social, i) => (
            <a
              key={i}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`aspect-square rounded-2xl bg-primary/10 flex items-center justify-center transition-colors hover:bg-primary/20
                ${i % 2 === 0 ? "animate-pulse" : ""}
              `}
            >
              <social.icon className="size-12 text-primary" />{" "}
            </a>
          ))}
        </div>
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-base-content/60">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
