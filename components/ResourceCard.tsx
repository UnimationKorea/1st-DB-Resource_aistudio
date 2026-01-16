
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Subject, ResourceData, DataUnit } from '../types';
import { Trash2, Play, Image as ImageIcon, ChevronDown, Pause, Info, Database, Unlink, Edit3, Layers, User, Scissors, Plus, Wand2, AlertCircle } from 'lucide-react';

interface ResourceCardProps {
  index: number;
  subject: Subject;
  data: ResourceData;
  commonResources?: ResourceData[];
  onUpdate: (data: Partial<ResourceData>) => void;
  onDelete: () => void;
  isInstruction?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ 
  index, 
  subject, 
  data, 
  commonResources = [],
  onUpdate, 
  onDelete, 
  isInstruction 
}) => {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const linked = data.linkedId ? commonResources.find(r => r.id === data.linkedId) : null;
  const currentAudioUrl = linked ? linked.audioUrl : data.audioUrl;
  const currentImageUrl = linked ? linked.imageUrl : data.imageUrl;
  const currentAudioFile = linked ? linked.audioFile : data.audioFile;

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
    return data.subText.split('/').map(s => s.trim()).filter(s => s !== '');
  }, [data.subText]);

  // Merge logic: removes the slash at a specific position
  const handleMerge = (idx: number) => {
    const rawSegments = data.text.split('/');
    if (idx < rawSegments.length - 1) {
      const mergedPart = rawSegments[idx].trim() + ' ' + rawSegments[idx + 1].trim();
      const newSegments = [...rawSegments];
      newSegments.splice(idx, 2, mergedPart);
      onUpdate({ text: newSegments.join('/') });
    }
  };

  const handleDisconnect = () => {
    onUpdate({ linkedId: undefined, isDirectInput: true });
  };

  // Filter pool items that match the current data unit
  const filteredPool = useMemo(() => 
    commonResources.filter(r => r.dataUnit === data.dataUnit),
    [commonResources, data.dataUnit]
  );

  return (
    <div className="flex flex-col gap-6 p-8 hover:bg-slate-50/50 transition-all group border-b border-slate-100 last:border-0 relative">
      <div className="flex items-start gap-6">
        {/* Index and Unit Interactive Dropdown */}
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

        <div className="flex-1 space-y-8">
          {/* Asset Pool Selection Area */}
          {!isInstruction && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 ml-1">
                <Database size={14} className="text-blue-500" />
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">학습 데이터 소스 ({data.dataUnit})</label>
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
                        imageUrl: res.imageUrl
                      });
                    }
                  }}
                  value={data.linkedId || "DIRECT"}
                  className="w-full bg-[#1e293b] text-white rounded-[1.2rem] px-8 py-4.5 text-sm font-bold shadow-xl appearance-none outline-none border border-transparent focus:border-blue-500 transition-all cursor-pointer pr-16"
                >
                  <option value="DIRECT" className="text-white bg-[#1e293b]">사용자 직접 입력 모드 (Manual Input)</option>
                  {filteredPool.length > 0 ? (
                    <optgroup label={`${data.dataUnit.toUpperCase()} POOL 데이터 (${filteredPool.length})`} className="bg-white text-slate-800">
                      {filteredPool.map(res => (
                        <option key={res.id} value={res.id} className="py-2 text-slate-800">
                          {res.text || "(내용 없음)"} {res.translation ? ` - ${res.translation}` : ''}
                        </option>
                      ))}
                    </optgroup>
                  ) : (
                    <option disabled className="text-slate-400">이 세트의 풀에 등록된 {data.dataUnit} 데이터가 없습니다</option>
                  )}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none group-hover/source:text-white transition-colors" size={20} />
              </div>
            </div>
          )}

          {/* Input Fields and Segmentation Board Grid */}
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
                  className={`w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 transition-all ${!isEditable ? 'opacity-70 bg-slate-50 cursor-not-allowed border-slate-50' : 'focus:border-blue-500 shadow-sm'}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#10b981] ml-1 uppercase">병음 (SUBTEXT)</label>
                <input
                  type="text"
                  value={data.subText || ''}
                  onChange={(e) => onUpdate({ subText: e.target.value })}
                  disabled={!isEditable}
                  placeholder="병음/요미가나 (원문과 / 개수가 동일해야함)"
                  className={`w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-emerald-800 transition-all ${!isEditable ? 'opacity-70 bg-slate-50 cursor-not-allowed border-slate-50' : 'focus:border-emerald-500 shadow-sm'}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">해석 (TRANSLATION)</label>
                <input
                  type="text"
                  value={data.translation}
                  onChange={(e) => onUpdate({ translation: e.target.value })}
                  disabled={!isEditable}
                  placeholder="의미를 입력하세요"
                  className={`w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium text-slate-600 transition-all ${!isEditable ? 'opacity-70 bg-slate-50 cursor-not-allowed border-slate-50' : 'focus:border-blue-500 shadow-sm'}`}
                />
              </div>
            </div>

            {/* Segmentation Board Side (Visible for Sentences) */}
            {data.dataUnit === DataUnit.SENTENCE && (
              <div className="lg:col-span-7 bg-[#0f172a] rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl flex flex-col min-h-[350px] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-500/20"><Scissors size={20} /></div>
                    <div>
                      <h4 className="text-[12px] font-black text-white uppercase tracking-widest leading-none">문장 영역 분할 칸 (SEGMENTATION)</h4>
                      <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">REAL-TIME DB MAPPING VISUALIZATION</p>
                    </div>
                  </div>
                  {textSegments.length > 0 && (
                    <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg">
                      {textSegments.length} SEGMENTS
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-wrap items-center justify-center gap-4 p-4 overflow-y-auto">
                  {textSegments.length > 0 ? (
                    textSegments.map((seg, i) => (
                      <React.Fragment key={i}>
                        <div className="flex flex-col gap-2 items-center group/part animate-in zoom-in duration-300">
                          <div className="text-[8px] font-black text-blue-500 uppercase tracking-widest opacity-60"># PART {i + 1}</div>
                          <div className="bg-white/5 border-2 border-white/10 p-6 rounded-[1.5rem] flex flex-col items-center justify-center min-w-[110px] min-h-[110px] shadow-2xl group-hover/part:border-blue-500 group-hover/part:bg-blue-500/5 transition-all">
                            <span className="text-xl font-black text-white">{seg}</span>
                            {subTextSegments[i] && (
                              <span className="text-[10px] font-bold text-blue-400 mt-2 italic bg-blue-500/10 px-2 py-0.5 rounded-lg">
                                {subTextSegments[i]}
                              </span>
                            )}
                          </div>
                        </div>
                        {i < textSegments.length - 1 && (
                          <button 
                            onClick={() => handleMerge(i)}
                            className="w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all shadow-xl border border-white/10"
                            title="Merge with next segment"
                          >
                            <Plus size={18} />
                          </button>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center text-white/10 text-center py-10">
                      <Wand2 size={48} className="mb-4 opacity-5" />
                      <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40">Ready to Visualize</p>
                      <p className="text-[9px] text-white/20 mt-2 font-bold uppercase">Insert "/" in the text input to split segments</p>
                    </div>
                  )}
                </div>
                
                {subTextSegments.length > 0 && textSegments.length !== subTextSegments.length && (
                   <div className="mt-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center justify-center gap-2 text-red-400 text-[9px] font-bold animate-pulse uppercase tracking-widest">
                     <AlertCircle size={14}/> Segmentation Mismatch: 원문과 병음의 슬래시(/) 개수가 일치하지 않습니다.
                   </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Floating Actions on the right */}
        <div className="flex flex-col items-center gap-4 pt-8">
           <button onClick={onDelete} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all mb-4">
             <Trash2 size={24} />
           </button>
           
           <div className="flex flex-col gap-2 p-2 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
             <button 
               onClick={toggleAudio}
               className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${currentAudioUrl ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-blue-500'}`}
             >
               {isPlaying ? <Pause size={20} fill="currentColor" /> : <Layers size={20} />}
             </button>
             <button 
               onClick={() => imageInputRef.current?.click()}
               className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all overflow-hidden border-2 ${currentImageUrl ? 'border-emerald-500 shadow-lg' : 'border-transparent text-slate-400 hover:text-emerald-500'}`}
             >
               {currentImageUrl ? <img src={currentImageUrl} className="w-full h-full object-cover" /> : <User size={24} />}
             </button>
           </div>

           {isEditable && (
             <button onClick={() => audioInputRef.current?.click()} className="p-2 text-slate-400 hover:text-blue-500 transition-colors" title="미디어 수정">
               <Edit3 size={18} />
             </button>
           )}
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={(e) => handleFileChange(e, 'audio')} />
      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
      <audio ref={audioRef} src={currentAudioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
    </div>
  );
};
