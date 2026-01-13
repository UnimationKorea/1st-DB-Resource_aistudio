
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

  // 입력 가능 여부 판단 로직 수정
  const isEditable = data.isDirectInput || isInstruction;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all relative group overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <Hash size={200} />
      </div>

      {/* Header Section */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-5 relative z-10">
        <div className="flex items-center gap-5">
          <span className="bg-blue-600 text-white font-black px-4 py-1.5 rounded-xl text-[10px] uppercase shadow-lg shadow-blue-500/20">
            {isInstruction ? `지시문 ${index + 1}` : `${data.dataUnit} ${index + 1}`}
          </span>
          <div className="relative">
            <select 
               value={data.dataUnit}
               onChange={(e) => onUpdate({ dataUnit: e.target.value as DataUnit })}
               className="appearance-none text-[10px] bg-slate-100 rounded-lg pl-3 pr-8 py-2 text-slate-700 focus:ring-4 focus:ring-blue-100 cursor-pointer font-black outline-none border-none"
            >
              <option value={DataUnit.WORD}>WORD</option>
              <option value={DataUnit.PHRASE}>PHRASE</option>
              <option value={DataUnit.SENTENCE}>SENTENCE</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          {!isEditable && (
            <button 
              onClick={() => onUpdate({ isDirectInput: true, linkedId: undefined })}
              className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-100"
            >
              <Unlink size={12} /> 링크 해제 후 수정
            </button>
          )}
        </div>
        <button onClick={onDelete} className="text-slate-200 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-xl">
          <Trash2 size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
        {/* Left: Input Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 ml-1">
              <Database size={12} className="text-blue-500" />
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">리소스 소스</label>
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
                  className="w-full bg-[#1e293b] text-white rounded-xl px-4 py-3 text-xs focus:ring-4 focus:ring-blue-500/20 outline-none appearance-none font-bold shadow-xl transition-all cursor-pointer border-none"
                >
                  <option value="DIRECT">사용자 직접 입력</option>
                  <optgroup label={`${data.dataUnit.toUpperCase()} 리소스 풀`}>
                    {commonResources.filter(r => r.dataUnit === data.dataUnit).map(res => (
                      <option key={res.id} value={res.id}>{res.text}</option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={16} />
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[9px] text-slate-400 font-bold flex items-center gap-2">
                <Info size={12} /> 자산 풀에 등록된 리소스가 없습니다.
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="flex flex-col gap-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between items-center">
                 원문
                 {data.dataUnit === DataUnit.SENTENCE && (
                   <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded text-[8px] font-black animate-pulse border border-blue-100 uppercase">Slash(/) Segment Mode</span>
                 )}
               </label>
               <input
                 type="text"
                 value={data.text}
                 readOnly={!isEditable}
                 onChange={(e) => onUpdate({ text: e.target.value })}
                 className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none font-bold text-slate-800 transition-all ${!isEditable ? 'bg-slate-50 opacity-60' : 'focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/5'}`}
                 placeholder={data.dataUnit === DataUnit.SENTENCE ? "예: 你/吃/饭/了/만 (슬래시로 구분)" : "텍스트 내용 입력..."}
               />
            </div>
            
            {getSubLabel() && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">{getSubLabel()}</label>
                <input
                  type="text"
                  value={data.subText || ''}
                  readOnly={!isEditable}
                  onChange={(e) => onUpdate({ subText: e.target.value })}
                  className={`w-full bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5 text-sm outline-none font-bold text-blue-800 transition-all ${!isEditable ? 'opacity-60' : 'focus:ring-2 focus:ring-blue-200 focus:bg-white'}`}
                  placeholder="보조 텍스트 (병음/후리카나)"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">해석</label>
              <textarea
                rows={2}
                value={data.translation}
                readOnly={!isEditable}
                onChange={(e) => onUpdate({ translation: e.target.value })}
                className={`w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm outline-none font-medium text-slate-600 transition-all ${!isEditable ? 'opacity-60' : 'focus:bg-white focus:ring-2 focus:ring-blue-100'}`}
                placeholder="한국어 해석 입력..."
              />
            </div>
          </div>
        </div>

        {/* Right: Dynamic Visualization & Media */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {data.dataUnit === DataUnit.SENTENCE ? (
            <div className="bg-slate-900 rounded-[2rem] p-6 border border-slate-800 shadow-2xl flex flex-col min-h-[320px]">
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg"><Scissors size={18} /></div>
                  <div>
                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest">문장 영역 분할 프리뷰</h4>
                    <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest">Logical Data Segmentation</p>
                  </div>
                </div>
                <div className="bg-white/5 text-white/60 px-3 py-1 rounded-lg text-[9px] font-black">
                  {textSegments.length} BLOCKS
                </div>
              </div>

              {textSegments.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pr-1">
                  <div className="flex flex-wrap gap-3">
                    {textSegments.map((seg, i) => (
                      <div key={i} className="flex flex-col gap-1 min-w-[80px]">
                        <span className="text-[8px] font-black text-blue-500 uppercase ml-1"># {i + 1}</span>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-white/10 transition-all shadow-inner group/card">
                          <span className="text-xl font-black text-white">{seg}</span>
                          {subTextSegments[i] && (
                            <span className="text-[9px] font-bold text-blue-400 italic bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                              {subTextSegments[i]}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {hasMismatch && (
                    <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl mt-auto">
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[9px] text-red-400 font-bold leading-relaxed uppercase tracking-tighter">
                        원문({textSegments.length}개)과 보조텍스트({subTextSegments.length}개)의 슬래시(/) 개수가 일치하지 않습니다.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-white/10">
                  <Scissors size={40} strokeWidth={1} className="mb-3 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">분할 데이터 없음</p>
                  <p className="text-[8px] mt-2 font-bold text-white/5 text-center uppercase">원문에 슬래시(/)를 넣어 문장을 쪼개주세요</p>
                </div>
              )}
            </div>
          ) : (
            /* WORD/PHRASE layout - Focused Media Display */
            <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 flex flex-col gap-6 min-h-[320px] justify-center shadow-inner">
               <div className="grid grid-cols-2 gap-5">
                  <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col items-center gap-4 group/media hover:border-blue-500 transition-all shadow-sm">
                    <div 
                      onClick={toggleAudio}
                      className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 group-hover/media:scale-105 transition-transform cursor-pointer"
                    >
                      {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                    </div>
                    <div className="text-center overflow-hidden w-full">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Audio File</p>
                      <p className="text-[10px] font-bold text-slate-700 truncate px-2">{currentAudioFile || '선택된 파일 없음'}</p>
                      <button onClick={() => audioInputRef.current?.click()} className="text-[8px] font-black text-blue-600 mt-2 uppercase tracking-tighter hover:underline">파일 변경</button>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col items-center gap-4 group/media hover:border-emerald-500 transition-all shadow-sm">
                    <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 group-hover/media:scale-105 transition-transform overflow-hidden">
                      {currentImageUrl ? <img src={currentImageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={28} />}
                    </div>
                    <div className="text-center overflow-hidden w-full">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Visual Asset</p>
                      <p className="text-[10px] font-bold text-slate-700 truncate px-2">{currentImageUrl ? '이미지 로드됨' : '선택된 파일 없음'}</p>
                      <button onClick={() => imageInputRef.current?.click()} className="text-[8px] font-black text-emerald-600 mt-2 uppercase tracking-tighter hover:underline">파일 변경</button>
                    </div>
                  </div>
               </div>
            </div>
          )}
          
          {/* Universal Media Controllers for Sentence mode */}
          {data.dataUnit === DataUnit.SENTENCE && (
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-blue-500 transition-all cursor-pointer shadow-sm group/mini" onClick={toggleAudio}>
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center group-hover/mini:scale-105 transition-transform">
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">문장 전체 음성</p>
                    <p className="text-[9px] font-bold text-slate-700 truncate uppercase">{currentAudioFile || 'EMPTY'}</p>
                  </div>
               </div>
               <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-emerald-500 transition-all shadow-sm group/mini" onClick={() => imageInputRef.current?.click()}>
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center overflow-hidden group-hover/mini:scale-105 transition-transform">
                    {currentImageUrl ? <img src={currentImageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">문장 전체 이미지</p>
                    <p className="text-[9px] font-bold text-slate-700 truncate uppercase">{currentImageUrl ? 'LOADED' : 'EMPTY'}</p>
                  </div>
               </div>
            </div>
          )}

          <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={(e) => handleFileChange(e, 'audio')} />
          <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
          <audio ref={audioRef} src={currentAudioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
        </div>
      </div>
    </div>
  );
};
