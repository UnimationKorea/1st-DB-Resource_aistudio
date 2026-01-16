
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Subject, ResourceData, DataUnit, ActivityType } from '../types';
import { Trash2, ChevronDown, Pause, Database, Unlink, Edit3, Layers, User, Scissors, Plus, Wand2, AlertCircle, Info } from 'lucide-react';

interface ResourceCardProps {
  index: number;
  subject: Subject;
  data: ResourceData;
  commonResources?: ResourceData[];
  onUpdate: (data: Partial<ResourceData>) => void;
  onDelete: () => void;
  isInstruction?: boolean;
  activityType?: ActivityType;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ 
  index, 
  subject, 
  data, 
  commonResources = [],
  onUpdate, 
  onDelete, 
  isInstruction,
  activityType
}) => {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const linked = data.linkedId ? commonResources.find(r => r.id === data.linkedId) : null;
  const currentAudioUrl = linked ? linked.audioUrl : data.audioUrl;
  const currentImageUrl = linked ? linked.imageUrl : data.imageUrl;

  useEffect(() => {
    if (audioRef.current) audioRef.current.load();
  }, [currentAudioUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'image') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'audio') onUpdate({ audioFile: file.name, audioUrl: url, isDirectInput: true });
      else onUpdate({ imageFile: file.name, imageUrl: url, isDirectInput: true });
    }
  };

  const toggleAudio = () => {
    if (audioRef.current && currentAudioUrl) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const isEditable = data.isDirectInput || isInstruction || !data.linkedId;

  // Split text by slash for segmentation
  const textSegments = useMemo(() => {
    if (!data.text) return [];
    return data.text.split('/').map(s => s.trim()).filter(s => s !== '');
  }, [data.text]);

  const subTextSegments = useMemo(() => {
    if (!data.subText) return [];
    return data.subText.split('/').map(s => s.trim()); // Keep empty strings to maintain index mapping if needed
  }, [data.subText]);

  // Sycned Merge logic: removes the slash at a specific position in both text and subText
  const handleMerge = (idx: number) => {
    const rawTextParts = data.text.split('/');
    if (idx < rawTextParts.length - 1) {
      const newTextParts = [...rawTextParts];
      const mergedText = newTextParts[idx].trim() + newTextParts[idx + 1].trim();
      newTextParts.splice(idx, 2, mergedText);
      
      const updates: Partial<ResourceData> = { text: newTextParts.join('/') };

      // Sycnhronize subText merge if segments count matches
      if (data.subText) {
        const rawSubParts = data.subText.split('/');
        if (rawSubParts.length === rawTextParts.length) {
          const newSubParts = [...rawSubParts];
          const mergedSub = newSubParts[idx].trim() + newSubParts[idx + 1].trim();
          newSubParts.splice(idx, 2, mergedSub);
          updates.subText = newSubParts.join('/');
        }
      }

      onUpdate(updates);
    }
  };

  const handleDisconnect = () => {
    let newText = data.text;
    
    // Auto-segmentation for Chinese and Japanese upon disconnect
    if ((subject === Subject.CHINESE || subject === Subject.JAPANESE) && newText && !newText.includes('/')) {
      newText = newText.split('').filter(c => c.trim() !== '').join('/');
    }

    onUpdate({ 
      linkedId: undefined, 
      isDirectInput: true,
      text: newText
    });
  };

  const poolByUnit = useMemo(() => {
    const groups: Record<string, ResourceData[]> = {
      [DataUnit.WORD]: [],
      [DataUnit.PHRASE]: [],
      [DataUnit.SENTENCE]: []
    };
    commonResources.forEach(r => {
      if (groups[r.dataUnit]) groups[r.dataUnit].push(r);
    });
    return groups;
  }, [commonResources]);

  const subLabel = subject === Subject.CHINESE ? 'PINYIN' : subject === Subject.JAPANESE ? 'FURIGANA' : 'SUBTEXT';

  return (
    <div className="flex flex-col gap-6 p-8 hover:bg-slate-50/50 transition-all group border-b border-slate-100 last:border-0 relative">
      <div className="flex items-start gap-6">
        {/* Left Column: Index and Unit Selection */}
        <div className="flex flex-col items-center gap-3 min-w-[120px]">
          <div className="bg-[#5c56f6] text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
            {index + 1}
          </div>
          
          <div className="relative w-full">
            <select 
              value={data.dataUnit}
              onChange={(e) => onUpdate({ dataUnit: e.target.value as DataUnit, linkedId: undefined })}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md appearance-none outline-none border-none text-center cursor-pointer hover:bg-blue-700 transition-colors"
            >
              <option value={DataUnit.WORD}>WORD</option>
              <option value={DataUnit.PHRASE}>PHRASE</option>
              <option value={DataUnit.SENTENCE}>SENTENCE</option>
            </select>
            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" size={10} />
          </div>

          {data.linkedId && (
            <button 
              onClick={handleDisconnect}
              className="mt-2 flex items-center gap-2 text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-100 uppercase tracking-tighter"
            >
              <Unlink size={12} /> 연결 해제 및 개별 수정
            </button>
          )}
        </div>

        {/* Center/Main Content Column */}
        <div className="flex-1 space-y-8">
          {/* Asset Pool Selection Area */}
          {!isInstruction && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 ml-1">
                <Database size={14} className="text-blue-500" />
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  학습 데이터 소스 <span className="text-blue-600">({data.dataUnit.toUpperCase()})</span>
                </label>
              </div>
              <div className="relative group/source max-w-2xl">
                <select 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'DIRECT') onUpdate({ linkedId: undefined, isDirectInput: true });
                    else {
                      const res = commonResources.find(r => r.id === val);
                      if (res) onUpdate({ 
                        linkedId: res.id, 
                        text: res.text, 
                        subText: res.subText, 
                        translation: res.translation, 
                        isDirectInput: false,
                        audioFile: res.audioFile,
                        audioUrl: res.audioUrl,
                        imageFile: res.imageFile,
                        imageUrl: res.imageUrl,
                        dataUnit: res.dataUnit 
                      });
                    }
                  }}
                  value={data.linkedId || "DIRECT"}
                  className="w-full bg-[#1e293b] text-white rounded-[1.2rem] px-8 py-4.5 text-sm font-bold shadow-xl appearance-none outline-none border border-transparent focus:border-blue-500 transition-all cursor-pointer pr-16"
                >
                  <option value="DIRECT" className="text-white bg-[#1e293b]">사용자 직접 입력 모드 (Manual Input)</option>
                  {(Object.entries(poolByUnit) as [string, ResourceData[]][]).map(([unit, items]) => (
                    items.length > 0 && (
                      <optgroup key={unit} label={`${unit.toUpperCase()} 리소스 (${items.length})`} className="bg-white text-slate-800 font-bold">
                        {items.map(res => (
                          <option key={res.id} value={res.id} className="py-2 text-slate-800 font-medium">
                            {res.text || "(내용 없음)"} {res.translation ? ` - ${res.translation}` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )
                  ))}
                  {commonResources.length === 0 && (
                    <option disabled className="text-slate-400 italic">어셋 풀(Asset Pool)에 등록된 데이터가 없습니다</option>
                  )}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none group-hover/source:text-white transition-colors" size={20} />
              </div>
            </div>
          )}

          <div className={`grid ${data.dataUnit === DataUnit.SENTENCE ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-12'} gap-8 items-start`}>
            {/* Input Side */}
            <div className={`${data.dataUnit === DataUnit.SENTENCE ? 'lg:col-span-5' : 'col-span-12'} space-y-6`}>
              <div className="space-y-2 relative">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">원문 (TEXT)</label>
                  {data.dataUnit === DataUnit.SENTENCE && (
                    <span className="bg-blue-50 text-blue-500 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider border border-blue-100">
                      Slash(/) Segmentation Enabled
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={data.text}
                  onChange={(e) => onUpdate({ text: e.target.value })}
                  disabled={!isEditable}
                  placeholder="텍스트를 입력하세요. 문장은 / 로 구분 가능합니다."
                  className={`w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 transition-all ${!isEditable ? 'opacity-70 bg-slate-50 cursor-not-allowed border-slate-50 shadow-none' : 'focus:border-blue-500 shadow-sm'}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#10b981] ml-1 uppercase">{subLabel}</label>
                <input
                  type="text"
                  value={data.subText || ''}
                  onChange={(e) => onUpdate({ subText: e.target.value })}
                  disabled={!isEditable}
                  placeholder={`${subLabel} (원문과 / 개수가 동일해야함)`}
                  className={`w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-emerald-800 transition-all ${!isEditable ? 'opacity-70 bg-slate-50 cursor-not-allowed border-slate-50 shadow-none' : 'focus:border-emerald-500 shadow-sm'}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">번역/해석 (TRANSLATION)</label>
                <textarea
                  value={data.translation}
                  onChange={(e) => onUpdate({ translation: e.target.value })}
                  disabled={!isEditable}
                  placeholder="한국어 해석 내용을 입력하세요"
                  className={`w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium text-slate-600 transition-all min-h-[120px] resize-none ${!isEditable ? 'opacity-70 bg-slate-50 cursor-not-allowed border-slate-50 shadow-none' : 'focus:border-blue-500 shadow-sm'}`}
                />
              </div>
            </div>

            {/* Segmentation Board */}
            {data.dataUnit === DataUnit.SENTENCE && (
              <div className="lg:col-span-7 bg-[#0f172a] rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl flex flex-col min-h-[500px] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                <div className="flex items-center justify-between mb-10 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-500/20"><Scissors size={20} /></div>
                    <div>
                      <h4 className="text-[14px] font-black text-white uppercase tracking-widest leading-none">문장 영역 분할 칸 (SEGMENTATION BOARD)</h4>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">REAL-TIME DB MAPPING VISUALIZATION</p>
                    </div>
                  </div>
                  {textSegments.length > 0 && (
                    <span className="bg-blue-600 text-white px-5 py-2 rounded-full text-[11px] font-black shadow-lg">
                      {textSegments.length} SEGMENTS
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-wrap items-center justify-center gap-x-12 gap-y-16 p-4 overflow-y-auto">
                  {textSegments.length > 0 ? (
                    textSegments.map((seg, i) => (
                      <React.Fragment key={i}>
                        <div className="flex flex-col gap-3 items-center group/part animate-in zoom-in duration-300">
                          <div className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest"># PART {i + 1}</div>
                          <div className="bg-slate-800/40 border-2 border-white/5 p-8 rounded-[2rem] flex flex-col items-center justify-center min-w-[140px] min-h-[140px] shadow-2xl group-hover/part:border-blue-500 group-hover/part:bg-blue-500/5 transition-all relative">
                            <span className="text-3xl font-black text-white tracking-tight">{seg}</span>
                            {subTextSegments[i] && (
                              <span className="text-[12px] font-bold text-blue-400 mt-3 italic bg-blue-500/10 px-3 py-1 rounded-lg text-center">
                                {subTextSegments[i]}
                              </span>
                            )}
                          </div>
                        </div>
                        {i < textSegments.length - 1 && (
                          <div className="flex items-center justify-center -mx-6 pt-6">
                            <button 
                              onClick={() => handleMerge(i)}
                              className="w-11 h-11 bg-white/5 text-white/40 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white hover:scale-110 transition-all shadow-xl border border-white/10 group/merge"
                              title="Click to merge words (removes slash)"
                            >
                              <Plus size={22} />
                            </button>
                          </div>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center text-white/10 text-center py-20">
                      <Wand2 size={64} className="mb-6 opacity-5" />
                      <p className="text-[12px] font-black tracking-[0.4em] uppercase opacity-40">Ready to Visualize</p>
                      <p className="text-[10px] text-white/20 mt-3 font-bold uppercase">Insert "/" in the text input to split segments</p>
                    </div>
                  )}
                </div>
                
                {subTextSegments.length > 0 && textSegments.length !== subTextSegments.length && (
                   <div className="mt-8 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center justify-center gap-3 text-red-400 text-[11px] font-bold animate-pulse uppercase tracking-widest">
                     <AlertCircle size={16}/> Segmentation Mismatch: 원문과 보조 텍스트의 슬래시(/) 개수가 일치하지 않습니다.
                   </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Action Column */}
        <div className="flex flex-col items-center gap-4 pt-8">
           <button onClick={onDelete} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all mb-4">
             <Trash2 size={24} />
           </button>
           <div className="flex flex-col gap-2 p-2 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
             <button onClick={toggleAudio} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${currentAudioUrl ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-blue-500'}`}>
               {isPlaying ? <Pause size={20} fill="currentColor" /> : <Layers size={20} />}
             </button>
             <button onClick={() => imageInputRef.current?.click()} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all overflow-hidden border-2 ${data.imageUrl || (linked && linked.imageUrl) ? 'border-emerald-500 shadow-lg' : 'border-transparent text-slate-200 hover:text-emerald-500'}`}>
               {(data.imageUrl || (linked && linked.imageUrl)) ? <img src={data.imageUrl || linked?.imageUrl} className="w-full h-full object-cover" /> : <User size={24} />}
             </button>
           </div>
           {isEditable && (
             <button onClick={() => audioInputRef.current?.click()} className="p-2 text-slate-400 hover:text-blue-500 transition-colors" title="미디어 수정">
               <Edit3 size={18} />
             </button>
           )}
        </div>
      </div>

      <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={(e) => handleFileChange(e, 'audio')} />
      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
      <audio ref={audioRef} src={currentAudioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
    </div>
  );
};
