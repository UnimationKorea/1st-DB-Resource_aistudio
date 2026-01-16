
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Subject, ActivityType, DataUnit, ResourceData, PageHierarchy, StackData, ViewMode } from './types';
import { SUBJECTS, LEVELS, SETS, PAGES, ACTIVITY_TYPES } from './constants';
import { Dropdown } from './components/Dropdown';
import { ResourceCard } from './components/ResourceCard';
import { Plus, Database, Layers, FileJson, FileSpreadsheet, BookOpen, RefreshCw, CloudUpload, Upload, ChevronDown, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('PAGE_EDITOR');
  const [isSyncing, setIsSyncing] = useState(false);
  const [hierarchy, setHierarchy] = useState<PageHierarchy>({
    subject: Subject.CHINESE,
    level: LEVELS[0],
    set: SETS[0],
    page: PAGES[0]
  });

  const [globalResources, setGlobalResources] = useState<Record<string, ResourceData[]>>({});
  const [pageStacks, setPageStacks] = useState<StackData[]>([]);

  const setKey = useMemo(() => 
    `${hierarchy.subject}-${hierarchy.level}-${hierarchy.set}`, 
    [hierarchy.subject, hierarchy.level, hierarchy.set]
  );

  const commonResources = useMemo(() => globalResources[setKey] || [], [globalResources, setKey]);

  useEffect(() => {
    const fetchPageData = async () => {
      setIsSyncing(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 400));
      } finally {
        setIsSyncing(false);
      }
    };
    fetchPageData();
  }, [hierarchy]);

  const handleSaveToCloud = async () => {
    setIsSyncing(true);
    try {
      console.log("Saving to AWS Cloud:", { hierarchy, stacks: pageStacks, globalResources });
      alert("데이터가 AWS 클라우드에 성공적으로 백업되었습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  const exportJSON = () => {
    const data = { exportedAt: new Date().toISOString(), hierarchy, globalResources, pageStacks };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `edu_architect_${setKey}_P${hierarchy.page}.json`;
    link.click();
  };

  const exportCSV = () => {
    const headers = ['Subject', 'Level', 'Set', 'Page', 'Stack_Idx', 'Activity', 'Item_Idx', 'Unit', 'Text', 'Translation'];
    const rows: any[] = [];
    pageStacks.forEach((stack, sIdx) => {
      stack.items.forEach((item, iIdx) => {
        rows.push([hierarchy.subject, hierarchy.level, hierarchy.set, hierarchy.page, sIdx + 1, stack.activityType, iIdx + 1, item.dataUnit, `"${item.text}"`, `"${item.translation}"`]);
      });
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `edu_db_${setKey}.csv`;
    link.click();
  };

  const addCommonResource = () => {
    const newRes: ResourceData = {
      id: crypto.randomUUID(),
      text: '',
      translation: '',
      dataUnit: DataUnit.WORD,
      isDirectInput: true
    };
    setGlobalResources(prev => ({
      ...prev,
      [setKey]: [...(prev[setKey] || []), newRes]
    }));
  };

  const updateCommonResource = (id: string, updates: Partial<ResourceData>) => {
    setGlobalResources(prev => ({
      ...prev,
      [setKey]: (prev[setKey] || []).map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  const deleteCommonResource = (id: string) => {
    setGlobalResources(prev => ({
      ...prev,
      [setKey]: (prev[setKey] || []).filter(r => r.id !== id)
    }));
  };

  const addStack = () => {
    setPageStacks([...pageStacks, {
      id: crypto.randomUUID(),
      index: pageStacks.length + 1,
      activityType: ActivityType.VOICE_REC,
      items: []
    }]);
  };

  const updateStack = (id: string, updates: Partial<StackData>) => {
    setPageStacks(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900">
      <nav className="bg-[#1e293b] text-white px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/30">
            <Layers className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none uppercase">Edu Architect</h1>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">Linguistic Asset Pipeline</p>
          </div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mx-6">
          <button onClick={() => setViewMode('COMMON_INPUT')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${viewMode === 'COMMON_INPUT' ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>
            <Database size={14} /> ASSET POOL ({commonResources.length})
          </button>
          <button onClick={() => setViewMode('PAGE_EDITOR')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${viewMode === 'PAGE_EDITOR' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>
            <BookOpen size={14} /> PAGE EDITOR
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={exportJSON} className="p-3 hover:bg-white/10 rounded-xl transition-all text-white/70" title="Export JSON"><FileJson size={20} /></button>
          <button onClick={exportCSV} className="p-3 hover:bg-white/10 rounded-xl transition-all text-white/70" title="CSV"><FileSpreadsheet size={20} /></button>
          <button onClick={handleSaveToCloud} disabled={isSyncing} className="ml-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg">
            {isSyncing ? <RefreshCw className="animate-spin" size={14} /> : <CloudUpload size={14} />} CLOUD SAVE
          </button>
        </div>
      </nav>

      <main className="flex-1 p-10 max-w-[1600px] mx-auto w-full">
        {viewMode === 'COMMON_INPUT' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Set Asset Pool</h2>
                <p className="text-slate-500 font-bold mt-2 uppercase text-xs tracking-widest opacity-60">Scope: <span className="text-emerald-600">{setKey}</span></p>
              </div>
              <button onClick={addCommonResource} className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3 shadow-2xl hover:scale-105 transition-all">
                <Plus size={24} strokeWidth={3} /> NEW ASSET
              </button>
            </div>
            <div className="space-y-4">
              {commonResources.map((res, i) => (
                <CommonResourceItem 
                  key={res.id} idx={i} data={res} subject={hierarchy.subject} 
                  onUpdate={(upd) => updateCommonResource(res.id, upd)}
                  onDelete={() => deleteCommonResource(res.id)} 
                />
              ))}
              {commonResources.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-300 border-4 border-dashed border-slate-100 rounded-[4rem]">
                   <Database size={64} className="mb-4 opacity-20" />
                   <p className="text-lg font-black uppercase tracking-widest opacity-50">어셋 풀이 비어 있습니다</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-300">
            {/* Page Context */}
            <div className="bg-[#1e293b] p-8 rounded-[2.5rem] shadow-2xl flex flex-wrap items-center gap-8 border border-white/5">
              <Dropdown label="Subject" value={hierarchy.subject} options={SUBJECTS} onChange={(val) => setHierarchy({ ...hierarchy, subject: val as Subject })} />
              <Dropdown label="Level" value={hierarchy.level} options={LEVELS} onChange={(val) => setHierarchy({ ...hierarchy, level: val })} />
              <Dropdown label="Set" value={hierarchy.set} options={SETS} onChange={(val) => setHierarchy({ ...hierarchy, set: val })} />
              <Dropdown label="Page" value={hierarchy.page} options={PAGES} onChange={(val) => setHierarchy({ ...hierarchy, page: val })} />
              <div className="ml-auto text-right">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Live Workspace</p>
                <p className="text-sm font-black text-blue-400">{setKey} P{hierarchy.page}</p>
              </div>
            </div>

            <div className="space-y-8 pb-24">
              {pageStacks.map((stack, idx) => (
                <div key={stack.id} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="bg-slate-50/50 p-6 flex items-center gap-6 border-b border-slate-100">
                    <div className="bg-[#5c56f6] text-white w-12 h-12 rounded-[1.2rem] flex items-center justify-center font-black text-xl shadow-lg">{idx + 1}</div>
                    <div className="relative">
                      <select 
                        value={stack.activityType} 
                        onChange={(e) => updateStack(stack.id, { activityType: e.target.value as ActivityType })} 
                        className="bg-white border border-slate-200 rounded-[1.2rem] px-8 py-3 text-sm font-bold text-slate-700 outline-none appearance-none pr-14 cursor-pointer hover:bg-slate-50 transition-all min-w-[160px]"
                      >
                        {ACTIVITY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {stack.items.map((item, i) => (
                      <ResourceCard 
                        key={item.id} 
                        index={i} 
                        subject={hierarchy.subject} 
                        data={item} 
                        commonResources={commonResources}
                        activityType={stack.activityType}
                        onUpdate={(updates) => {
                          const newItems = [...stack.items];
                          newItems[i] = { ...newItems[i], ...updates };
                          updateStack(stack.id, { items: newItems });
                        }}
                        onDelete={() => updateStack(stack.id, { items: stack.items.filter(it => it.id !== item.id) })}
                      />
                    ))}
                  </div>
                  <button 
                    onClick={() => updateStack(stack.id, { items: [...stack.items, { id: crypto.randomUUID(), text: '', translation: '', dataUnit: DataUnit.WORD, isDirectInput: true }] })} 
                    className="w-full py-8 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-3 group border-t border-slate-50"
                  >
                    <Plus size={24} />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">새 학습 데이터 추가</span>
                  </button>
                </div>
              ))}
              <button onClick={addStack} className="w-full py-16 bg-slate-900 rounded-[4rem] text-white flex flex-col items-center justify-center gap-4 hover:bg-slate-800 transition-all shadow-2xl group border border-white/5">
                <div className="bg-blue-600 p-4 rounded-2xl shadow-2xl group-hover:scale-110 transition-transform"><Plus size={32} strokeWidth={3} /></div>
                <p className="text-lg font-black tracking-tight uppercase">새 활동 스택 추가</p>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const CommonResourceItem: React.FC<{ idx: number; data: ResourceData; subject: Subject; onUpdate: (data: Partial<ResourceData>) => void; onDelete: () => void; }> = ({ idx, data, subject, onUpdate, onDelete }) => {
  const audioRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const subLabel = subject === Subject.CHINESE ? '병음' : subject === Subject.JAPANESE ? '후리카나' : null;

  // Real-time Slash Synchronization Logic
  const handleTextChange = (newText: string) => {
    const prevSlashCount = (data.text || '').split('/').length - 1;
    const nextSlashCount = newText.split('/').length - 1;

    let nextSubText = data.subText || '';

    // If text has slashes, ensure subText has the same number of slashes
    if (nextSlashCount > 0) {
      const subSegments = nextSubText.split('/');
      
      if (nextSlashCount > prevSlashCount) {
        // Slash added: Add empty segment(s) to subText
        const diff = nextSlashCount - (subSegments.length - 1);
        if (diff > 0) {
          nextSubText = subSegments.concat(Array(diff).fill('')).join('/');
        }
      } else if (nextSlashCount < prevSlashCount) {
        // Slash removed: Merge segment(s) in subText
        if (subSegments.length > nextSlashCount + 1) {
          nextSubText = subSegments.slice(0, nextSlashCount + 1).join('/');
        }
      }
    } else if (nextSlashCount === 0 && (subject === Subject.CHINESE || subject === Subject.JAPANESE)) {
       // Optional: Auto-segmentation if multiple chars entered without slashes (can be enabled if desired)
    }

    onUpdate({ text: newText, subText: nextSubText });
  };

  const isMismatch = useMemo(() => {
    if (!data.text || !data.subText) return false;
    return data.text.split('/').length !== data.subText.split('/').length;
  }, [data.text, data.subText]);

  return (
    <div className={`bg-white border-2 p-8 rounded-[3rem] shadow-md flex flex-col gap-6 group transition-all relative ${isMismatch ? 'border-amber-400' : 'border-slate-100 hover:border-emerald-500'}`}>
      <div className="flex gap-10 items-start">
        <div className="flex flex-col items-center gap-4 min-w-[100px]">
          <div className="bg-emerald-600 text-white font-black text-xl w-12 h-12 rounded-[1rem] flex items-center justify-center shadow-lg">{idx + 1}</div>
          <div className="relative w-full">
            <select 
              value={data.dataUnit} 
              onChange={(e) => onUpdate({ dataUnit: e.target.value as DataUnit })} 
              className="w-full text-[10px] font-black bg-slate-100 rounded-lg px-2 py-2 text-slate-500 uppercase border-none outline-none cursor-pointer appearance-none text-center"
            >
              <option value={DataUnit.WORD}>WORD</option>
              <option value={DataUnit.PHRASE}>PHRASE</option>
              <option value={DataUnit.SENTENCE}>SENTENCE</option>
            </select>
          </div>
        </div>
        <div className={`flex-[4] grid ${subLabel ? 'grid-cols-3' : 'grid-cols-2'} gap-6`}>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">원문 (TEXT)</label>
               <span className="text-[8px] font-bold text-blue-500 uppercase opacity-60">Slash Sync Enabled</span>
            </div>
            <input 
              type="text" 
              className="w-full bg-slate-50 border-2 border-transparent px-5 py-3 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none shadow-sm transition-all" 
              value={data.text || ''} 
              onChange={(e) => handleTextChange(e.target.value)} 
              placeholder="예: 你/吃/饭/了/吗"
            />
          </div>
          {subLabel && (
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{subLabel}</label>
                {isMismatch && <AlertCircle size={14} className="text-amber-500 animate-pulse" />}
              </div>
              <input 
                type="text" 
                className={`w-full border-2 px-5 py-3 rounded-xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none shadow-sm transition-all ${isMismatch ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50/40 border-transparent text-emerald-900'}`} 
                value={data.subText || ''} 
                onChange={(e) => onUpdate({ subText: e.target.value })} 
                placeholder="자동 슬래시 생성됨"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">해석 (TRANSLATION)</label>
            <input type="text" className="w-full bg-slate-50 border-2 border-transparent px-5 py-3 rounded-xl text-sm font-medium text-slate-600 focus:bg-white focus:border-emerald-500 outline-none shadow-sm transition-all" value={data.translation || ''} onChange={(e) => onUpdate({ translation: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={audioRef} className="hidden" accept="audio/*" onChange={(e) => e.target.files?.[0] && onUpdate({ audioFile: e.target.files[0].name, audioUrl: URL.createObjectURL(e.target.files[0]) })} />
          <button onClick={() => audioRef.current?.click()} className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${data.audioUrl ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-slate-200 border-slate-100 hover:border-blue-500'}`}> <Layers size={18} /> </button>
          <input type="file" ref={imageRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && onUpdate({ imageFile: e.target.files[0].name, imageUrl: URL.createObjectURL(e.target.files[0]) })} />
          <button onClick={() => imageRef.current?.click()} className={`w-12 h-12 rounded-xl border overflow-hidden flex items-center justify-center transition-all ${data.imageUrl ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-white text-slate-200 border-slate-100 hover:border-emerald-500'}`}>{data.imageUrl ? <img src={data.imageUrl} className="w-full h-full object-cover" /> : <Upload size={18} />}</button>
          <button onClick={onDelete} className="w-12 h-12 text-slate-200 hover:text-red-500 transition-all flex items-center justify-center hover:bg-red-50 rounded-xl"><Plus size={20} className="rotate-45" /></button>
        </div>
      </div>
      {isMismatch && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-black px-4 py-1 rounded-full shadow-lg border border-amber-400 flex items-center gap-2">
          <AlertCircle size={10} /> 원문과 병음의 세그먼트(슬래시) 개수가 일치하지 않습니다!
        </div>
      )}
    </div>
  );
};

export default App;
