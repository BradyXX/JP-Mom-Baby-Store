'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, X, ArrowRight, CheckCircle2, AlertTriangle, Loader2, Download, FileText } from 'lucide-react';
import { processImportBatch, ImportSettings } from '@/app/actions/import-products';
import { SHOP_CATEGORIES } from '@/lib/categories';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Potential DB Fields
const DB_FIELDS = [
  { key: 'ignore', label: '--- 無視 ---' },
  { key: 'title_jp', label: '商品名 (必須)' },
  { key: 'price', label: '価格 (RMB/JPY)' },
  { key: 'compare_at_price', label: '定価 (RMB/JPY)' },
  { key: 'images', label: '画像URL' },
  { key: 'stock_qty', label: '在庫数' },
  { key: 'sku', label: 'SKU' },
  { key: 'slug', label: 'Slug (URL)' },
  { key: 'short_desc_jp', label: '短い説明' },
  { key: 'tags', label: 'タグ' },
  { key: 'collection_handles', label: 'コレクション' },
];

export default function CsvImportModal({ isOpen, onClose, onSuccess }: CsvImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1:Upload, 2:Map/Settings, 3:Processing/Result
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  
  // Settings
  const [settings, setSettings] = useState<ImportSettings>({
    exchangeRate: 20,
    roundingRule: 100,
    defaultStock: 999,
    collectionHandle: 'baby-clothing',
    mode: 'insert'
  });

  // Processing
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // --- Step 1: File Parse ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setCsvData(results.data);
          const keys = Object.keys(results.data[0] as object);
          setHeaders(keys);
          
          // Auto-guess mapping
          const initialMap: Record<string, string> = {};
          keys.forEach(h => {
            const lower = h.toLowerCase();
            if (lower.includes('title') || lower.includes('name')) initialMap[h] = 'title_jp';
            else if (lower.includes('price')) initialMap[h] = 'price';
            else if (lower.includes('image') || lower.includes('img')) initialMap[h] = 'images';
            else if (lower.includes('sku')) initialMap[h] = 'sku';
            else if (lower.includes('stock')) initialMap[h] = 'stock_qty';
            else if (lower.includes('desc')) initialMap[h] = 'short_desc_jp';
            else initialMap[h] = 'ignore';
          });
          setMapping(initialMap);
          setStep(2);
        }
      },
      error: (err) => {
        alert('CSV解析エラー: ' + err.message);
      }
    });
  };

  // --- Step 3: Execution ---
  const startImport = async () => {
    setStep(3);
    setIsProcessing(true);
    setLogs([]);
    setProgress(0);

    const BATCH_SIZE = 5; // Process 5 rows at a time to prevent timeout & handle images
    const total = csvData.length;
    let processed = 0;
    const allLogs: any[] = [];

    // Batched loop
    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = csvData.slice(i, i + BATCH_SIZE);
      
      try {
        const result = await processImportBatch(batch, mapping, settings);
        
        // Merge logs
        result.rowResults.forEach(r => {
           allLogs.push({ ...r, index: r.index + i });
        });
        
        processed += batch.length;
        setProgress(Math.round((processed / total) * 100));
        setLogs([...allLogs]); // Update UI log

      } catch (e: any) {
        // Critical batch error
        console.error(e);
        allLogs.push({ index: i, title: 'Batch Error', status: 'error', message: e.message });
      }
    }

    setIsProcessing(false);
    // Note: Don't autoclose, let user see report
  };

  const downloadErrorLog = () => {
    const errors = logs.filter(l => l.status === 'error');
    if (errors.length === 0) return alert('エラーはありません');
    
    const csv = Papa.unparse(errors);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'import_errors.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={isProcessing ? undefined : onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
           <h2 className="text-lg font-bold flex items-center gap-2">
             <FileText size={20} className="text-primary"/> 
             CSVインポート
           </h2>
           {!isProcessing && (
             <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
               <X size={20} />
             </button>
           )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* STEP 1: Upload */}
          {step === 1 && (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
               <input 
                 ref={fileInputRef}
                 type="file" 
                 accept=".csv"
                 onChange={handleFileChange} 
                 className="hidden" 
               />
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="flex flex-col items-center gap-3"
               >
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                    <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-700">CSVファイルをアップロード</p>
                    <p className="text-xs text-gray-400 mt-1">UTF-8 エンコード推奨</p>
                  </div>
               </button>
            </div>
          )}

          {/* STEP 2: Map & Settings */}
          {step === 2 && (
            <div className="space-y-8">
               
               {/* Settings Card */}
               <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="font-bold text-sm mb-4 border-b pb-2">インポート設定</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                     <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">為替レート (RMB→JPY)</label>
                        <input type="number" className="input-base" value={settings.exchangeRate} onChange={e => setSettings({...settings, exchangeRate: Number(e.target.value)})} />
                        <p className="text-[10px] text-gray-400 mt-1">例: 1元 = {settings.exchangeRate}円</p>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">価格の丸め単位</label>
                        <select className="input-base" value={settings.roundingRule} onChange={e => setSettings({...settings, roundingRule: Number(e.target.value) as any})}>
                           <option value="10">10円単位</option>
                           <option value="50">50円単位</option>
                           <option value="100">100円単位</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">デフォルト在庫数</label>
                        <input type="number" className="input-base" value={settings.defaultStock} onChange={e => setSettings({...settings, defaultStock: Number(e.target.value)})} />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">コレクション</label>
                        <select className="input-base" value={settings.collectionHandle} onChange={e => setSettings({...settings, collectionHandle: e.target.value})}>
                           <option value="">(CSVに従う)</option>
                           {SHOP_CATEGORIES.map(c => <option key={c.id} value={c.handle}>{c.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">登録モード</label>
                        <select className="input-base" value={settings.mode} onChange={e => setSettings({...settings, mode: e.target.value as any})}>
                           <option value="insert">新規追加のみ (Skip if exists)</option>
                           <option value="upsert">上書き更新 (Update if exists)</option>
                        </select>
                     </div>
                  </div>
               </div>

               {/* Mapping Table */}
               <div>
                 <h3 className="font-bold text-sm mb-4">フィールドマッピング ({csvData.length}件)</h3>
                 <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b">
                         <tr>
                           <th className="px-4 py-2 text-left w-1/3">CSV ヘッダー</th>
                           <th className="px-4 py-2 text-left w-1/3">サンプル (1行目)</th>
                           <th className="px-4 py-2 text-left w-1/3">DB フィールド</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y">
                         {headers.map(header => (
                           <tr key={header}>
                             <td className="px-4 py-2 font-medium">{header}</td>
                             <td className="px-4 py-2 text-gray-500 truncate max-w-[150px]">{csvData[0][header]}</td>
                             <td className="px-4 py-2">
                                <select 
                                  className={`w-full p-1.5 rounded border ${mapping[header] === 'ignore' ? 'text-gray-400 bg-gray-50' : 'text-primary font-bold bg-white border-primary'}`}
                                  value={mapping[header]}
                                  onChange={e => setMapping({...mapping, [header]: e.target.value})}
                                >
                                   {DB_FIELDS.map(f => (
                                     <option key={f.key} value={f.key}>{f.label}</option>
                                   ))}
                                </select>
                             </td>
                           </tr>
                         ))}
                      </tbody>
                    </table>
                 </div>
               </div>

            </div>
          )}

          {/* STEP 3: Progress & Result */}
          {step === 3 && (
            <div className="space-y-6">
               <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">
                    {isProcessing ? 'インポート実行中...' : 'インポート完了'}
                  </h3>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                     <div className="bg-primary h-4 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="text-sm text-gray-500">{progress}% 完了 ({logs.length} / {csvData.length})</p>
               </div>

               <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs text-gray-300">
                  {logs.map((log, i) => (
                    <div key={i} className={`mb-1 ${log.status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                       [{log.index + 1}] {log.status === 'error' ? 'ERROR:' : 'OK:'} {log.title} {log.message ? `- ${log.message}` : ''}
                    </div>
                  ))}
                  {logs.length === 0 && <span className="text-gray-600">Waiting to start...</span>}
               </div>

               {!isProcessing && (
                  <div className="flex justify-center gap-4">
                     <button onClick={downloadErrorLog} className="btn-secondary flex items-center gap-2">
                        <Download size={16}/> 失敗行をDL
                     </button>
                     <button 
                       onClick={() => { onSuccess(); onClose(); }}
                       className="btn-primary"
                     >
                       閉じる
                     </button>
                  </div>
               )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {step === 2 && (
           <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary">戻る</button>
              <button onClick={startImport} className="btn-primary flex items-center gap-2">
                 取込開始 <ArrowRight size={16}/>
              </button>
           </div>
        )}
      </div>
    </div>
  );
}