/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { INITIAL_POSTERS } from './data';
import { Poster } from './types';
import Header from './components/Header';
import PosterCard from './components/PosterCard';
import PosterDetailModal from './components/PosterDetailModal';
import AddPosterModal from './components/AddPosterModal';
import { savePosters, loadPosters } from './utils/storage';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Grid3X3, Filter, Layers, ArrowDown, RotateCcw } from 'lucide-react';

export default function App() {
  const [posters, setPosters] = useState<Poster[]>(() => {
    // 1. URL 파라미터에 전달된 공유 데이터가 있는지 먼저 확인합니다.
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const sharedData = params.get('shared_posters');
        if (sharedData) {
          // URL safe Base64 복호화 후 한글 깨짐 방지 처리
          const decoded = decodeURIComponent(atob(sharedData));
          const parsed = JSON.parse(decoded);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to parse shared URL posters data:', e);
      }
    }

    // 2. URL 공유 데이터가 없다면 기존 로컬스토리지 데이터를 확인합니다.
    try {
      const saved = localStorage.getItem('poster_archive_items');
      if (saved) {
        const loaded: Poster[] = JSON.parse(saved);
        return loaded
          .filter((p) => p.id !== 'default-2')
          .map((p) => {
            if (p.id === 'default-1') {
              return { ...p, week: 'WEEK 05' };
            }
            return p;
          });
      }
    } catch (e) {
      console.error('Failed to parse localStorage data:', e);
    }

    return INITIAL_POSTERS;
  });

  // Navigation / Search Queries
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Modals
  const [selectedPoster, setSelectedPoster] = useState<Poster | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Infinite Scroll Pagination
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Drag and Drop ordering states
  const [draggedPosterId, setDraggedPosterId] = useState<string | null>(null);
  const [dragOverPosterId, setDragOverPosterId] = useState<string | null>(null);

  // Sync state to secure, large-capacity IndexedDB storage engine 및 URL 동기화
  useEffect(() => {
    savePosters(posters).catch((err) => {
      if (err.message === 'QUOTA_EXCEEDED') {
        alert('주의: 브라우저 임시 저장 공간(LocalStorage)의 한계치를 초과하였습니다. 하지만 안전한 IndexedDB 시스템에 추가 본문이 정상적으로 저장되었으므로 사용하시는 데 문제가 없습니다. (브라우저 캐시를 완전히 지우면 업로드된 파일이 초기화될 수 있습니다.)');
      }
    });

    // 사용자가 포스터를 추가/삭제/변경할 때마다 브라우저 주소창의 URL을 실시간 업데이트합니다.
    try {
      const jsonStr = JSON.stringify(posters);
      // 한글 깨짐 방지 인코딩 후 Base64 압축 치환
      const encodedPosters = btoa(encodeURIComponent(jsonStr));
      const newUrl = `${window.location.origin}${window.location.pathname}?shared_posters=${encodedPosters}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    } catch (err) {
      console.error('Failed to update shareable URL:', err);
    }
  }, [posters]);

  // Load larger files/PDF database from IndexedDB on initial mount
  useEffect(() => {
    async function initDB() {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('shared_posters')) return;

        const loaded = await loadPosters();
        if (loaded && loaded.length > 0) {
          setPosters((current) => {
            const curStr = JSON.stringify(current);
            const loadStr = JSON.stringify(loaded);
            if (curStr !== loadStr) {
              return loaded;
            }
            return current;
          });
        }
      } catch (err) {
        console.error('Failed to async-load from IndexedDB:', err);
      }
    }
    initDB();
  }, []);

  // One-time client-side migration
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('shared_posters')) return;
    } catch (e) {
      return;
    }

    setPosters((prevPosters) => {
      let changed = false;

      const hasDefault1 = prevPosters.some((p) => p.id === 'default-1');
      let baseList = [...prevPosters];
      if (!hasDefault1) {
        const originalDefault1 = INITIAL_POSTERS.find((p) => p.id === 'default-1');
        if (originalDefault1) {
          baseList = [originalDefault1, ...baseList];
          changed = true;
        }
      }

      const migrated = baseList
        .filter((p) => {
          if (p.id === 'default-2') {
            changed = true;
            return false;
          }
          return true;
        })
        .map((p) => {
          if (p.id === 'default-1' && p.week !== 'WEEK 05') {
            changed = true;
            return { ...p, week: 'WEEK 05' };
          }
          if (p.week === 'WEEK 04') {
            changed = true;
            return { ...p, week: 'WEEK 05' };
          }
          return p;
        });

      if (changed) {
        return migrated;
      }
      return prevPosters;
    });
  }, []);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedPosterId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedPosterId && draggedPosterId !== id) {
      setDragOverPosterId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedPosterId(null);
    setDragOverPosterId(null);
  };

  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedPosterId && draggedPosterId !== id) {
      handleReorder(draggedPosterId, id);
    }
    setDraggedPosterId(null);
    setDragOverPosterId(null);
  };

  const handleReorder = (draggedId: string, targetId: string) => {
    const fromIndex = posters.findIndex((p) => p.id === draggedId);
    const toIndex = posters.findIndex((p) => p.id === targetId);
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      const updated = [...posters];
      const [draggedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, draggedItem);
      setPosters(updated);
    }
  };

  const filteredPosters = posters.filter((poster) => {
    const searchTarget = `${poster.title} ${poster.subtitle} ${poster.designer} ${poster.subject} ${poster.description}`.toLowerCase();
    return searchTarget.includes(searchQuery.toLowerCase());
  });

  const displayedPosters = filteredPosters.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosters.length;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 3, filteredPosters.length));
      setIsLoadingMore(false);
    }, 650);
  };

  const handleAddPoster = (newPosterData: Omit<Poster, 'id' | 'createdAt'>) => {
    const newPoster: Poster = {
      ...newPosterData,
      id: `poster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setPosters((prev) => [newPoster, ...prev]);
  };

  const handleUpdatePoster = (updatedPoster: Poster) => {
    setPosters((prev) =>
      prev.map((p) => (p.id === updatedPoster.id ? updatedPoster : p))
    );
    setSelectedPoster(updatedPoster);
  };

  const handleResetDefaults = () => {
    if (confirm('아카이브를 초기 상태로 되돌리시겠습니까? 기본 포스터 컬렉션들이 복원됩니다.')) {
      setPosters(INITIAL_POSTERS);
      localStorage.setItem('poster_archive_items', JSON.stringify(INITIAL_POSTERS));
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg text-warm-dark font-sans flex flex-col selection:bg-neutral-900 selection:text-white">
      
      <Header
        onAddClick={() => setIsAddOpen(true)}
        activeFilter="graphic"
        setActiveFilter={() => {}}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onWorkClick={() => {
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <section className="px-6 lg:px-12 pt-36 pb-72 border-b border-neutral-250 bg-gradient-to-b from-[#EAE8E1]/30 to-transparent">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-5xl sm:text-7xl font-extralight tracking-tighter text-[#262626] leading-none uppercase select-none">
              POSTER <br className="sm:hidden" />
              ARCHIVE
            </h1>
            <p className="font-sans text-[11px] font-medium tracking-[0.25em] text-neutral-500 uppercase leading-relaxed">
              HGU 2026-1 GRAPHIC DESIGN
            </p>
          </div>
        </div>
      </section>

      <main className="flex-grow px-6 lg:px-12 pt-12 pb-12 mx-auto max-w-7xl w-full">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-neutral-250">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none font-display text-xs">
            <span className="text-neutral-450 flex items-center gap-1.5 uppercase tracking-[0.2em] text-[9px] font-bold">
              <Filter className="w-3 h-3 text-neutral-800" />
              COLLECTION CATEGORY:
            </span>
            <span className="px-4 py-1.5 rounded-sm border border-neutral-900 bg-[#262626] text-white text-[10px] tracking-widest uppercase font-medium shadow-xs">
              GRAPHIC DESIGN
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-900 transition-colors py-1 cursor-pointer font-medium"
              title="Reset archive to defaults"
              id="btn-reset-catalog"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Archive</span>
            </button>
            <div className="h-4 w-[1px] bg-neutral-350/50" />
            <p className="text-neutral-500">
              Showing <span className="font-bold text-neutral-800">{displayedPosters.length}</span> of {filteredPosters.length} masterpieces
            </p>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {displayedPosters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 w-full" id="uniform-poster-grid">
              {displayedPosters.map((poster) => (
                <PosterCard
                  key={poster.id}
                  poster={poster}
                  onClick={() => {
                    setSelectedPoster(poster);
                    setIsDetailOpen(true);
                  }}
                  onDragStart={(e) => handleDragStart(e, poster.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, poster.id)}
                  onDragEnter={(e) => handleDragEnter(e, poster.id)}
                  onDrop={(e) => handleDrop(e, poster.id)}
                  isDragging={draggedPosterId === poster.id}
                  isDragOver={dragOverPosterId === poster.id}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="py-24 text-center max-w-md mx-auto space-y-4"
              id="empty-state-card"
            >
              <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center mx-auto text-neutral-400 mb-2">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-display text-neutral-800 uppercase tracking-widest font-semibold">No posters registered</h3>
              <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                검색어나 색인에 부합하는 그래픽 디자인 포스터가 없습니다. 새로운 작품을 등록해서 아카이브를 개척해 보세요.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="px-5 py-2.5 bg-[#262626] hover:bg-neutral-800 text-white rounded-sm text-xs font-display font-medium tracking-wide transition-all shadow cursor-pointer uppercase"
                  id="btn-empty-state-add"
                >
                  ADD NEW WORK
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {hasMore && (
          <div className="mt-16 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="group flex flex-col items-center gap-1.5 px-8 py-4 border border-neutral-350/70 hover:border-neutral-900 bg-white text-neutral-800 rounded-sm transition-all duration-300 shadow-xs cursor-pointer disabled:opacity-50 text-center"
              id="btn-infinite-load-more"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-t-neutral-900 border-neutral-200 animate-spin" />
                  <span className="font-display text-[9px] tracking-[0.2em] font-medium uppercase mt-1">CURATING THE NEXT WAVE...</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-3.5 h-3.5 text-neutral-650 group-hover:translate-y-1 transition-transform" />
                  <span className="font-display text-[9px] tracking-[0.2em] font-bold uppercase">LOAD MORE DESIGN COMPOSITIONS</span>
                </>
              )}
            </button>
          </div>
        )}

      </main>

      <footer className="border-t border-neutral-250 bg-white px-6 lg:px-12 py-8 mt-20 text-center">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-display text-[10px] tracking-widest text-[#8E8C84] uppercase">
            © 2026 POSTER ARCHIVE.
          </p>
          <div className="flex items-center gap-6 font-display text-[10px] tracking-widest text-[#8E8C84] uppercase">
            <span>CURATOR : Haein Shin</span>
            <span className="hidden md:inline-block">/</span>
            <span>HGU 2026-1 GRAPHIC DESIGN</span>
          </div>
        </div>
      </footer>

      {selectedPoster && (
        <PosterDetailModal
          isOpen={isDetailOpen}
          poster={selectedPoster}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedPoster(null);
          }}
          onUpdatePoster={handleUpdatePoster}
        />
      )}

      <AddPosterModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddPoster={handleAddPoster}
      />

    </div>
  );
}
