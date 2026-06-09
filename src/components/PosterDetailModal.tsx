/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Poster } from '../types';
import { X, Calendar, BookOpen, Quote, Save, CheckCircle, Image, Plus, Trash2, Upload } from 'lucide-react';
import PosterMedia, { isPdf } from './PosterMedia';

interface PosterDetailModalProps {
  poster: Poster;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePoster: (updatedPoster: Poster) => void;
}

export default function PosterDetailModal({
  poster,
  isOpen,
  onClose,
  onUpdatePoster,
}: PosterDetailModalProps) {
  // Local states for editing elements in the modal
  const [title, setTitle] = useState(poster.title);
  const [subtitle, setSubtitle] = useState(poster.subtitle || '');
  const [designer, setDesigner] = useState(poster.designer);
  const [category, setCategory] = useState(poster.category || 'graphic');
  const [description, setDescription] = useState(poster.description);
  const [week, setWeek] = useState(poster.week);
  const [subject, setSubject] = useState(poster.subject);
  const [isSaved, setIsSaved] = useState(false);
  
  // Multiple Images Management
  const [imageUrl, setImageUrl] = useState(poster.imageUrl);
  const [activePreviewImage, setActivePreviewImage] = useState(poster.imageUrl);
  const [additionalImages, setAdditionalImages] = useState<string[]>(poster.additionalImages || []);
  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const [mainUrlInput, setMainUrlInput] = useState('');
  const subFileInputRef = React.useRef<HTMLInputElement>(null);
  const mainFileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync state if poster details change
  useEffect(() => {
    setTitle(poster.title);
    setSubtitle(poster.subtitle || '');
    setDesigner(poster.designer);
    setCategory(poster.category || 'graphic');
    setDescription(poster.description);
    setWeek(poster.week);
    setSubject(poster.subject);
    setImageUrl(poster.imageUrl);
    setActivePreviewImage(poster.imageUrl);
    setAdditionalImages(poster.additionalImages || []);
  }, [poster, isOpen]);

  // Merge primary and additional posters for previews
  const allCollectionImages = Array.from(new Set([imageUrl, ...additionalImages])).filter(Boolean);

  const handleSave = () => {
    const updatedWeek = week.toUpperCase().startsWith('WEEK') ? week : `WEEK ${week}`;
    onUpdatePoster({
      ...poster,
      title,
      subtitle,
      designer,
      category,
      description,
      week: updatedWeek,
      subject,
      imageUrl,
      additionalImages,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  // Add more poster images to this archive piece
  const handleAddNewPosterImage = () => {
    if (!newImageUrlInput.trim()) return;
    if (!additionalImages.includes(newImageUrlInput.trim())) {
      const updatedList = [...additionalImages, newImageUrlInput.trim()];
      setAdditionalImages(updatedList);
      setActivePreviewImage(newImageUrlInput.trim());
    }
    setNewImageUrlInput('');
  };

  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('File size is too large (maximum 3MB for local storage storage limits)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageUrl(base64String);
        setActivePreviewImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveMainCover = () => {
    if (additionalImages.length > 0) {
      const nextMain = additionalImages[0];
      setImageUrl(nextMain);
      setAdditionalImages(additionalImages.slice(1));
      setActivePreviewImage(nextMain);
    } else {
      setImageUrl('');
      setActivePreviewImage('');
    }
  };

  const handleSetAsMain = (urlToSet: string) => {
    const oldMain = imageUrl;
    setImageUrl(urlToSet);
    
    const cleanedAdd = additionalImages.filter(img => img !== urlToSet);
    if (oldMain && !cleanedAdd.includes(oldMain)) {
      setAdditionalImages([oldMain, ...cleanedAdd]);
    } else {
      setAdditionalImages(cleanedAdd);
    }
    
    setActivePreviewImage(urlToSet);
  };

  // Local PDF/image file change handler
  const handleSubFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('File size is too large (maximum 3MB for local storage storage limits)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (!additionalImages.includes(base64String)) {
          const updatedList = [...additionalImages, base64String];
          setAdditionalImages(updatedList);
          setActivePreviewImage(base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Delete a sub-image from this collection
  const handleDeleteSubImage = (urlToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (urlToDelete === imageUrl) return;
    
    const updatedList = additionalImages.filter(img => img !== urlToDelete);
    setAdditionalImages(updatedList);
    if (activePreviewImage === urlToDelete) {
      setActivePreviewImage(imageUrl);
    }
  };

  // Helper to safely open PDFs in new tab (bypassing nested iframe base64 block)
  const openPdfInNewTab = (base64OrUrl: string) => {
    try {
      if (base64OrUrl.startsWith('data:application/pdf')) {
        const parts = base64OrUrl.split(';base64,');
        if (parts.length > 1) {
          const rawBase64 = parts[1];
          const bString = atob(rawBase64);
          const len = bString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = bString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          const newWindow = window.open();
          if (newWindow) {
            newWindow.location.href = blobUrl;
          } else {
            // fallback: direct download
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `${poster.title || 'poster'}-document.pdf`;
            a.click();
          }
          return;
        }
      }
      window.open(base64OrUrl, '_blank');
    } catch (e) {
      console.error("Failed to open PDF in new tab:", e);
      window.open(base64OrUrl, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md"
            id="modal-backdrop-detail"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative w-full max-w-5xl bg-warm-bg rounded-2xl grid md:grid-cols-2 overflow-y-auto md:overflow-hidden shadow-2xl border border-neutral-300/60 max-h-[90vh] md:max-h-[85vh] md:h-[80vh] z-10"
            id="modal-content-container"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-800 hover:bg-neutral-900 hover:text-white transition-colors duration-200 shadow-xs cursor-pointer focus:outline-none"
              id="btn-close-detail"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Column: Immersive scrollable gallery for multiple posters as requested */}
            <div className="relative bg-[#F2F1ED] flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-neutral-300/50 h-[480px] md:h-auto select-none">
              <div className="absolute inset-0 bg-[radial-gradient(#d4d1c7_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
              
              {/* Internal scroll view header */}
              <div className="p-4 bg-[#FAF9F6] border-b border-neutral-300/60 z-10 flex items-center justify-between shadow-xs">
                <span className="text-[9px] font-display font-semibold tracking-widest text-neutral-500 uppercase">
                  POSTER GALLERY FEED ({allCollectionImages.length})
                </span>
                <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest animate-pulse">
                  ⬇ SCROLL TO VIEW ALL
                </span>
              </div>

              {/* Scrollable Posters Feed */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6 max-h-[420px] md:max-h-[75vh] scrollbar-thin">
                {allCollectionImages.map((imgUrl, index) => {
                  const isPrimary = imgUrl === imageUrl;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative flex flex-col items-center bg-white p-3 rounded-md border border-neutral-300/50 shadow-xs hover:shadow-md transition-shadow group"
                    >
                      {/* Top metadata strip */}
                      <div className="w-full flex justify-between items-center text-[9px] font-mono text-[#8E8C84] pb-2 mb-2 border-b border-neutral-200">
                        <span className="font-semibold">POSTER #{index + 1} {isPrimary ? '(MAIN COVER)' : ''}</span>
                        <div className="flex items-center gap-1.5">
                          {isPdf(imgUrl) && (
                            <button
                              type="button"
                              onClick={() => openPdfInNewTab(imgUrl)}
                              className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors flex items-center gap-1 cursor-pointer font-bold px-1.5 py-0.5 rounded text-[8px] border border-indigo-200"
                              title="Open original high-res PDF in new browser tab"
                            >
                              <BookOpen className="w-2.5 h-2.5" />
                              <span>VIEW ORIGINAL PDF</span>
                            </button>
                          )}
                          {isPrimary && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('대표 커버 이미지를 삭제하시겠습니까? (삭제 시 빈 상태가 되거나 다음 추가 이미지가 대표가 됩니다)')) {
                                  handleRemoveMainCover();
                                }
                              }}
                              className="text-amber-700 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 transition-colors flex items-center gap-1 cursor-pointer font-bold px-1.5 py-0.5 rounded text-[8px] border border-amber-250"
                              title="Remove the primary cover image"
                            >
                              <Trash2 className="w-2.5 h-2.5 text-amber-600" />
                              <span>REMOVE COVER</span>
                            </button>
                          )}
                          {!isPrimary && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSetAsMain(imgUrl)}
                                className="text-emerald-700 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer font-bold px-1.5 py-0.5 rounded text-[8px] border border-emerald-300"
                                title="Set this poster as the main display cover"
                              >
                                <span>SET AS COVER</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSubImage(imgUrl, e)}
                                className="text-red-500 hover:text-red-650 transition-colors flex items-center gap-1 cursor-pointer font-bold px-1 py-0.5 rounded hover:bg-red-50 text-[8px] border border-red-200"
                                title="Remove this poster page"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                                <span>REMOVE</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Poster Content Panel */}
                      <div className={`w-full ${isPdf(imgUrl) ? 'h-[500px]' : 'aspect-[2/3] max-h-[380px]'} overflow-hidden flex items-center justify-center rounded-sm bg-[#FAF9F6] relative border border-neutral-200/50`}>
                        <PosterMedia
                          url={imgUrl}
                          title={title}
                          designer={designer}
                          week={week}
                          subtitle={subtitle}
                          isThumbnail={false}
                        />
                      </div>
                    </motion.div>
                  );
                })}

                {allCollectionImages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-400">
                    <p className="text-xs font-mono uppercase tracking-widest">No posters added yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Information & EDIT/WRITE PLACARD (적는 칸 & 설명) */}
            <div className="flex flex-col h-full overflow-y-auto p-6 md:p-10 bg-warm-bg justify-between">
              <div>
                {/* Header Info */}
                <div className="mb-6">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 block mb-1 font-semibold">
                    {category} archive registry
                  </span>
                  <h2 className="text-2xl md:text-3xl font-display font-light text-neutral-900 tracking-tight uppercase leading-tight">
                    {title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-serif italic text-[#8E8C84]">
                      Designed by {designer}
                    </span>
                    <span className="text-[9px] bg-[#F2F1ED] px-2 py-0.5 border border-neutral-350/50 rounded-sm text-neutral-700 font-medium">
                      {subtitle || 'Original Masterpiece'}
                    </span>
                  </div>

                  {isPdf(poster.imageUrl) && (
                    <div className="mt-4 p-3 bg-indigo-50/80 border border-indigo-200 rounded-sm flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-800 tracking-wider uppercase">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        <span>PDF DOCUMENT DETECTED</span>
                      </div>
                      <p className="text-[9px] text-[#4A4B57] leading-relaxed">
                        이 포스터는 고품질 벡터 PDF 문서입니다. 브라우저 보안 제약 없이 원본 그대로 보거나 출력하시려면 아래 단추를 활성화해 주세요.
                      </p>
                      <button
                        type="button"
                        onClick={() => openPdfInNewTab(poster.imageUrl)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-[9px] font-display font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>원본 PDF 새 탭에서 전체화면 보기</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct Input & Text Fields for description, week, and subject */}
                <div className="space-y-5">
                  
                  {/* TITLE Edit Field */}
                  <div className="space-y-1 animate-fade-in">
                    <label className="block text-[9px] uppercase tracking-widest text-[#8E8C84] font-bold">
                      TITLE (메인 타이틀)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. SWISS GRID SYSTEM"
                      className="w-full px-3 py-2 bg-[#F2F1ED] hover:bg-[#EAE8E1]/40 focus:bg-white border border-neutral-300 rounded-sm focus:border-[#262626] focus:outline-none font-sans text-xs text-neutral-800 font-bold uppercase transition-all placeholder-neutral-400"
                      id="input-detail-title"
                    />
                  </div>

                  {/* SUBTITLE Edit Field */}
                  <div className="space-y-1 animate-fade-in">
                    <label className="block text-[9px] uppercase tracking-widest text-[#8E8C84] font-bold">
                      SUBTITLE (서브 타이틀)
                    </label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="e.g. Exhibition of Swiss Grid Construction"
                      className="w-full px-3 py-2 bg-[#F2F1ED] hover:bg-[#EAE8E1]/40 focus:bg-white border border-neutral-300 rounded-sm focus:border-[#262626] focus:outline-none font-sans text-xs text-neutral-800 transition-all placeholder-neutral-400"
                      id="input-detail-subtitle"
                    />
                  </div>

                  {/* DESIGNER Edit Field */}
                  <div className="space-y-1 animate-fade-in">
                    <label className="block text-[9px] uppercase tracking-widest text-[#8E8C84] font-bold">
                      DESIGNER (디자이너)
                    </label>
                    <input
                      type="text"
                      value={designer}
                      onChange={(e) => setDesigner(e.target.value)}
                      placeholder="e.g. Josef Müller-Brockmann"
                      className="w-full px-3 py-2 bg-[#F2F1ED] hover:bg-[#EAE8E1]/40 focus:bg-white border border-neutral-300 rounded-sm focus:border-[#262626] focus:outline-none font-serif italic text-xs text-neutral-800 transition-all placeholder-neutral-400"
                      id="input-detail-designer"
                    />
                  </div>

                  {/* 1. WEEK Indicator & Edit Field */}
                  <div className="space-y-1 animate-fade-in">
                    <label className="block text-[9px] uppercase tracking-widest text-[#8E8C84] font-bold">
                      WEEK (제작 주차)
                    </label>
                    <input
                      type="text"
                      value={week}
                      onChange={(e) => setWeek(e.target.value)}
                      placeholder="e.g. WEEK 12"
                      className="w-full px-3 py-2 bg-[#F2F1ED] hover:bg-[#EAE8E1]/40 focus:bg-white border border-neutral-300 rounded-sm focus:border-[#262626] focus:outline-none font-mono text-xs text-neutral-800 transition-all placeholder-neutral-400"
                      id="input-detail-week"
                    />
                  </div>

                  {/* 2. SUBJECT Topic Field */}
                  <div className="space-y-1 animate-fade-in">
                    <label className="block text-[9px] uppercase tracking-widest text-[#8E8C84] font-bold">
                      SUBJECT (주제)
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Retro-Futurism"
                      className="w-full px-3 py-2 bg-[#F2F1ED] hover:bg-[#EAE8E1]/40 focus:bg-white border border-neutral-300 rounded-sm focus:border-[#262626] focus:outline-none font-sans text-xs text-neutral-800 transition-all placeholder-neutral-400"
                      id="input-detail-subject"
                    />
                  </div>

                  {/* 3. DESCRIPTION / EXPLANATION TextArea Field */}
                  <div className="space-y-1 animate-fade-in">
                    <label className="block text-[9px] uppercase tracking-widest text-[#8E8C84] font-bold">
                      DESCRIPTION (상세 설명)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Notes on visual language, graphic design rules..."
                      rows={3}
                      className="w-full px-3 py-2 bg-[#F2F1ED] hover:bg-[#EAE8E1]/40 focus:bg-white border border-neutral-300 rounded-sm focus:border-[#262626] focus:outline-none font-sans text-xs text-neutral-800 leading-relaxed resize-none transition-all placeholder-neutral-400"
                      id="input-detail-desc"
                    />
                  </div>

                  {/* Direct Main Cover Upload / URL section */}
                  <div className="space-y-2 pt-3 border-t border-neutral-200/50 bg-[#EAE8E1]/20 p-3 rounded-sm border border-neutral-300">
                    <label className="block text-[9px] uppercase tracking-widest text-[#8E8C84] font-bold">
                      REPLACE MAIN DISPLAY COVER (대표 포스터 파일 업로드/변경)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={mainUrlInput}
                        onChange={(e) => setMainUrlInput(e.target.value)}
                        placeholder="https://images.unsplash.com/... or PDF URL"
                        className="flex-grow px-3 py-1.5 bg-white border border-neutral-300 rounded-sm focus:border-[#262626] focus:outline-none font-mono text-[10px] text-neutral-800 transition-all placeholder-neutral-400"
                        id="input-main-cover-url"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (mainUrlInput.trim()) {
                            setImageUrl(mainUrlInput.trim());
                            setActivePreviewImage(mainUrlInput.trim());
                            setMainUrlInput('');
                          }
                        }}
                        className="px-3 bg-[#262626] text-white hover:bg-neutral-850 rounded-sm text-[10px] uppercase font-display tracking-wider flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                        id="btn-replace-main-url"
                      >
                        적용
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={mainFileInputRef}
                        onChange={handleMainFileChange}
                        accept="image/*,application/pdf"
                        className="hidden"
                        id="input-main-file-selector"
                      />
                      <button
                        type="button"
                        onClick={() => mainFileInputRef.current?.click()}
                        className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 border border-amber-300/80 text-[10px] font-display font-medium tracking-widest rounded-sm flex items-center justify-center gap-1.5 cursor-pointer uppercase transition-all"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-700" />
                        <span>UPLOAD MAIN COVER (IMAGE / PDF)</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. INSERT MORE POSTERS (다른 여러 포스터 이미지 추가 삽입) */}
                  <div className="space-y-2 pt-2 border-t border-neutral-200/50">
                    <label className="block text-[9px] uppercase tracking-widest text-[#8E8C84] font-bold">
                      INSERT MORE IMAGES/PDFs (추가 포스터/PDF 삽입)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newImageUrlInput}
                        onChange={(e) => setNewImageUrlInput(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-... or PDF URL"
                        className="flex-grow px-3 py-1.5 bg-[#F2F1ED] hover:bg-[#EAE8E1]/40 focus:bg-white border border-neutral-300 rounded-sm focus:border-[#262626] focus:outline-none font-mono text-[10px] text-neutral-800 transition-all placeholder-neutral-400"
                        id="input-new-subimage-url"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewPosterImage}
                        className="px-3 bg-[#262626] text-white hover:bg-neutral-805 rounded-sm text-[10px] uppercase font-display tracking-wider flex items-center gap-1 cursor-pointer shrink-0"
                        id="btn-add-subimage"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>URL</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={subFileInputRef}
                        onChange={handleSubFileChange}
                        accept="image/*,application/pdf"
                        className="hidden"
                        id="input-sub-file-selector"
                      />
                      <button
                        type="button"
                        onClick={() => subFileInputRef.current?.click()}
                        className="w-full py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-[10px] text-[#262626] font-display font-medium tracking-widest rounded-sm flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>CHOOSE LOCAL IMAGE / PDF FILE</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Actions Side / Save panel */}
              <div className="mt-6 pt-4 border-t border-neutral-200/50 flex items-center justify-between gap-4">
                <span className="text-[9px] font-sans text-neutral-400">
                  Last Updated: {new Date().toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  {/* Save feedback banner */}
                  <AnimatePresence>
                    {isSaved && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="text-[10px] text-neutral-900 flex items-center gap-1 font-semibold bg-green-50/70 border border-emerald-100 px-2 py-1 rounded"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        변경 완료
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-[#262626] text-white hover:bg-neutral-800 rounded-sm text-xs font-display font-medium tracking-widest shadow-md transition-colors cursor-pointer uppercase"
                    id="btn-detail-save"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>SAVE CHANGES</span>
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
