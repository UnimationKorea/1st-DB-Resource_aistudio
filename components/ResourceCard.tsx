
import React, { useRef, useState, useEffect } from 'react';
import { Subject, ResourceData, DataUnit } from '../types';
import { Trash2, Play, Image as ImageIcon, ChevronDown, Volume2, Pause, Info, Database, Unlink, Scissors, Hash, AlertCircle, Edit3, Wand2 } from 'lucide-react';

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

  const getSegments = (str: string) => {
    if (!str || str.trim() === '') return [];
    return str.split('/').map(s => s.trim()).filter(s => s !== '');
  };

  const textSegments = getSegments(data.text);
  const subTextSegments = getSegments(data.subText || '');
  const hasMismatch = subTextSegments.length > 0 && textSegments.length !== subTextSegments.length;

  // 수정 가능 여부: 직접 입력 모드거나 지시문일 때 가능
  const isEditable = data.isDirectInput || isInstruction;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm hover:shadow-2xl transition-all relative group overflow-hidden">
      {/* Decoration */}
      <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <Database size={240} />
      </div>

      {/* Header Section */}
      <div className="flex items-center justify-between mb-10 border-b border-slate-50 pb-6 relative z-10">
        <div className="flex items-center gap-6">
          <span className="bg-blue-600 text-white font-black px-5 py-2 rounded-xl text-xs uppercase shadow-lg shadow-blue-500/20">
            {isInstruction ? `지시문 ${index + 1}` : `${data.dataUnit} ${index + 1}`}
          </span>
          <div className="relative">
            <select 
               value={data.dataUnit}
               onChange={(e) => onUpdate({ dataUnit: e.target.value as DataUnit })}
               className="appearance-none text-xs bg-slate-100 rounded-xl pl-4 pr-10 py-2.5 text-slate-700 focus:ring-4 focus:ring-blue-100 cursor-pointer font-black outline-none border-none shadow-sm"
            >
              <option value={DataUnit.WORD}>WORD</option>
              <option value={DataUnit.PHRASE}>PHRASE</option>
              <option value={DataUnit.SENTENCE}>SENTENCE</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>

          {!isEditable && !isInstruction && (
            <button 
              onClick={() => onUpdate({ isDirectInput: true, linkedId: undefined })}
              className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100"
            >
              <Unlink size={12} /> 연결 해제 및 개별 수정
            </button>
          )}
        </div>
        <button onClick={onDelete} className="text-slate-200 hover:text-red-500 transition-all p-3 hover:bg-red-50 rounded-2xl">
          <Trash2 size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        {/* Left: Input Controls */}
        <div className="lg:col-span-5 space-y-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 ml-1">
              <Database size={14} className="text-blue-500" />
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">학습 데이터 소스</label>
            </div>
            {!isInstruction && commonResources.length > 0 ? (
              <div className="relative">
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
                        isDirectInput: false 
                        // 사운드와 이미지는 링크된 자산을 따라가지만, 개별 업데이트도 가능하도록 설계
                      });
                    }
                  }}
                  value={data.linkedId || "DIRECT"}
                  className="w-full bg-[#1e293b] text-white rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-blue-500/30 outline-none appearance-none font-bold shadow-2xl transition-all cursor-pointer border-none"
                >
                  <option value="DIRECT">사용자 직접 입력 모드</option>
                  <optgroup label={`${data.dataUnit.toUpperCase()} POOL`}>
                    {commonResources.filter(r => r.dataUnit === data.dataUnit).map(res => (
                      <option key={res.id} value={res.id}>{res.text}</option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" size={20} />
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] text-slate-400 font-bold flex items-center gap-2 shadow-inner">
                <Info size={14} /> 자산 풀에 등록된 리소스가 없습니다.
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between items-center">
                 원문 (Text)
                 {data.dataUnit === DataUnit.SENTENCE && (
                   <span className="text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg text-[9px] font-black animate-pulse border border-blue-100 uppercase tracking-tighter">Slash(/) Segmentation Enabled</span>
                 )}
               </label>
               <input
                 type="text"
                 value={data.text}
                 onChange={(e) => onUpdate({ text: e.target.value })}
                 className={`w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4.5 text-base outline-none font-bold text-slate-800 transition-all ${!isEditable ? 'bg-slate-50 text-slate-400' : 'focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/5'}`}
                 placeholder={data.dataUnit === DataUnit.SENTENCE ? "예: 你/吃/饭/了/吗 (슬래시로 영역 구분)" : "학습할 내용을 입력하세요"}
               />
            </div>
            
            {getSubLabel() && (
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">{getSubLabel()}</label>
                <input
                  type="text"
                  value={data.subText || ''}
                  onChange={(e) => onUpdate({ subText: e.target.value })}
                  className={`w-full bg-blue-50 border-2 border-blue-100 rounded-2xl px-6 py-4.5 text-sm outline-none font-bold text-blue-800 transition-all ${!isEditable ? 'opacity-60' : 'focus:ring-4 focus:ring-blue-100 focus:bg-white'}`}
                  placeholder="보조 텍스트 (예: 병음, 요미가나)"
                />
              </div>
            )}

            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">번역/해석 (Translation)</label>
              <textarea
                rows={2}
                value={data.translation}
                onChange={(e) => onUpdate({ translation: e.target.value })}
                className={`w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4.5 text-sm outline-none font-medium text-slate-600 transition-all ${!isEditable ? 'opacity-60' : 'focus:bg-white focus:ring-4 focus:ring-blue-50'}`}
                placeholder="한국어 해석 내용을 입력하세요"
              />
            </div>
          </div>
        </div>

        {/* Right: Visualization Panel */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {data.dataUnit === DataUnit.SENTENCE ? (
            <div className="bg-[#0f172a] rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl flex flex-col min-h-[420px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
              
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-500/30"><Scissors size={24} /></div>
                  <div>
                    <h4 className="text-[14px] font-black text-white uppercase tracking-widest">문장 영역 분할 칸 (Segmentation Board)</h4>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Real-time DB Mapping Visualization</p>
                  </div>
                </div>
                {textSegments.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-lg uppercase">
                      {textSegments.length} Segments
                    </span>
                  </div>
                )}
              </div>

              {textSegments.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                    {textSegments.map((seg, i) => (
                      <div key={i} className="flex flex-col gap-2 group/part">
                        <div className="flex items-center justify-between px-2">
                           <span className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-2">
                             <Hash size={10} /> PART {i + 1}
                           </span>
                        </div>
                        <div className="bg-white/5 border-2 border-white/5 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-4 group-hover/part:border-blue-500 group-hover/part:bg-blue-500/5 transition-all shadow-xl min-h-[140px] text-center relative overflow-hidden">
                          <span className="text-3xl font-black text-white tracking-tight z-10">{seg}</span>
                          {subTextSegments[i] && (
                            <div className="z-10">
                              <span className="text-[11px] font-bold text-blue-400 italic bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-500/20">
                                {subTextSegments[i]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {hasMismatch && (
                    <div className="flex items-start gap-4 bg-red-500/10 border-2 border-red-500/20 p-6 rounded-[2rem] mt-4 animate-pulse">
                      <AlertCircle size={24} className="text-red-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-[12px] font-black text-red-500 uppercase tracking-widest">데이터 불일치 경고</p>
                        <p className="text-[11px] text-red-400 font-bold mt-1 leading-relaxed">
                          원문({textSegments.length}개)과 보조텍스트({subTextSegments.length}개)의 분할 개수가 맞지 않습니다.<br/>
                          슬래시(/) 위치를 확인하여 1:1 매칭을 시켜주세요.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-white/5 rounded-[3rem] text-white/20">
                  <div className="bg-white/5 p-8 rounded-full mb-6">
                    <Wand2 size={64} strokeWidth={1} className="opacity-10" />
                  </div>
                  <h5 className="text-[16px] font-black uppercase tracking-[0.4em] text-white/30">Ready for Segment</h5>
                  <p className="text-[11px] mt-4 font-bold text-white/10 uppercase tracking-widest text-center max-w-[300px] leading-loose">
                    원문 입력창에 슬래시(/)를 입력하면<br/>문장 영역이 자동으로 쪼개져 시각화됩니다.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* WORD/PHRASE layout - Focused Media Display */
            <div className="bg-slate-50 border-2 border-slate-100 rounded-[3rem] p-10 flex flex-col gap-8 min-h-[420px] justify-center shadow-inner relative overflow-hidden">
               <div className="grid grid-cols-2 gap-8 relative z-10">
                  {/* Audio Card */}
                  <div className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] flex flex-col items-center gap-6 group/media hover:border-blue-500 transition-all shadow-lg shadow-slate-200/50">
                    <div 
                      onClick={toggleAudio}
                      className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 group-hover/media:scale-110 transition-transform cursor-pointer"
                    >
                      {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </div>
                    <div className="text-center w-full px-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Audio Source</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{currentAudioFile || '파일을 업로드하세요'}</p>
                      <button onClick={() => audioInputRef.current?.click()} className="text-[10px] font-black text-blue-600 mt-3 uppercase tracking-tighter hover:underline">Upload MP3</button>
                    </div>
                  </div>

                  {/* Image Card */}
                  <div className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] flex flex-col items-center gap-6 group/media hover:border-emerald-500 transition-all shadow-lg shadow-slate-200/50">
                    <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30 group-hover/media:scale-110 transition-transform overflow-hidden">
                      {currentImageUrl ? <img src={currentImageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={32} />}
                    </div>
                    <div className="text-center w-full px-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visual Resource</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{currentImageUrl ? '이미지 로드 완료' : '파일을 업로드하세요'}</p>
                      <button onClick={() => imageInputRef.current?.click()} className="text-[10px] font-black text-emerald-600 mt-3 uppercase tracking-tighter hover:underline">Upload Image</button>
                    </div>
                  </div>
               </div>
            </div>
          )}
          
          {/* Sentence 모드일 때 하단에 고정되는 미디어 컨트롤러 바 */}
          {data.dataUnit === DataUnit.SENTENCE && (
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white border-2 border-slate-100 rounded-[1.5rem] p-5 flex items-center gap-5 hover:border-blue-500 transition-all cursor-pointer group/audio shadow-sm" onClick={toggleAudio}>
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover/audio:bg-blue-600 group-hover/audio:text-white transition-all">
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Main Audio File</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{currentAudioFile || 'None'}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); audioInputRef.current?.click(); }} className="p-2 text-slate-300 hover:text-blue-500 transition-colors">
                    <Volume2 size={18} />
                  </button>
               </div>
               <div className="bg-white border-2 border-slate-100 rounded-[1.5rem] p-5 flex items-center gap-5 hover:border-emerald-500 transition-all cursor-pointer group/image shadow-sm" onClick={() => imageInputRef.current?.click()}>
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center overflow-hidden">
                    {currentImageUrl ? <img src={currentImageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Main Visual Asset</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{currentImageUrl ? 'Resource Loaded' : 'None'}</p>
                  </div>
                  <div className="p-2 text-slate-300 group-hover/image:text-emerald-500 transition-colors">
                    <ImageIcon size={18} />
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
