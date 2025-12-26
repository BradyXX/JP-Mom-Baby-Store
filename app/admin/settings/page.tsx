
'use client';
import { useEffect, useState } from 'react';
import { getSettings, adminUpdateSettings } from '@/lib/supabase/queries';
import { AppSettings } from '@/lib/supabase/types';
import { Save, Plus, Trash2, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';
import { normalizeHandle } from '@/lib/utils/line';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then(data => {
        setSettings(data);
        setLoading(false);
        setError(null);
      })
      .catch(e => {
        console.error(e);
        setError(e.message || '設定の読み込みに失敗しました（app_settingsテーブル確認）');
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    
    // Clean LINE OAs: Remove empty, normalize handles, ensure Unique
    const rawOas = (settings.line_oas as string[]) || [];
    const cleanOas = rawOas
      .map(h => normalizeHandle(h))
      .filter(h => h.length > 1);
    const uniqueOas = Array.from(new Set(cleanOas));

    // AUDIT FIX: Explicitly cast types for update to match Partial<AppSettings>
    const newSettings = { 
      ...settings, 
      line_oas: uniqueOas,
      // Ensure hero_slides is valid JSON (array)
      hero_slides: Array.isArray(settings.hero_slides) ? settings.hero_slides : []
    };

    try {
      await adminUpdateSettings(newSettings);
      setSettings(newSettings);
      alert('設定を保存しました');
    } catch (e: any) {
      alert('保存に失敗しました: ' + e.message);
    }
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400"/></div>;

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-3">
          <AlertTriangle size={24} />
          <div>
            <p className="font-bold">エラーが発生しました</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) return <div className="p-8">No data found.</div>;

  // Type Guards for UI
  const slides = (Array.isArray(settings.hero_slides) ? settings.hero_slides : []) as any[];
  const oas = (Array.isArray(settings.line_oas) ? settings.line_oas : []) as string[];

  // Helper to update specific OA index
  const updateOaAtIndex = (index: number, val: string) => {
    const newOas = [...oas];
    newOas[index] = val;
    setSettings({ ...settings, line_oas: newOas });
  };

  const removeOaAtIndex = (index: number) => {
    const newOas = oas.filter((_, i) => i !== index);
    setSettings({ ...settings, line_oas: newOas });
  };

  const addOa = () => {
    setSettings({ ...settings, line_oas: [...oas, '@'] });
  };

  return (
    <div className="max-w-4xl space-y-8 pb-16">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold">ショップ設定</h1>
         <button onClick={handleSave} className="btn-primary flex items-center gap-2 sticky top-4 z-10 shadow-lg">
            <Save size={18} /> 変更を保存
         </button>
      </div>

      {/* Basic Settings */}
      <section className="bg-white p-6 rounded shadow border border-gray-200">
        <h2 className="text-lg font-bold mb-4 border-b pb-2">基本設定</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">ショップ名</label>
            <input className="input-base" value={settings.shop_name} onChange={e => setSettings({...settings, shop_name: (e.target as HTMLInputElement).value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">送料無料ライン (¥)</label>
            <input type="number" className="input-base" value={settings.free_shipping_threshold} onChange={e => setSettings({...settings, free_shipping_threshold: Number((e.target as HTMLInputElement).value)})} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">トップページバナーテキスト</label>
            <input className="input-base" value={settings.banner_text || ''} onChange={e => setSettings({...settings, banner_text: (e.target as HTMLInputElement).value})} />
          </div>
        </div>
      </section>

      {/* Hero Slides */}
      <section className="bg-white p-6 rounded shadow border border-gray-200">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
           <h2 className="text-lg font-bold">Hero Slides</h2>
           <button 
             onClick={() => setSettings({...settings, hero_slides: [...slides, { image_url: '', link: '', alt: '' }]})}
             className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded flex items-center gap-1"
           >
             <Plus size={14}/> 追加
           </button>
        </div>
        <div className="space-y-6">
           {slides.map((slide, i) => (
             <div key={i} className="p-4 border border-gray-200 rounded bg-gray-50 relative">
                <button onClick={() => {
                   const newSlides = [...slides];
                   newSlides.splice(i, 1);
                   setSettings({...settings, hero_slides: newSlides});
                }} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                
                <div className="grid md:grid-cols-2 gap-4">
                   <div>
                      <label className="text-xs font-bold block mb-1">画像URL</label>
                      <div className="mb-2">
                        {slide.image_url && <img src={slide.image_url} className="h-20 object-cover rounded border" />}
                      </div>
                      <ImageUploader 
                        images={[]} 
                        onChange={(urls) => {
                           const newSlides = [...slides];
                           newSlides[i].image_url = urls[0];
                           setSettings({...settings, hero_slides: newSlides});
                        }} 
                      />
                   </div>
                   <div className="space-y-2">
                      <input placeholder="Link URL" className="input-base" value={slide.link || ''} onChange={e => {
                         const newSlides = [...slides];
                         newSlides[i].link = (e.target as HTMLInputElement).value;
                         setSettings({...settings, hero_slides: newSlides});
                      }} />
                      <input placeholder="Alt Text" className="input-base" value={slide.alt || ''} onChange={e => {
                         const newSlides = [...slides];
                         newSlides[i].alt = (e.target as HTMLInputElement).value;
                         setSettings({...settings, hero_slides: newSlides});
                      }} />
                   </div>
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* LINE OA Manager */}
      <section className="bg-white p-6 rounded shadow border border-gray-200">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
           <div className="flex flex-col">
             <h2 className="text-lg font-bold">LINE公式アカウント (OA)</h2>
             <p className="text-xs text-gray-500">注文完了時に使用するLINEアカウントID (@xxxxx) を設定します。</p>
           </div>
           <button 
             onClick={addOa}
             className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded flex items-center gap-1"
           >
             <Plus size={14}/> 追加
           </button>
        </div>
        
        <div className="mb-6 flex items-center gap-4 bg-blue-50 p-3 rounded border border-blue-100">
           <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={settings.line_enabled} onChange={e => setSettings({...settings, line_enabled: (e.target as HTMLInputElement).checked})} className="w-5 h-5 accent-green-500" />
              <span className="font-bold text-gray-700">LINE連携を有効にする</span>
           </label>
           <button 
             onClick={() => { if(confirm('輪番インデックスをリセットしますか？')) setSettings({...settings, line_rr_index: 0}); }}
             className="text-xs text-blue-500 hover:underline flex items-center gap-1 ml-auto"
           >
             <RotateCcw size={12} /> 輪番リセット (Current: {settings.line_rr_index})
           </button>
        </div>

        <div className="space-y-3">
           {oas.length === 0 && (
             <div className="text-center py-4 text-gray-400 text-sm italic border border-dashed rounded">
               アカウントが設定されていません。「追加」ボタンから登録してください。
             </div>
           )}
           {oas.map((handle, i) => (
             <div key={i} className="flex items-center gap-2">
                <div className="bg-gray-100 px-3 py-3 rounded-l border border-r-0 border-gray-300 text-gray-500 font-mono text-sm">
                  OA #{i + 1}
                </div>
                <input 
                  placeholder="@586jucbg" 
                  className="input-base rounded-l-none font-mono text-lg"
                  value={handle} 
                  onChange={e => updateOaAtIndex(i, (e.target as HTMLInputElement).value)}
                  onBlur={e => updateOaAtIndex(i, normalizeHandle((e.target as HTMLInputElement).value))} 
                />
                <button 
                   onClick={() => removeOaAtIndex(i)} 
                   className="p-3 bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 rounded transition-colors"
                >
                   <Trash2 size={18}/>
                </button>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
}
