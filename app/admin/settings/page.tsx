'use client';
import { useEffect, useState } from 'react';
import { getSettings, adminUpdateSettings } from '@/lib/supabase/queries';
import { AppSettings } from '@/lib/supabase/types';
import { Save, Plus, Trash2, RotateCcw } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings).catch(e => alert('Failed to load settings'));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    try {
      await adminUpdateSettings(settings);
      alert('設定を保存しました');
    } catch (e) {
      alert('保存に失敗しました');
    }
  };

  if (!settings) return <div>Loading...</div>;

  const slides = (Array.isArray(settings.hero_slides) ? settings.hero_slides : []) as any[];
  const oas = (Array.isArray(settings.line_oas) ? settings.line_oas : []) as any[];

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
            <input className="input-base" value={settings.shop_name} onChange={e => setSettings({...settings, shop_name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">送料無料ライン (¥)</label>
            <input type="number" className="input-base" value={settings.free_shipping_threshold} onChange={e => setSettings({...settings, free_shipping_threshold: Number(e.target.value)})} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">トップページバナーテキスト</label>
            <input className="input-base" value={settings.banner_text || ''} onChange={e => setSettings({...settings, banner_text: e.target.value})} />
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
                         newSlides[i].link = e.target.value;
                         setSettings({...settings, hero_slides: newSlides});
                      }} />
                      <input placeholder="Alt Text" className="input-base" value={slide.alt || ''} onChange={e => {
                         const newSlides = [...slides];
                         newSlides[i].alt = e.target.value;
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
           <h2 className="text-lg font-bold">LINE公式アカウント (OA)</h2>
           <button 
             onClick={() => setSettings({...settings, line_oas: [...oas, { name: '', handle: '', enabled: true }]})}
             className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded flex items-center gap-1"
           >
             <Plus size={14}/> 追加
           </button>
        </div>
        
        <div className="mb-4 flex items-center gap-4">
           <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={settings.line_enabled} onChange={e => setSettings({...settings, line_enabled: e.target.checked})} className="w-5 h-5 accent-green-500" />
              <span className="font-medium">LINE連携を有効にする</span>
           </label>
           <button 
             onClick={() => { if(confirm('輪番インデックスをリセットしますか？')) setSettings({...settings, line_rr_index: 0}); }}
             className="text-xs text-blue-500 hover:underline flex items-center gap-1 ml-auto"
           >
             <RotateCcw size={12} /> 輪番リセット (Current: {settings.line_rr_index})
           </button>
        </div>

        <div className="space-y-4">
           {oas.map((oa, i) => (
             <div key={i} className="flex items-center gap-4 p-3 border border-gray-200 rounded bg-gray-50">
                <input 
                  placeholder="OA名 (例: 担当A)" 
                  className="input-base flex-1" 
                  value={oa.name} 
                  onChange={e => {
                    const newOas = [...oas];
                    newOas[i].name = e.target.value;
                    setSettings({...settings, line_oas: newOas});
                  }} 
                />
                <input 
                  placeholder="Handle (例: @586jucbg)" 
                  className="input-base flex-1" 
                  value={oa.handle} 
                  onChange={e => {
                    const newOas = [...oas];
                    newOas[i].handle = e.target.value;
                    setSettings({...settings, line_oas: newOas});
                  }} 
                />
                <label className="flex items-center gap-2 cursor-pointer px-2">
                   <input 
                     type="checkbox" 
                     checked={oa.enabled} 
                     onChange={e => {
                        const newOas = [...oas];
                        newOas[i].enabled = e.target.checked;
                        setSettings({...settings, line_oas: newOas});
                     }}
                   />
                   <span className="text-xs">有効</span>
                </label>
                <button 
                   onClick={() => {
                      const newOas = [...oas];
                      newOas.splice(i, 1);
                      setSettings({...settings, line_oas: newOas});
                   }} 
                   className="text-red-400 hover:text-red-600"
                >
                   <Trash2 size={16}/>
                </button>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
}