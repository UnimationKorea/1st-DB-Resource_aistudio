
import React, { useRef, useState, useEffect } from 'react';
import { Subject, ResourceData, DataUnit } from '../types';
import { Trash2, Play, Image as ImageIcon, ChevronDown, Volume2, Pause, Info, Database, Unlink, Scissors, Hash, AlertCircle, Edit3, ListPlus, Wand2 } from 'lucide-react';

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
  const [entryMode, setEntryMode] = useState<'SLASH' | 'MANUAL'>('SLASH');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const linked = data.linkedId ? commonResources.find(r => r.id === data.linkedId) : null;
  const currentAudioUrl = linked ? linked.audioUrl : data.audioUrl;
  const currentImageUrl = linked ? linked.imageUrl : data.imageUrl;
  const currentAudioFile = linked ? linked.audioFile : data.audioFile;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [currentAudioUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'image') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'audio') onUpdate({ audioFile: file.name, audioUrl: url });
      else onUpdate({ imageFile: file.name, imageUrl: url });
    }
  };

  const toggleAudio = () => {
    if (audioRef.current && currentAudioUrl) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const getSubLabel = () => {
    if (subject === Subject.CHINESE) return '병음 (Pinyin)';
    if (subject === Subject.JAPANESE) return '후리카나 (Furigana)';
    return null;
  };

  // 문장 영역 분리 로직: 슬래시(/) 기준
  const getSegments = (str: string) => {
    if (!str || str.trim() === '') return [];
    return str.split('/').map(s => s.trim()).filter(s => s !== '');
  };

  const textSegments = getSegments(data.text);
  const subTextSegments = getSegments(data.subText || '');
  const hasMismatch = subTextSegments.length > 0 && textSegments.length !== subTextSegments.length;

  // 수동 모드 전환 시 기존 텍스트를 슬래시로 합치거나 분해하는 기능
  const toggleMode = () => {
    setEntryMode(prev => prev === 'SLASH' ? 'MANUAL' : 'SLASH');
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm hover:shadow-2xl transition-all relative group overflow-hidden">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
        <div className="flex items-center gap-6">
          <span className="bg-blue-600 text-white font-black px-4 py-2 rounded-xl text-xs uppercase shadow-lg shadow-blue-500/20">
            {isInstruction ? `지시문 ${index + 1}` : `${data.dataUnit} ${index + 1}`}
          </span>
          <div className="relative">
            <select 
               value={data.dataUnit}
               onChange={(e) => onUpdate({ dataUnit: e.target.value as DataUnit })}
               className="appearance-none text-xs bg-slate-100 rounded-xl pl-4 pr-10 py-2.5 text-slate-700 focus:ring-4 focus:ring-blue-100 cursor-pointer font-black outline-none"
            >
              <option value={DataUnit.WORD}>WORD</option>
              <option value={DataUnit.PHRASE}>PHRASE</option>
              <option value={DataUnit.SENTENCE}>SENTENCE</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>
          
          {data.dataUnit === DataUnit.SENTENCE && (
            <button 
              onClick={toggleMode}
              className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-lg border transition-all ${entryMode === 'SLASH' ? 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100' : 'text-purple-600 bg-purple-50 border-purple-100 hover:bg-purple-100'}`}
            >
              {entryMode === 'SLASH' ? <><Wand2 size={12}/> 슬래시 분할 모드</> : <><ListPlus size={12}/> 수동 리스트 모드</>}
            </button>
          )}

          {!data.isDirectInput && !isInstruction && (
            <button 
              onClick={() => onUpdate({ isDirectInput: true, linkedId: undefined })}
              className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-100"
            >
              <Unlink size={12} /> 연결 해제 및 개별 수정
            </button>
          )}
        </div>
        <button onClick={onDelete} className="text-slate-200 hover:text-red-500 transition-all p-3 hover:bg-red-50 rounded-2xl">
          <Trash2 size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Input Controls */}
        <div className="lg:col-span-5 space-y-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 ml-1">
              <Database size={14} className="text-blue-500" />
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">공통 리소스 연결</label>
            </div>
            {!isInstruction && commonResources.length > 0 ? (
              <div className="relative">
                <select 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'DIRECT') onUpdate({ linkedId: undefined, isDirectInput: true });
                    else {
                      const res = commonResources.find(r => r.id === val);
                      if (res) onUpdate({ linkedId: res.id, text: res.text, subText: res.subText, translation: res.translation, isDirectInput: false });
                    }
                  }}
                  value={data.linkedId || "DIRECT"}
                  className="w-full bg-[#1e293b] text-white rounded-[1.25rem] px-6 py-5 text-sm focus:ring-4 focus:ring-blue-500/30 outline-none appearance-none font-bold shadow-2xl transition-all cursor-pointer"
                >
                  <option value="DIRECT">직접 입력 모드</option>
                  <optgroup label={`${data.dataUnit.toUpperCase()} 리소스`}>
                    {commonResources.filter(r => r.dataUnit === data.dataUnit).map(res => (
                      <option key={res.id} value={res.id}>{res.text}</option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" size={20} />
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] text-slate-400 font-bold flex items-center gap-2">
                <Info size={14} /> 등록된 공통 리소스가 없습니다.
              </div>
            )}
          </div>

          {/* Input Interface */}
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between items-center">
                 원문 
                 {entryMode === 'SLASH' && data.dataUnit === DataUnit.SENTENCE && (
                   <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[9px] font-black animate-pulse">슬래시(/) 사용 권장</span>
                 )}
               </label>
               {entryMode === 'SLASH' ? (
                 <input
                   type="text"
                   value={data.text}
                   readOnly={!data.isDirectInput && !isInstruction}
                   onChange={(e) => onUpdate({ text: e.target.value })}
                   className={`w-full bg-white border-2 border-slate-100 rounded-[1.25rem] px-6 py-4 text-base outline-none font-bold text-slate-800 transition-all ${!data.isDirectInput && !isInstruction ? 'bg-slate-50 opacity-70' : 'focus:border-blue-500 shadow-sm'}`}
                   placeholder={data.dataUnit === DataUnit.SENTENCE ? "예: 你/吃/饭/了/吗" : "내용 입력"}
                 />
               ) : (
                 <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase italic mb-2">Manual Segment List (Click to Edit Overall Text)</p>
                    <div className="flex flex-wrap gap-2">
                      {textSegments.map((s, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
                          <span className="text-[10px] font-black text-slate-400">#{i+1}</span>
                          <span className="text-sm font-bold text-slate-800">{s}</span>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setEntryMode('SLASH')} 
                      className="text-[10px] font-black text-blue-600 flex items-center gap-1 hover:underline mt-2"
                    >
                      <Edit3 size={10}/> 텍스트 수정하기
                    </button>
                 </div>
               )}
            </div>
            
            {getSubLabel() && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">{getSubLabel()}</label>
                <input
                  type="text"
                  value={data.subText || ''}
                  readOnly={!data.isDirectInput && !isInstruction}
                  onChange={(e) => onUpdate({ subText: e.target.value })}
                  className={`w-full bg-blue-50 border border-blue-100 rounded-[1.25rem] px-6 py-4 text-sm outline-none font-bold text-blue-800 transition-all ${!data.isDirectInput && !isInstruction ? 'opacity-70' : 'focus:ring-2 focus:ring-blue-200'}`}
                  placeholder={data.dataUnit === DataUnit.SENTENCE ? "예: Nǐ/chī/fàn/le/ma" : "보조 텍스트 입력"}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">해석</label>
              <textarea
                rows={2}
                value={data.translation}
                readOnly={!data.isDirectInput && !isInstruction}
                onChange={(e) => onUpdate({ translation: e.target.value })}
                className={`w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 py-4 text-sm outline-none font-medium text-slate-600 transition-all ${!data.isDirectInput && !isInstruction ? 'opacity-70' : 'focus:ring-2 focus:ring-blue-100'}`}
                placeholder="해석 입력"
              />
            </div>
          </div>
        </div>

        {/* Right: The Dynamic Segmentation Board (THE CORE FEATURE) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {data.dataUnit === DataUnit.SENTENCE ? (
            <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-500/20"><Scissors size={24} /></div>
                  <div>
                    <h4 className="text-[14px] font-black text-white uppercase tracking-widest">문장 영역 자동 분할 칸 (Segmentation)</h4>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">DB Structure Mapping Workspace</p>
                  </div>
                </div>
                {textSegments.length > 0 && (
                  <div className="flex items-center gap-4">
                    <span className="bg-white/10 text-white/60 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter">
                      Total: {textSegments.length} Parts
                    </span>
                  </div>
                )}
              </div>

              {textSegments.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-8 animate-in fade-in zoom-in duration-500 pr-2 custom-scrollbar">
                  {/* Segmentation Grid - 전문 교육 DB용 칸 디자인 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {textSegments.map((seg, i) => (
                      <div key={i} className="flex flex-col gap-2 group/card">
                        <div className="flex items-center justify-between px-2">
                           <span className="text-[10px] font-black text-blue-500 flex items-center gap-1.5">
                             <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                             PART {i + 1}
                           </span>
                        </div>
                        <div className="bg-white/5 border-2 border-white/5 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-4 group-hover/card:border-blue-500 group-hover/card:bg-blue-500/5 transition-all shadow-lg group-hover/card:shadow-blue-500/10 min-h-[140px] text-center relative overflow-hidden">
                          {/* 배경 장식 */}
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/card:opacity-10 transition-opacity">
                            <Hash size={40} className="text-white" />
                          </div>
                          
                          <span className="text-3xl font-black text-white tracking-tight z-10">{seg}</span>
                          
                          {subTextSegments[i] && (
                            <div className="mt-2 z-10">
                              <span className="text-xs font-bold text-blue-400 italic bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-500/20">
                                {subTextSegments[i]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Warning System */}
                  {hasMismatch && (
                    <div className="flex items-start gap-4 bg-red-500/10 border-2 border-red-500/20 p-6 rounded-[2rem] animate-pulse mt-8">
                      <div className="bg-red-500 text-white p-2 rounded-xl shadow-lg">
                        <AlertCircle size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-black text-red-500 uppercase tracking-widest">분할 칸 개수 불일치 감지</p>
                        <p className="text-[11px] text-red-400 font-bold mt-1 leading-relaxed">
                          원문은 {textSegments.length}개로 분할되었으나, {getSubLabel()}은(는) {subTextSegments.length}개입니다.<br/>
                          학습 앱에서 정상 작동을 위해 슬래시(/) 개수를 맞춰주세요.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-white/5 rounded-[3rem] text-white/20">
                  <div className="bg-white/5 p-8 rounded-full mb-6">
                    <Scissors size={64} strokeWidth={1} className="opacity-10" />
                  </div>
                  <h5 className="text-[16px] font-black uppercase tracking-[0.4em] text-white/30">Workspace Empty</h5>
                  <p className="text-[11px] mt-4 font-bold text-white/10 uppercase tracking-widest text-center max-w-[300px] leading-loose">
                    {entryMode === 'SLASH' 
                      ? "원문 입력창에 슬래시(/)를 사용하여 문장 영역을 나누어 주세요. 예: 你/吃/饭/了/吗"
                      : "수동 모드에서는 텍스트를 먼저 입력해야 세그먼트가 생성됩니다."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* WORD/PHRASE layout - Larger Media focus */
            <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-10 flex flex-col gap-10 min-h-[400px] justify-center shadow-inner">
               <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <Volume2 size={16} className="text-blue-500" /> Multimedia Resources
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Audio Board */}
                    <div className="bg-slate-50 border-2 border-slate-100 p-8 rounded-[2.5rem] flex flex-col items-center gap-6 group/item hover:border-blue-500 hover:bg-white transition-all">
                      <div 
                        onClick={toggleAudio}
                        className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 group-hover/item:scale-110 transition-transform cursor-pointer"
                      >
                        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Audio File</p>
                        <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{currentAudioFile || 'Empty'}</p>
                        <button onClick={() => audioInputRef.current?.click()} className="text-[10px] font-black text-blue-600 mt-2 hover:underline">UPLOAD</button>
                      </div>
                      <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={(e) => handleFileChange(e, 'audio')} />
                      <audio ref={audioRef} src={currentAudioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                    </div>

                    {/* Image Board */}
                    <div className="bg-slate-50 border-2 border-slate-100 p-8 rounded-[2.5rem] flex flex-col items-center gap-6 group/item hover:border-emerald-500 hover:bg-white transition-all">
                      <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30 group-hover/item:scale-110 transition-transform overflow-hidden">
                        {currentImageUrl ? <img src={currentImageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={32} />}
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visual Asset</p>
                        <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{linked ? 'Common Asset' : currentImageUrl ? 'Local Asset' : 'Empty'}</p>
                        <button onClick={() => imageInputRef.current?.click()} className="text-[10px] font-black text-emerald-600 mt-2 hover:underline">UPLOAD</button>
                      </div>
                      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
                    </div>
                  </div>
               </div>
            </div>
          )}
          
          {/* Sentence 일 때의 작은 미디어 컨트롤러 */}
          {data.dataUnit === DataUnit.SENTENCE && (
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white border-2 border-slate-100 rounded-[1.5rem] p-5 flex items-center gap-5 hover:border-blue-500 transition-all cursor-pointer" onClick={toggleAudio}>
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sentence Audio</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{currentAudioFile || 'Not Selected'}</p>
                  </div>
               </div>
               <div className="bg-white border-2 border-slate-100 rounded-[1.5rem] p-5 flex items-center gap-5 hover:border-emerald-500 transition-all">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center overflow-hidden">
                    {currentImageUrl ? <img src={currentImageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sentence Image</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{currentImageUrl ? 'Resource Loaded' : 'No Asset'}</p>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
