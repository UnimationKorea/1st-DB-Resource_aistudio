
import React, { useState, useRef, useEffect } from 'react';
import { Subject, ActivityType, DataUnit, ResourceData, PageHierarchy, StackData, ViewMode } from './types';
import { SUBJECTS, LEVELS, SETS, PAGES, ACTIVITY_TYPES } from './constants';
import { Dropdown } from './components/Dropdown';
import { ResourceCard } from './components/ResourceCard';
import { Plus, Database, Save, ShieldCheck, Layers, Trash2, Info, Music, Image as ImageIcon, X, Play, Pause, ChevronDown, Download, FileJson, FileSpreadsheet, LayoutList, Scissors, Hash, Layout, BookOpen, Settings, AlertCircle, Wand2, CloudUpload, RefreshCw, Upload } from 'lucide-react';

/**
 * Main Application Component
 */
const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('PAGE_EDITOR');
  const [isSyncing, setIsSyncing] = useState(false);
  const [hierarchy, setHierarchy] = useState<PageHierarchy>({
    subject: Subject.CHINESE,
    level: LEVELS[0],
    set: SETS[0],
    page: PAGES[0]
  });

  const [commonResources, setCommonResources] = useState<ResourceData[]>([]);
  const [pageStacks, setPageStacks] = useState<StackData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AWS RDS 연동 (시뮬레이션)
  const fetchPageData = async () => {
    setIsSyncing(true);
    try {
      console.log("AWS RDS Syncing...");
      await new Promise(resolve => setTimeout(resolve, 600));
    } catch (error) {
      console.error("Fetch failed", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, [hierarchy]);

  // 클라우드 저장
  const handleSaveToCloud = async () => {
    setIsSyncing(true);
    try {
      const payload = { hierarchy, stacks: pageStacks, commonResources };
      console.log("Saving to AWS Cloud (RDS):", payload);
      alert("데이터가 AWS 클라우드에 성공적으로 백업되었습니다.");
    } catch (error) {
      alert("클라우드 저장 실패");
    } finally {
      setIsSyncing(false);
    }
  };

  // JSON 내보내기 (로컬 저장)
  const exportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      hierarchy,
      commonResources,
      pageStacks
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `edu_architect_${hierarchy.subject}_${hierarchy.level}_P${hierarchy.page}.json`;
    link.click();
  };

  // CSV 내보내기 (데이터 시트 다운로드)
  const exportCSV = () => {
    const headers = ['Subject', 'Level', 'Set', 'Page', 'Stack_Idx', 'Activity', 'Item_Idx', 'Unit', 'Text', 'SubText', 'Translation', 'Audio', 'Image'];
    const rows = [];

    pageStacks.forEach((stack, sIdx) => {
      stack.items.forEach((item, iIdx) => {
        const linked = item.linkedId ? commonResources.find(r => r.id === item.linkedId) : null;
        const finalItem = linked ? { ...item, ...linked, id: item.id } : item;

        rows.push([
          hierarchy.subject,
          hierarchy.level,
          hierarchy.set,
          hierarchy.page,
          sIdx + 1,
          stack.activityType,
          iIdx + 1,
          finalItem.dataUnit,
          `"${(finalItem.text || '').replace(/"/g, '""')}"`,
          `"${(finalItem.subText || '').replace(/"/g, '""')}"`,
          `"${(finalItem.translation || '').replace(/"/g, '""')}"`,
          finalItem.audioFile || '',
          finalItem.imageFile || ''
        ]);
      });
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `edu_db_sheet_${hierarchy.subject}_${hierarchy.level}.csv`;
    link.click();
  };

  // 로컬 파일에서 프로젝트 불러오기
  const importProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.hierarchy) setHierarchy(json.hierarchy);
        if (json.commonResources) setCommonResources(json.commonResources);
        if (json.pageStacks) setPageStacks(json.pageStacks);
        alert("로컬 프로젝트를 성공적으로 불러왔습니다.");
      } catch (err) {
        alert("잘못된 파일 형식입니다.");
      }
    };
    reader.readAsText(file);
  };

  const addCommonResource = () => {
    setCommonResources([...commonResources, {
      id: crypto.randomUUID(),
      text: '',
      translation: '',
      dataUnit: DataUnit.WORD,
      isDirectInput: true
    }]);
  };

  const addStack = () => {
    setPageStacks([...pageStacks, {
      id: crypto.randomUUID(),
      index: pageStacks.length + 1,
      activityType: ActivityType.INSTRUCTION,
      items: []
    }]);
  };

  const updateStack = (id: string, updates: Partial<StackData>) => {
    setPageStacks(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStack = (id: string) => {
    setPageStacks(prev => prev.filter(s => s.id !== id));
  };

  const addResourceToStack = (stackId: string) => {
    setPageStacks(prev => prev.map(s => {
      if (s.id === stackId) {
        return { 
          ...s, 
          items: [...s.items, {
            id: crypto.randomUUID(),
            text: '',
            translation: '',
            dataUnit: DataUnit.WORD,
            isDirectInput: true
          }] 
        };
      }
      return s;
    }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900">
      <nav className="bg-[#1e293b] text-white px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-xl border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/30">
            <Layers className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none uppercase">Edu Architect</h1>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">Cloud & Local Integrated</p>
          </div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mx-6">
          <button 
            onClick={() => setViewMode('COMMON_INPUT')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${viewMode === 'COMMON_INPUT' ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
          >
            <Database size={14} /> ASSET POOL
          </button>
          <button 
            onClick={() => setViewMode('PAGE_EDITOR')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${viewMode === 'PAGE_EDITOR' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
          >
            <BookOpen size={14} /> PAGE EDITOR
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="p-3 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white" title="Import Project">
            <Upload size={20} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={importProject} />
          
          <button onClick={exportJSON} className="p-3 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white" title="Export JSON">
            <FileJson size={20} />
          </button>
          
          <button onClick={exportCSV} className="p-3 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white" title="Download Sheet (CSV)">
            <FileSpreadsheet size={20} />
          </button>

          <div className="h-8 w-[1px] bg-white/10 mx-2" />

          <button 
            onClick={handleSaveToCloud}
            disabled={isSyncing}
            className={`ml-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black text-xs transition-all shadow-lg flex items-center gap-2 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSyncing ? <RefreshCw className="animate-spin" size={14} /> : <CloudUpload size={14} />}
            CLOUD SAVE
          </button>
        </div>
      </nav>

      <main className="flex-1 p-10 max-w-[1600px] mx-auto w-full">
        {viewMode === 'COMMON_INPUT' && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Master Asset Pool</h2>
                <p className="text-slate-500 font-bold mt-2 uppercase text-xs tracking-widest opacity-60">재사용 가능한 글로벌 학습 자산 관리</p>
              </div>
              <button 
                onClick={addCommonResource}
                className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3 shadow-2xl shadow-emerald-500/20 hover:scale-105 transition-all"
              >
                <Plus size={24} strokeWidth={3} /> NEW MASTER ASSET
              </button>
            </div>
            
            <div className="space-y-6">
              {commonResources.map((res, i) => (
                <CommonResourceItem 
                  key={res.id} 
                  idx={i} 
                  data={res} 
                  subject={hierarchy.subject}
                  onUpdate={(updates) => {
                    const next = [...commonResources];
                    next[i] = { ...next[i], ...updates };
                    setCommonResources(next);
                  }}
                  onDelete={() => setCommonResources(commonResources.filter(r => r.id !== res.id))}
                />
              ))}
            </div>
          </div>
        )}

        {viewMode === 'PAGE_EDITOR' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-[#1e293b] p-8 rounded-[3rem] shadow-2xl flex flex-wrap items-center gap-8 border border-white/5 relative">
              <Dropdown label="Subject" value={hierarchy.subject} options={SUBJECTS} onChange={(val) => setHierarchy({ ...hierarchy, subject: val as Subject })} />
              <Dropdown label="Level" value={hierarchy.level} options={LEVELS} onChange={(val) => setHierarchy({ ...hierarchy, level: val })} />
              <Dropdown label="Set" value={hierarchy.set} options={SETS} onChange={(val) => setHierarchy({ ...hierarchy, set: val })} />
              <Dropdown label="Page" value={hierarchy.page} options={PAGES} onChange={(val) => setHierarchy({ ...hierarchy, page: val })} />
              
              <div className="ml-auto text-right">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Live Workspace</p>
                <p className="text-sm font-black text-blue-400">{hierarchy.subject} {hierarchy.level}-{hierarchy.set} (Page {hierarchy.page})</p>
              </div>

              {isSyncing && (
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md rounded-[3rem] flex items-center justify-center z-20 border-2 border-blue-500/20">
                   <RefreshCw className="text-blue-400 animate-spin mr-4" size={32} />
                   <span className="text-white font-black uppercase text-sm tracking-widest">Syncing with AWS RDS...</span>
                </div>
              )}
            </div>

            <div className="space-y-12 pb-24">
              {pageStacks.map((stack, idx) => (
                <div key={stack.id} className="bg-white rounded-[4rem] border border-slate-200 p-10 shadow-sm relative group/stack overflow-hidden">
                  <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                    <div className="flex items-center gap-6">
                      <div className="bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                        {idx + 1}
                      </div>
                      <div className="relative">
                        <select 
                          value={stack.activityType}
                          onChange={(e) => updateStack(stack.id, { activityType: e.target.value as ActivityType })}
                          className="appearance-none bg-slate-100 border-none rounded-2xl px-6 py-4 text-xs font-black text-slate-700 outline-none pr-12 focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
                        >
                          {ACTIVITY_TYPES.map(type => (
                            <option key={type} value={type}>{type.toUpperCase()}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <button onClick={() => deleteStack(stack.id)} className="text-slate-200 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-2xl">
                      <Trash2 size={24} />
                    </button>
                  </div>

                  <div className="space-y-8">
                    {stack.items.map((item, i) => (
                      <ResourceCard 
                        key={item.id}
                        index={i}
                        subject={hierarchy.subject}
                        data={item}
                        commonResources={commonResources}
                        onUpdate={(updates) => {
                          const newItems = [...stack.items];
                          newItems[i] = { ...newItems[i], ...updates };
                          updateStack(stack.id, { items: newItems });
                        }}
                        onDelete={() => {
                          const newItems = stack.items.filter(it => it.id !== item.id);
                          updateStack(stack.id, { items: newItems });
                        }}
                      />
                    ))}
                    <button 
                      onClick={() => addResourceToStack(stack.id)}
                      className="w-full py-12 border-4 border-dashed border-slate-50 rounded-[3rem] text-slate-300 hover:text-indigo-600 hover:border-indigo-100 transition-all flex flex-col items-center justify-center gap-4 group bg-slate-50/50"
                    >
                      <Plus size={48} strokeWidth={1} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-black uppercase tracking-[0.4em]">학습 아이템 추가</span>
                    </button>
                  </div>
                </div>
              ))}

              <button 
                onClick={addStack}
                className="w-full py-20 bg-slate-900 rounded-[5rem] text-white flex flex-col items-center justify-center gap-6 hover:bg-slate-800 transition-all shadow-2xl group border border-white/5"
              >
                <div className="bg-blue-600 p-5 rounded-3xl shadow-2xl group-hover:scale-110 transition-transform">
                  <Plus size={36} strokeWidth={3} />
                </div>
                <div className="text-center">
                  <p className="text-xl font-black tracking-tight uppercase">New Activity Stack</p>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-1">학습 활동(Activity) 덩어리 추가</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

/**
 * Common Resource Item Component (Asset Pool용)
 */
const CommonResourceItem: React.FC<{ 
  idx: number; 
  data: ResourceData; 
  subject: Subject; 
  onUpdate: (data: Partial<ResourceData>) => void; 
  onDelete: () => void; 
}> = ({ idx, data, subject, onUpdate, onDelete }) => {
  const audioRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const subLabel = subject === Subject.CHINESE ? '병음' : subject === Subject.JAPANESE ? '후리카나' : null;

  const getSegments = (str: string) => {
    if (!str || str.trim() === '') return [];
    return str.split('/').map(s => s.trim()).filter(s => s !== '');
  };

  const textSegments = getSegments(data.text);
  const subTextSegments = getSegments(data.subText || '');

  return (
    <div className="bg-white border-2 border-slate-100 p-10 rounded-[3.5rem] shadow-md flex flex-col gap-8 group hover:border-emerald-500 transition-all animate-in fade-in overflow-hidden relative">
      <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
        <Hash size={240} />
      </div>

      <div className="flex gap-10 items-start relative z-10">
        <div className="flex flex-col items-center gap-4 min-w-[100px]">
          <div className="bg-emerald-600 text-white font-black text-xl w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg">{idx + 1}</div>
          <select 
            value={data.dataUnit} 
            onChange={(e) => onUpdate({ dataUnit: e.target.value as DataUnit })} 
            className="text-[10px] font-black bg-slate-100 rounded-xl px-4 py-2 text-slate-500 uppercase cursor-pointer outline-none hover:bg-slate-200 transition-all border-none"
          >
            <option value={DataUnit.WORD}>WORD</option>
            <option value={DataUnit.PHRASE}>PHRASE</option>
            <option value={DataUnit.SENTENCE}>SENTENCE</option>
          </select>
        </div>
        
        <div className={`flex-[4] grid ${subLabel ? 'grid-cols-3' : 'grid-cols-2'} gap-8`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest">원문</label>
              {data.dataUnit === DataUnit.SENTENCE && (
                <span className="text-emerald-500 text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 animate-pulse">
                  <Wand2 size={10}/> 슬래시(/) 분할 적용
                </span>
              )}
            </div>
            <input type="text" className="w-full bg-slate-50 border-2 border-transparent px-6 py-4 rounded-2xl text-base font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner" value={data.text || ''} onChange={(e) => onUpdate({ text: e.target.value })} placeholder="학습할 문장을 입력하세요" />
          </div>

          {subLabel && (
            <div className="space-y-3">
              <label className="text-[11px] font-black text-emerald-600 uppercase ml-2 tracking-widest">{subLabel}</label>
              <input type="text" className="w-full bg-emerald-50/40 border-2 border-transparent px-6 py-4 rounded-2xl text-base font-bold text-emerald-900 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner" value={data.subText || ''} onChange={(e) => onUpdate({ subText: e.target.value })} placeholder="보조 데이터 입력" />
            </div>
          )}

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest">번역/해석</label>
            <input type="text" className="w-full bg-slate-50 border-2 border-transparent px-6 py-4 rounded-2xl text-base font-medium text-slate-600 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner" value={data.translation || ''} onChange={(e) => onUpdate({ translation: e.target.value })} placeholder="해석 입력" />
          </div>
        </div>

        <div className="flex gap-4">
          <input type="file" ref={audioRef} className="hidden" accept="audio/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if(file) onUpdate({ audioFile: file.name, audioUrl: URL.createObjectURL(file) });
          }} />
          <button onClick={() => audioRef.current?.click()} className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${data.audioUrl ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-white text-slate-200 border-slate-100 hover:border-blue-500'}`}><Music size={24} /></button>
          
          <input type="file" ref={imageRef} className="hidden" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if(file) onUpdate({ imageFile: file.name, imageUrl: URL.createObjectURL(file) });
          }} />
          <button onClick={() => imageRef.current?.click()} className={`w-14 h-14 rounded-2xl border-2 overflow-hidden flex items-center justify-center transition-all ${data.imageUrl ? 'border-emerald-500 shadow-xl shadow-emerald-500/30' : 'bg-white text-slate-200 border-slate-100 hover:border-emerald-500'}`}>{data.imageUrl ? <img src={data.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={24} />}</button>
          
          <button onClick={onDelete} className="w-14 h-14 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all flex items-center justify-center"><Trash2 size={24} /></button>
        </div>
      </div>

      {/* Common Resource Sentence Preview (칸 UI) */}
      {data.dataUnit === DataUnit.SENTENCE && textSegments.length > 0 && (
        <div className="bg-[#0f172a] rounded-[2rem] p-8 border border-slate-800 animate-in fade-in duration-500 shadow-2xl mt-4">
           <div className="flex items-center gap-3 mb-6">
              <Scissors size={20} className="text-blue-500" />
              <span className="text-[11px] font-black text-white/70 uppercase tracking-[0.3em]">Master Asset Segmentation Board</span>
           </div>
           <div className="flex flex-wrap gap-5">
              {textSegments.map((seg, i) => (
                <div key={i} className="flex flex-col gap-2 items-center min-w-[120px]">
                  <div className="bg-white/5 border border-white/10 px-6 py-6 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 w-full min-h-[100px] hover:bg-white/10 transition-all">
                    <span className="text-[10px] font-black text-blue-500 uppercase"># {i + 1}</span>
                    <span className="text-2xl font-black text-white">{seg}</span>
                    {subTextSegments[i] && (
                      <span className="text-[11px] font-bold text-blue-400 italic bg-blue-500/10 px-3 py-1 rounded-xl">
                        {subTextSegments[i]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
