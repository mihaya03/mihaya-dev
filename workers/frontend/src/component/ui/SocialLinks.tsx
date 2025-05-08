import { SiGithub, SiX, SiSteam, SiBluesky } from "react-icons/si";

interface SocialLink {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}

const socialLinks: SocialLink[] = [
  {
    href: "https://github.com/mihaya",
    icon: SiGithub,
    label: "GitHub",
    color: "hover:text-gray-900",
  },
  {
    href: "https://x.com/mihaya",
    icon: SiX,
    label: "X (Twitter)",
    color: "hover:text-black",
  },

  {
    href: "https://steamcommunity.com/id/mihaya",
    icon: SiSteam,
    label: "Steam",
    color: "hover:text-blue-600",
  },
  {
    href: "https://bsky.app/profile/mihaya.dev",
    icon: SiBluesky,
    label: "Bluesky",
    color: "hover:text-sky-500",
  },
];

export default function SocialLinks() {
  return (
    <div className="flex gap-4 justify-center">
      {socialLinks.map(({ href, icon: Icon, label, color }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`p-3 rounded-lg bg-slate-100 text-slate-600 ${color} transition-all duration-200 hover:bg-slate-200 hover:scale-105`}
          aria-label={label}
        >
          <Icon className="h-6 w-6" />
        </a>
      ))}
    </div>
  );
}
