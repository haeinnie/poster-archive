/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plus, Search, Archive } from 'lucide-react';

interface HeaderProps {
  onAddClick: () => void;
  activeFilter: string;
  setActiveFilter: (filter: 'all' | 'movie' | 'exhibition' | 'graphic') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onWorkClick: () => void;
}

export default function Header({
  onAddClick,
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
  onWorkClick,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-warm-gray/10 bg-warm-bg/90 backdrop-blur-md px-6 lg:px-12 py-5">
      <div className="mx-auto max-auto max-w-7xl flex items-center justify-between">
        
        {/* Left Side: Logo */}
        <button 
          onClick={onWorkClick}
          className="flex items-center gap-2 group cursor-pointer text-left"
          id="btn-logo-header"
        >
          <div className="w-8 h-8 rounded-full border border-warm-dark flex items-center justify-center bg-warm-dark text-warm-bg group-hover:bg-warm-accent group-hover:border-warm-accent transition-all duration-300">
            <span className="font-display text-xs font-semibold tracking-wider">PA</span>
          </div>
          <span className="font-display text-xs font-medium tracking-widest text-warm-dark uppercase hidden sm:inline-block">
            POSTER ARCHIVE
          </span>
        </button>

        {/* Center: Work Category (The sole required category) */}
        <nav className="flex items-center gap-8 text-[11px] font-medium tracking-[0.2em] uppercase">
          <button
            onClick={onWorkClick}
            className="text-neutral-900 border-b border-neutral-900 pb-1 font-display tracking-[0.2em] transition-all cursor-pointer"
            id="tab-work-header"
          >
            work
          </button>
        </nav>

        {/* Right Side: Search and Register Buttons */}
        <div className="flex items-center gap-4">
          {/* Subtle Search Bar */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search art, designer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 xl:w-64 pl-8 pr-4 py-1.5 rounded-full border border-warm-gray/20 bg-transparent text-xs font-sans text-warm-dark placeholder-warm-gray/50 focus:outline-none focus:border-warm-accent transition-all"
              id="search-input-header"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-warm-gray" />
          </div>

          <button
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-4 py-2 border border-warm-dark hover:border-warm-accent hover:bg-warm-accent text-warm-dark hover:text-white rounded-full transition-all duration-300 ease-out cursor-pointer font-display text-xs font-medium tracking-wide"
            id="btn-add-poster-header"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD WORK</span>
          </button>
        </div>
      </div>
    </header>
  );
}
