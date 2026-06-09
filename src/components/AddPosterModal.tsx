/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Link, AlertCircle, Sparkles, FileText } from 'lucide-react';
import { Poster } from '../types';
import PosterMedia from './PosterMedia';

interface AddPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPoster: (poster: Omit<Poster, 'id' | 'createdAt'>) => void;
}

export default function AddPosterModal({
  isOpen,
  onClose,
  onAddPoster,
}: AddPosterModalProps) {
  // Form fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [designer, setDesigner] = useState('');
  const [week, setWeek] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  
  // Image handling
  const [imageType, setImageType] = useState<'upload' | 'url'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPdfStr = (url: string | null): boolean => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('application/pdf') || lower.includes('.pdf') || url.startsWith('data:application/pdf');
  };

  // File to Base64 conversion
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('File is too large (maximum 3MB for database storage restrictions)');
        return;
      }
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setImageUrl(base64String); // store base64 in data
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!designer.trim()) {
      setError('Designer/Artist is required');
      return;
    }
    
    let finalImageUrl = imageUrl;
    if (imageType === 'url' && !imageUrl.trim()) {
      // Fallback elegant placeholder
      finalImageUrl = 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=800&h=1200';
    } else if (imageType === 'upload' && !imagePreview) {
      setError('Please upload an image file or switch to URL mode');
      return;
    }

    onAddPoster({
      title: title.trim(),
      subtitle: subtitle.trim(),
      designer: designer.trim(),
      week: week.trim() ? (week.toUpperCase().startsWith('WEEK') ? week.trim() : `WEEK ${week.trim()}`) : 'WEEK --',
      subject: subject.trim() || 'General Typographical Study',
      category: 'graphic', // Fixed category
      description: description.trim() || 'Notes on typography & layout patterns.',
      imageUrl: finalImageUrl,
      additionalImages: [], // Initialize empty sub-images array
    });

    // Reset Form
    setTitle('');
    setSubtitle('');
    setDesigner('');
    setWeek('');
    setSubject('');
    setDescription('');
    setImageUrl('');
    setImagePreview(null);
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-md"
            id="modal-backdrop-add"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-xl bg-warm-bg rounded-sm overflow-hidden shadow-2xl border border-neutral-350/60 p-6 md:p-8 max-h-[90vh] overflow-y-auto z-10"
            id="modal-content-add"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-300 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-display font-light text-neutral-900 uppercase tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-neutral-800" />
                  ARCHIVE NEW WORK
                </h2>
                <p className="text-[10px] font-sans text-[#8E8C84] mt-1 uppercase tracking-wider">
                  Create a new uniform graphic masterpiece registry.
                </p>
              </div>
              <button
                onClick={onClose}
                type="button"
                className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-800 hover:bg-neutral-900 hover:text-white transition-colors duration-200 cursor-pointer"
                id="btn-close-add"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-155 rounded-sm flex items-center gap-2 text-xs text-red-650 font-sans">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Image Input Methods selector */}
              <div className="bg-[#F2F1ED] p-4 rounded-sm border border-neutral-300 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-300/60 pb-2 mb-2">
                  <span className="text-[9px] font-display font-bold tracking-widest text-[#8E8C84] uppercase">
                    POSTER IMAGE SOURCE
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => { setImageType('url'); setError(''); }}
                      className={`px-3 py-1 text-[9px] tracking-widest uppercase transition-colors rounded-sm cursor-pointer ${
                        imageType === 'url' ? 'bg-[#262626] text-white font-medium' : 'text-neutral-500 hover:text-neutral-900 bg-white border border-neutral-200'
                      }`}
                      id="btn-select-url"
                    >
                      <Link className="w-2.5 h-2.5 inline-block mr-1 align-text-bottom" />
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => { setImageType('upload'); setError(''); }}
                      className={`px-3 py-1 text-[9px] tracking-widest uppercase transition-colors rounded-sm cursor-pointer ${
                        imageType === 'upload' ? 'bg-[#262626] text-white font-medium' : 'text-neutral-500 hover:text-neutral-900 bg-white border border-neutral-200'
                      }`}
                      id="btn-select-upload"
                    >
                      <Upload className="w-2.5 h-2.5 inline-block mr-1 align-text-bottom" />
                      Upload
                    </button>
                  </div>
                </div>

                {imageType === 'url' ? (
                  <div className="space-y-1">
                    <label className="text-[9px] font-display font-bold tracking-widest text-[#8E8C84] uppercase block">
                      Image URL Address
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-sm border border-neutral-300 bg-white focus:border-[#262626] focus:outline-none font-mono text-neutral-800 transition-all placeholder-neutral-400"
                      id="input-url-value"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 hover:border-neutral-500 rounded-sm p-5 bg-white transition-colors cursor-pointer" onClick={triggerFileSelect}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                      className="hidden"
                      id="input-file-value"
                    />
                    <Upload className="w-6 h-6 text-[#8E8C84] mb-1" />
                    <p className="text-xs font-sans text-neutral-850 font-medium">Click to select image or PDF file</p>
                    <p className="text-[9px] font-sans text-neutral-400 mt-0.5">JPG, PNG, WebP or PDF (max 3MB)</p>
                  </div>
                )}

                {/* Live Image/PDF Preview */}
                {imagePreview && (
                  <div className="mt-2 flex items-center justify-center p-1.5 rounded-sm bg-white border border-neutral-300">
                    <div className="relative w-full h-44 overflow-hidden rounded-xs bg-neutral-100 flex items-center justify-center">
                      <PosterMedia
                        url={imagePreview}
                        title={title || 'New Poster'}
                        designer={designer || 'Unknown Designer'}
                        week={week || 'WEEK --'}
                        className="max-h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageUrl('');
                        }}
                        className="absolute top-1 right-1 rounded-full bg-red-500 text-white p-1 hover:bg-red-650 z-20 shadow-md cursor-pointer transition-colors"
                        title="Remove media"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Text Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Poster Title */}
                <div className="space-y-1">
                  <label className="text-[9px] font-display font-bold tracking-widest text-[#8E8C84] uppercase">
                    POSTER TITLE (포스터 제목) *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. MONOSPACE 2026"
                    className="w-full px-3 py-2 text-xs rounded-sm border border-neutral-300 bg-[#F2F1ED] hover:bg-white focus:bg-white focus:border-[#262626] focus:outline-none text-neutral-800 transition-all placeholder-neutral-400"
                    id="input-add-title"
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-1">
                  <label className="text-[9px] font-display font-bold tracking-widest text-[#8E8C84] uppercase">
                    SUBTITLE (서브타이틀)
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Typographical Study"
                    className="w-full px-3 py-2 text-xs rounded-sm border border-neutral-300 bg-[#F2F1ED] hover:bg-white focus:bg-white focus:border-[#262626] focus:outline-none text-neutral-800 transition-all placeholder-neutral-400"
                    id="input-add-sub"
                  />
                </div>

                {/* Designer */}
                <div className="space-y-1">
                  <label className="text-[9px] font-display font-bold tracking-widest text-[#8E8C84] uppercase">
                    DESIGNER / ARTIST *
                  </label>
                  <input
                    type="text"
                    required
                    value={designer}
                    onChange={(e) => setDesigner(e.target.value)}
                    placeholder="e.g. Emil Ruder Studio"
                    className="w-full px-3 py-2 text-xs rounded-sm border border-neutral-300 bg-[#F2F1ED] hover:bg-white focus:bg-white focus:border-[#262626] focus:outline-none text-neutral-800 transition-all placeholder-neutral-400"
                    id="input-add-designer"
                  />
                </div>

                {/* Week */}
                <div className="space-y-1">
                  <label className="text-[9px] font-display font-bold tracking-widest text-[#8E8C84] uppercase">
                    PRODUCTION WEEK
                  </label>
                  <input
                    type="text"
                    value={week}
                    onChange={(e) => setWeek(e.target.value)}
                    placeholder="e.g. WEEK 15"
                    className="w-full px-3 py-2 text-xs rounded-sm border border-neutral-300 bg-[#F2F1ED] hover:bg-white focus:bg-white focus:border-[#262626] focus:outline-none text-neutral-800 font-mono transition-all placeholder-neutral-400"
                    id="input-add-week"
                  />
                </div>

                {/* Subject Topic */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9px] font-display font-bold tracking-widest text-[#8E8C84] uppercase">
                    SUBJECT (주제)
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Modernist Typography Festival"
                    className="w-full px-3 py-2 text-xs rounded-sm border border-neutral-300 bg-[#F2F1ED] hover:bg-white focus:bg-white focus:border-[#262626] focus:outline-none text-neutral-800 transition-all placeholder-neutral-400"
                    id="input-add-subject"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9px] font-display font-bold tracking-widest text-[#8E8C84] uppercase">
                    DESCRIPTION (상세 설명)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the aesthetic background, materials used or design rules..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-sm border border-neutral-300 bg-[#F2F1ED] hover:bg-white focus:bg-white focus:border-[#262626] focus:outline-none text-neutral-800 leading-relaxed resize-none transition-all placeholder-neutral-400"
                    id="input-add-desc"
                  />
                </div>

              </div>

              {/* Submit Buttons */}
              <div className="border-t border-neutral-250 pt-5 mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-sm text-xs font-display tracking-widest transition-colors cursor-pointer uppercase"
                  id="btn-add-cancel"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#262626] hover:bg-neutral-850 text-white rounded-sm text-xs font-display font-medium tracking-widest shadow-md transition-all cursor-pointer uppercase"
                  id="btn-add-submit"
                >
                  ADD TO ARCHIVE
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
