
'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Upload, X, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  onChange: (urls: string[]) => void;
}

export default function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const files = Array.from(e.target.files) as File[];
    const newUrls = [...images];

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        
        newUrls.push(publicUrl);
      }
      onChange(newUrls);
    } catch (error: any) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...images];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {images.map((url, index) => (
          <div key={url + index} className="group relative aspect-square bg-gray-100 rounded border overflow-hidden">
            <img src={url} alt="" className="w-full h-full object-cover" />
            
            {/* Controls */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button 
                type="button"
                onClick={() => moveImage(index, 'left')}
                className="p-1 bg-white rounded-full disabled:opacity-30"
                disabled={index === 0}
              >
                <ArrowLeft size={14} />
              </button>
              <button 
                type="button"
                onClick={() => removeImage(index)}
                className="p-1 bg-red-500 text-white rounded-full"
              >
                <X size={14} />
              </button>
              <button 
                type="button"
                onClick={() => moveImage(index, 'right')}
                className="p-1 bg-white rounded-full disabled:opacity-30"
                disabled={index === images.length - 1}
              >
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 bg-black/60 text-white text-[10px] px-1">
              #{index + 1}
            </div>
          </div>
        ))}
        
        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors">
          {uploading ? <Loader2 className="animate-spin text-gray-400" /> : <Upload className="text-gray-400" />}
          <span className="text-[10px] text-gray-500 mt-1">{uploading ? 'アップロード中' : '追加'}</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      <p className="text-[10px] text-gray-400">※ 最初の画像がメイン画像になります。矢印で順序を調整してください。</p>
    </div>
  );
}
