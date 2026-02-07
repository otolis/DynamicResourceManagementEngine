import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen border-all m-md flex flex-col">
      <header className="border-bottom p-lg flex justify-between items-baseline">
        <h1 className="m-0">DRME</h1>
        <div className="text-mono uppercase font-black text-sm">
          System v1.0 // Phase 2
        </div>
      </header>
      
      {title && (
        <div className="border-bottom p-md bg-black text-white">
          <h2 className="m-0 text-2xl">{title}</h2>
        </div>
      )}

      <main className="flex-grow grid-container">
        {/* Sidebar / Nav - Occupies 3 columns on large screens */}
        <nav className="col-span-12 lg:col-span-3 border-right p-md bg-gray-50">
          <ul className="flex flex-col gap-sm">
            <li className="text-mono uppercase font-bold hover:underline cursor-pointer">Dashboard</li>
            <li className="text-mono uppercase font-bold hover:underline cursor-pointer">Entities</li>
            <li className="text-mono uppercase font-bold hover:underline cursor-pointer">Workflows</li>
            <li className="text-mono uppercase font-bold hover:underline cursor-pointer">System Admin</li>
          </ul>
        </nav>

        {/* Content Area - Occupies 9 columns */}
        <div className="col-span-12 lg:col-span-9 p-xl">
          {children}
        </div>
      </main>

      <footer className="border-top p-sm flex justify-between items-center bg-white">
        <div className="text-mono text-xs">DYNAMIC RESOURCE MANAGEMENT ENGINE</div>
        <div className="text-mono text-xs">© 2026 NEO-BRUTALIST ARCH</div>
      </footer>
    </div>
  );
};
