/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Poster } from '../types';
import { Eye, Clock, GripVertical } from 'lucide-react';
import PosterMedia from './PosterMedia';

interface PosterCardProps {
  key?: string;
  poster: Poster;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragging: boolean;
  isDragOver: boolean;
}

const getNaturalBg = (id: string) => {
  const backgrounds = [
    'bg-[#EAE8E1]',
    'bg-[#F2F1ED]',
    'bg-[#DFDDD6]',
    'bg-[#E5E3DB]',
    'bg-[#D4D1C7]'
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return backgrounds[Math.abs(hash) % backgrounds.length];
};

export default function PosterCard({
  poster,
  onClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDrop,
  isDragging,
  isDragOver,
}: PosterCardProps) {
  const dynamicBgClass = getNaturalBg(poster.id);

  return (
    <motion.div
      layoutId={`poster-card-${poster.id}`}
      onClick={(e) => {
        if (isDragging) return;
        onClick();
      }}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDrop={onDrop}
      className={`group relative overflow-hidden rounded-sm ${dynamicBgClass} cursor-grab active:cursor-grabbing border shadow-md hover:shadow-xl hover:ring-2 hover:ring-[#262626] transition-all duration-300 flex flex-col ${
        isDragging ? 'opacity-30 border-dashed border-neutral-400 scale-95' : 'border-neutral-300/65'
      } ${
        isDragOver ? 'ring-4 ring-neutral-800 ring-offset-2 scale-102 z-20' : ''
      }`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: isDragging ? 0.3 : 1, y: 0 }}
      whileHover={isDragging ? {} : { y: -6 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      id={`poster-card-el-${poster.id}`}
    >
      {/* Poster Image Container - Fixed Aspect Ratio 2:3 */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-100">
        {/* Subtle Category Badge - Floating */}
        <span className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-sm bg-white/95 backdrop-blur-md text-[9px] font-display text-[#262626] tracking-widest uppercase border border-neutral-200/80 shadow-xs">
          GRAPHIC
        </span>

        {/* Drag Handle - Floating on Top-Right */}
        <div className="absolute top-4 right-4 z-10 p-1.5 rounded-sm bg-white/95 backdrop-blur-md text-[#262626] border border-neutral-200/80 shadow-xs transition-colors cursor-grab active:cursor-grabbing hover:bg-neutral-100" title="드래그하여 순서 배치 바꾸기">
          <GripVertical className="w-3.5 h-3.5 text-neutral-600" />
        </div>

        {/* The Poster Image */}
        <div className="w-full h-full transition-transform duration-750 ease-out group-hover:scale-108">
          <PosterMedia
            url={poster.imageUrl}
            title={poster.title}
            designer={poster.designer}
            week={poster.week}
            subtitle={poster.subtitle}
            isThumbnail={true}
          />
        </div>

        {/* The Hover Overlay (Blurred Dark Accent with Text Panel) */}
        <div className="absolute inset-0 bg-neutral-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out flex flex-col justify-end p-6 select-none">
          {/* Detailed Info Container */}
          <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <span className="text-xs font-serif italic text-white/90 tracking-wide block mb-1">
              {poster.subtitle || 'Untitled Work'}
            </span>
            <h3 className="text-lg font-display font-medium text-white tracking-wide leading-tight mb-1 uppercase">
              {poster.title}
            </h3>
            
            <div className="h-[1px] w-8 bg-white/40 my-1.5" />

            <div className="flex items-center justify-between text-[10px] font-sans tracking-wider text-white/90 uppercase">
              <span>{poster.designer}</span>
              <span className="font-mono text-white/80">{poster.week}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Bottom strip for standard screen readers / no-hover devices */}
      <div className="p-4 bg-white border-t border-neutral-200/65 flex items-center justify-between mt-auto">
        <div className="truncate pr-2">
          <p className="text-xs font-display font-semibold tracking-wide text-[#262626] truncate uppercase">{poster.title}</p>
          <p className="text-[10px] font-sans text-neutral-500 truncate">{poster.designer}</p>
        </div>
        <span className="font-mono text-[9px] px-2 py-0.5 bg-[#FAF9F6] border border-neutral-200 text-neutral-600 rounded-sm shrink-0">
          {poster.week}
        </span>
      </div>
    </motion.div>
  );
}
