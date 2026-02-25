import { Link, useLocation } from 'react-router';
import { LayoutDashboard, AlertTriangle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F172A] text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold">PMO</h2>
              <p className="text-xs text-gray-400">Executive Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <Link
              to="/"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/')
                  ? 'bg-[#1E3A8A] text-white'
                  : 'text-gray-400 hover:bg-[#1E293B] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Executive Overview</span>
            </Link>

            <Link
              to="/board-summary"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/board-summary')
                  ? 'bg-[#1E3A8A] text-white'
                  : 'text-gray-400 hover:bg-[#1E293B] hover:text-white'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Board Summary</span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            <p>Last updated:</p>
            <p className="font-medium text-white">Feb 24, 2026</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
