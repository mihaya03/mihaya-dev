import Link from "next/link";
import SocialLinks from "@/component/ui/SocialLinks";

export default function Home() {
  return (
    <div className="min-h-full flex items-center justify-center">
      <div className="flex flex-col gap-8 items-center text-center font-[family-name:var(--font-geist-sans)]">
        <h1 className="text-4xl font-bold text-slate-900">mihaya.dev</h1>
        <p className="text-lg text-slate-600">sunippets</p>
        <SocialLinks />
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-800 transition-colors text-lg font-medium highlight-link"
          >
            Home
          </Link>

          <Link
            href="/notes"
            className="text-gray-600 hover:text-gray-800 transition-colors text-lg font-medium highlight-link"
          >
            Notes
          </Link>

          <Link
            href="/posts"
            className="text-gray-600 hover:text-gray-800 transition-colors text-lg font-medium highlight-link"
          >
            Posts
          </Link>
        </div>
      </div>
    </div>
  );
}
