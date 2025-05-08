"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, SearchField, Input } from "react-aria-components";
import { IconSearch, IconSun, IconMenu2 } from "@tabler/icons-react";

const navigationItems = [
  { href: "/notes", label: "Notes" },
  { href: "/posts", label: "Posts" },
] as const;

export default function Header() {
  const [opened, setOpened] = useState(false);
  const toggle = () => setOpened(!opened);

  const navItems = navigationItems.map(({ href, label }) => (
    <Link
      key={href}
      href={href}
      className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md  hover:bg-gray-300 transition-colors"
    >
      {label}
    </Link>
  ));

  return (
    <header className="h-14  mb-8">
      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 h-full">
        <div className="h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              className="sm:hidden p-2 rounded-md hover:bg-gray-300 transition-colors"
              onPress={toggle}
              aria-label="Toggle menu"
            >
              <IconMenu2 size={20} />
            </Button>
            <Link
              href="/"
              className="text-decoration-none p-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              <h2 className="text-xl font-bold text-gray-800">mihaya.dev</h2>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">{navItems}</div>
            <SearchField className="hidden sm:block">
              <div className="relative w-64">
                <IconSearch
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <Input
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </SearchField>
            <Button
              className="p-2 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
              aria-label="Toggle dark mode"
            >
              <IconSun size={18} />
            </Button>
          </div>
        </div>

        {opened && (
          <div className="sm:hidden border-t border-gray-200 py-4 space-y-4">
            <SearchField>
              <div className="relative">
                <IconSearch
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <Input
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </SearchField>
            <div className="flex flex-wrap gap-2">{navItems}</div>
          </div>
        )}
      </div>
    </header>
  );
}
