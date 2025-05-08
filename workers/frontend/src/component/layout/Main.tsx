import React from "react";

export default function Main({ children }: { children: React.ReactNode }) {
  return <main className="overflow-auto p-4">{children}</main>;
}
