/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  AlertTriangle, 
  ShieldCheck, 
  LogOut, 
  Crown, 
  Flower2, 
  Ghost,
  CheckCircle2,
  ChevronRight,
  Camera,
  Info,
  UserCheck
} from 'lucide-react';

// Google Identity Services types
declare global {
  interface Window { 
    google: any; 
  }
}

// Configuration from environment or defaults
const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GAS_URL || "https://script.google.com/macros/s/AKfycbzZt_qlWu_rVg_YnOIsWWlicDGKOVtdKerD_nRjnw80808ApPSsn3ngvGXs0JMcBVk2/exec";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1003959654198-dlmeohcihgsekr53ufmuel72qg7ungj0.apps.googleusercontent.com";

type Category = '校草' | '校花' | '校猴';

interface NomineeData {
  name: string;
  grade: string;
  classNum: string;
  description: string;
  photo?: string | null; // Base64
  consent: boolean;
}

interface UserProfile {
  email: string;
  name: string;
  picture: string;
  credential: string;
}

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
  { 
    id: '校草', 
    label: '校草 🤴', 
    icon: <Crown className="size-8" />, 
    color: 'text-blue-400 group-hover:text-blue-300',
    bgColor: 'bg-blue-400/10 border-blue-400' 
  },
  { 
    id: '校花', 
    label: '校花 🌸', 
    icon: <Flower2 className="size-8" />, 
    color: 'text-pink-400 group-hover:text-pink-300',
    bgColor: 'bg-pink-400/10 border-pink-400'
  },
  { 
    id: '校猴', 
    label: '校猴 🐒', 
    icon: <Ghost className="size-8" />, 
    color: 'text-yellow-400 group-hover:text-yellow-300',
    bgColor: 'bg-yellow-400/10 border-yellow-400'
  },
];

// 🌟 移植舊版的安全 JWT 解碼函數 (解決中文姓名 Crash 問題)
const decodeJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT Decode Error", e);
    return null;
  }
};

const checkIdentity = (email: string) => {
  if (!email) return { valid: false, msg: '未登入', type: 'none', label: '', color: '' };
  if (email.toLowerCase().trim().endsWith('@std.tcfsh.tc.edu.tw')) {
    return { valid: true, type: 'school', label: '一中生認證', color: 'text-lime-400 border-lime-400/50 bg-lime-400/10' };
  }
  return { valid: true, type: 'general', label: '一般帳號', color: 'text-zinc-400 border-zinc-500 bg-zinc-500/10' };
};

export default function App() {
  const [step, setStep] = useState(0);
  const [selectedCats, setSelectedCats] = useState<Category[]>([]);
  const [formData, setFormData] = useState<Record<Category, NomineeData>>({} as any);
  const [honeypot, setHoneypot] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const toggleCategory = (cat: Category) => {
    setSelectedCats(prev => 
      prev.includes(cat) 
        ? prev.filter(c => c !== cat) 
        : prev.length < 3 ? [...prev, cat] : prev
    );
  };

  const updateFormData = (cat: Category, field: keyof NomineeData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [cat]: { 
        ...(prev[cat] || { name: '', grade: '', classNum: '', description: '', consent: false }), 
        [field]: value 
      }
    }));
  };

  const isStep1Valid = () => {
    if (selectedCats.length === 0) return false;
    return selectedCats.every(cat => {
      const data = formData[cat];
      if (!data) return false;
      const basicsValid = (
        data.name.trim().length >= 2 && 
        data.name.trim().length <= 4 && 
        data.grade && 
        data.classNum
      );
      const consentValid = data.photo ? data.consent : true;
      return basicsValid && consentValid;
    });
  };

  // 🌟 Google Login Initialization (結合舊版的穩定機制)
  useEffect(() => {
    if (step === 2 && !user && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (res: any) => {
            const decoded = decodeJwt(res.credential);
            if (decoded) {
              setUser({ 
                email: decoded.email, 
                name: decoded.name, 
                picture: decoded.picture, 
                credential: res.credential 
              });
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        // 放棄 useRef，改用舊版的 getElementById 確保抓取正確圖層
        const btnDiv = document.getElementById("google-signin-btn");
        if (btnDiv) {
          btnDiv.innerHTML = '';
          window.google.accounts.id.renderButton(btnDiv, { 
            theme: "filled_black", 
            size: "large", 
            shape: "pill", 
            width: "300" 
          });
        }
      } catch (e) {
        console.error("Google Sign-In initialization failed", e);
      }
    }
  }, [step, user]);

  const handlePhotoUpload = (cat: Category, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("圖片大小不能超過 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFormData(cat, 'photo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (honeypot !== '') { setSubmitted(true); return; }
    if (!user || !isStep1Valid()) return;
    setIsSubmitting(true);
    
    const identity = checkIdentity(user.email);
    const payload = {
      userEmail: user.email,
      userName: user.name,
      identity: identity.label,
      isTcfsh: identity.type === 'school',
      nominations: selectedCats.map(cat => ({ 
        category: cat, 
        ...formData[cat] 
      })),
      timestamp: new Date().toISOString()
    };

    try {
      if (GOOGLE_SCRIPT_URL === "YOUR_GAS_WEB_APP_URL") {
        console.log("Mocking submission to GAS:", payload);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSubmitted(true);
      } else {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST", 
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload)
        });
        setSubmitted(true);
      }
    } catch (err) {
      console.error(err);
      alert("傳送失敗，請檢查網路連線或授權設定。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center justify-center size-24 rounded-full bg-lime-400/20 text-lime-400">
            <CheckCircle2 className="size-12" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-cyan-400 mb-2">提名成功！</h1>
            <p className="text-zinc-400 font-mono">感謝您的參與，投票結果將於近期公佈。</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
          >
            返回首頁
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 selection:bg-lime-400/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🍡</span>
            <span className="font-black tracking-tighter text-base sm:text-lg bg-clip-text text-transparent bg-gradient-to-r from-lime-400 to-cyan-400">
              TCFSH 2026
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-1.5 w-24 bg-zinc-900 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-lime-400" 
                animate={{ width: `${(step + 1) * 33.3}%` }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-500">STEP {step + 1}/3</span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 mt-8">
        <AnimatePresence mode="wait">
          {/* Step 0: Selection */}
          {step === 0 && (
            <motion.div 
              key="step0"
              initial={{ x: -20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: 20, opacity: 0 }}
              className="space-y-8"
            >
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-black leading-[1.1] tracking-tight">
                  <span className="block mb-1">提名你心目中的</span>
                  <span className="text-lime-400 underline decoration-lime-400/30 block">
                    校園風雲人物
                  </span>
                </h1>
                <p className="text-zinc-400 font-medium text-sm sm:text-base">選擇您想提名的類別，可複選呦 !</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat.id} 
                    onClick={() => toggleCategory(cat.id)}
                    className={`group relative p-6 rounded-3xl border-2 text-left transition-all overflow-hidden ${
                      selectedCats.includes(cat.id) 
                        ? cat.bgColor + ' border-current shadow-[0_0_20px_rgba(163,230,53,0.1)]' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl bg-black/20 ${cat.color}`}>
                          {cat.icon}
                        </div>
                        <div>
                          <p className={`text-xl font-black ${selectedCats.includes(cat.id) ? 'text-zinc-100' : ''}`}>
                            {cat.label}
                          </p>
                          <p className="text-xs font-mono opacity-60">
                            {cat.id === '校草' ? '魅力與陽光的代表' : cat.id === '校花' ? '優雅與氣質的象徵' : '最有活力的氣氛大師'}
                          </p>
                        </div>
                      </div>
                      <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedCats.includes(cat.id) ? 'bg-lime-400 border-lime-400 text-black' : 'border-zinc-800'
                      }`}>
                        {selectedCats.includes(cat.id) && <CheckCircle2 className="size-4" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => setStep(1)} 
                  disabled={selectedCats.length === 0}
                  className="w-full h-16 bg-lime-400 text-black font-black rounded-2xl disabled:opacity-20 disabled:grayscale transition-all flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-95"
                >
                  開始填寫資料 <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-center mt-4 text-xs font-mono text-zinc-600">至少選擇 1 項，最多 3 項</p>
              </div>
            </motion.div>
          )}

          {/* Step 1: Form */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ x: -20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: 20, opacity: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black">填寫 <span className="text-cyan-400">詳細資料</span></h2>
                <button onClick={() => setStep(0)} className="text-zinc-500 font-bold hover:text-zinc-300">變更類別</button>
              </div>

              <div className="space-y-6">
                {selectedCats.map(cat => {
                  const themeColor = cat === '校草' ? 'text-blue-400' : cat === '校花' ? 'text-pink-400' : 'text-yellow-400';
                  const focusColor = cat === '校草' ? 'focus:border-blue-400' : cat === '校花' ? 'focus:border-pink-400' : 'focus:border-yellow-400';
                  const accentColor = cat === '校草' ? 'accent-blue-400' : cat === '校花' ? 'accent-pink-400' : 'accent-yellow-400';
                  const bgMuted = cat === '校草' ? 'bg-blue-400/5' : cat === '校花' ? 'bg-pink-400/5' : 'bg-yellow-400/5';
                  const borderColor = cat === '校草' ? 'border-blue-400/30' : cat === '校花' ? 'border-pink-400/30' : 'border-yellow-400/30';

                  return (
                    <div key={cat} className={`p-6 sm:p-8 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] space-y-6 transition-all ${bgMuted}`}>
                      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800/50">
                        <div className={`size-10 rounded-xl flex items-center justify-center bg-zinc-950 ${themeColor}`}>
                          {CATEGORIES.find(c => c.id === cat)?.icon}
                        </div>
                        <h3 className={`font-black text-xl ${themeColor}`}>{cat} 提名</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className={`text-xs font-black uppercase tracking-widest mb-2 block ${themeColor}`}>姓名</label>
                          <input 
                            type="text" 
                            placeholder="輸入被提名人姓名"
                            value={formData[cat]?.name || ''} 
                            maxLength={4}
                            onChange={e => updateFormData(cat, 'name', e.target.value)}
                            className={`w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-4 font-bold text-lg text-zinc-100 ${focusColor} focus:outline-none transition-colors placeholder:text-zinc-700`} 
                          />
                          <div className="flex justify-end mt-2">
                            <p className={`text-[10px] font-mono ${formData[cat]?.name?.length >= 2 ? themeColor : 'text-zinc-600'}`}>
                              {formData[cat]?.name?.length || 0} / 4
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className={`text-xs font-black uppercase tracking-widest mb-2 block ${themeColor}`}>年級</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['1', '2'].map(g => (
                              <button
                                key={g}
                                onClick={() => {
                                  updateFormData(cat, 'grade', g);
                                  updateFormData(cat, 'classNum', '');
                                }}
                                className={`py-3 rounded-xl border-2 font-bold transition-all ${
                                  formData[cat]?.grade === g 
                                    ? `${cat === '校草' ? 'bg-blue-400/10 border-blue-400 text-blue-400' : cat === '校花' ? 'bg-pink-400/10 border-pink-400 text-pink-400' : 'bg-yellow-400/10 border-yellow-400 text-yellow-400'}` 
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700'
                                }`}
                              >
                                {g} 年級
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className={`text-xs font-black uppercase tracking-widest mb-2 block ${themeColor}`}>班級</label>
                          <div className="relative">
                            <select 
                              value={formData[cat]?.classNum || ''} 
                              onChange={e => updateFormData(cat, 'classNum', e.target.value)} 
                              disabled={!formData[cat]?.grade}
                              className={`w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 text-zinc-100 font-bold focus:outline-none disabled:opacity-30 appearance-none cursor-pointer ${focusColor}`}
                            >
                              <option value="">選擇班級</option>
                              {formData[cat]?.grade === '1' && Array.from({length: 25}, (_, i) => (101 + i).toString()).map(val => (
                                <option key={val} value={val}>{val}</option>
                              ))}
                              {formData[cat]?.grade === '2' && Array.from({length: 25}, (_, i) => (201 + i).toString()).map(val => (
                                <option key={val} value={val}>{val}</option>
                              ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                              <ChevronRight className="rotate-90 size-4" />
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className={`text-xs font-black uppercase tracking-widest mb-2 block ${themeColor}`}>提名理由 (選填)</label>
                          <textarea 
                            placeholder="寫下您推薦的理由..."
                            value={formData[cat]?.description || ''} 
                            maxLength={60}
                            onChange={e => updateFormData(cat, 'description', e.target.value)}
                            className={`w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-4 text-sm font-medium text-zinc-200 ${focusColor} focus:outline-none transition-colors min-h-[80px] resize-none placeholder:text-zinc-700`} 
                          />
                          <p className={`text-right mt-1 text-[10px] font-mono ${themeColor}`}>
                            {formData[cat]?.description?.length || 0} / 60
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <label className={`text-xs font-black uppercase tracking-widest mb-2 block ${themeColor}`}>被提名人照片 (選填)</label>
                          <div className="flex gap-4 items-center">
                            <label className="flex-1 cursor-pointer group">
                               <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(cat, e)} />
                               <div className={`w-full h-32 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-zinc-700 transition-all overflow-hidden ${formData[cat]?.photo ? 'border-solid ' + borderColor : ''}`}>
                                  {formData[cat]?.photo ? (
                                    <img src={formData[cat].photo!} alt="Preview" className="w-full h-full object-cover" />
                                  ) : (
                                    <>
                                      <Camera className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                      <span className="text-xs text-zinc-500 font-bold">點擊上傳照片</span>
                                    </>
                                  )}
                               </div>
                            </label>
                            {formData[cat]?.photo && (
                              <button onClick={() => {
                                updateFormData(cat, 'photo', null);
                                updateFormData(cat, 'consent', false);
                              }} className="text-red-400 text-xs font-bold hover:underline">移除</button>
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {formData[cat]?.photo && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="md:col-span-2 overflow-hidden"
                            >
                              <div className={`flex items-start gap-3 bg-zinc-950/80 p-4 rounded-xl border-2 transition-all ${formData[cat]?.consent ? 'border-lime-400/50' : 'border-red-400/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]'}`}>
                                <input 
                                  type="checkbox" 
                                  id={`consent-${cat}`}
                                  checked={formData[cat]?.consent || false}
                                  onChange={e => updateFormData(cat, 'consent', e.target.checked)}
                                  className={`mt-1 size-5 ${accentColor} cursor-pointer rounded`} 
                                />
                                <label htmlFor={`consent-${cat}`} className="text-xs leading-relaxed text-zinc-300 cursor-pointer">
                                  <span className="font-bold text-zinc-100 block mb-1">聲明同意書</span>
                                  我聲明：上傳照片已取得被提名人之同意，且內容無侵犯他人權益或違反校規之情事。
                                </label>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setStep(0)} 
                  className="flex-1 py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold rounded-2xl hover:bg-zinc-800 transition-all"
                >
                  返回
                </button>
                <button 
                  onClick={() => setStep(2)} 
                  disabled={!isStep1Valid()}
                  className="flex-[2] py-4 bg-cyan-400 text-black font-black rounded-2xl disabled:opacity-20 disabled:grayscale transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                  預覽與送出
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Confirmation */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ x: -20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: 20, opacity: 0 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="bg-lime-500/10 border border-lime-500/30 p-5 rounded-2xl flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-lime-400/20 text-lime-400">
                    <AlertTriangle className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-lime-400 tracking-tight">最終確認</h4>
                    <p className="text-sm text-lime-100/70 leading-relaxed mt-1">
                      每人僅有 <span className="font-black underline decoration-lime-400">一次提名機會</span>，送出後將無法修改，請確認下列資料無誤。
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedCats.map(cat => {
                    const themeColor = cat === '校草' ? 'text-blue-400' : cat === '校花' ? 'text-pink-400' : 'text-yellow-400';
                    const bgTheme = cat === '校草' ? 'bg-blue-400/10 border-blue-400/30' : cat === '校花' ? 'bg-pink-400/10 border-pink-400/30' : 'bg-yellow-400/10 border-yellow-400/30';
                    const iconBg = cat === '校草' ? 'bg-blue-400/20' : cat === '校花' ? 'bg-pink-400/20' : 'bg-yellow-400/20';
                    
                    return (
                      <div key={cat} className={`rounded-[2rem] border overflow-hidden backdrop-blur-xl ${bgTheme}`}>
                        <div className="p-6">
                          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/5">
                            <div className={`p-3 rounded-2xl ${iconBg} ${themeColor}`}>
                              {CATEGORIES.find(c => c.id === cat)?.icon}
                            </div>
                            <h3 className={`font-black text-2xl ${themeColor}`}>{cat}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <p className={`text-xs font-bold uppercase tracking-widest opacity-60 ${themeColor}`}>姓名</p>
                              <p className="text-xl font-black text-zinc-100">{formData[cat].name}</p>
                            </div>
                            <div className="space-y-2">
                              <p className={`text-xs font-bold uppercase tracking-widest opacity-60 ${themeColor}`}>班級</p>
                              <p className="text-xl font-black text-zinc-100">{formData[cat].classNum} 班</p>
                            </div>
                            {formData[cat].description && (
                              <div className="col-span-2 space-y-2">
                                <p className={`text-xs font-bold uppercase tracking-widest opacity-60 ${themeColor}`}>提名理由</p>
                                <p className="text-sm font-medium text-zinc-300 leading-relaxed bg-black/20 p-4 rounded-xl">
                                  {formData[cat].description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Authentication */}
              <div className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 relative z-10 ${
                user 
                  ? 'bg-zinc-900 border-lime-400/20' 
                  : 'bg-zinc-950 border-lime-400 shadow-[0_0_30px_rgba(163,230,53,0.1)]'
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-400/10 text-cyan-400">
                      <ShieldCheck className="size-5" />
                    </div>
                    <span className="font-black text-lg">身份驗證</span>
                  </div>
                  {user && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border-2 font-bold text-[10px] ${checkIdentity(user.email).color}`}>
                      <UserCheck className="size-3" />
                      {checkIdentity(user.email).label}
                    </div>
                  )}
                </div>

                {!user ? (
                  <div className="space-y-6 relative z-20">
                    <p className="text-sm text-zinc-500 text-center">請先使用 Google 帳號登入以 TCFSH 身份完成提名。</p>
                    {/* 🌟 換成舊版的穩定 HTML 結構 */}
                    <div className="flex justify-center relative pointer-events-auto">
                      <div id="google-signin-btn" className="h-12 flex justify-center w-[300px]"></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-zinc-800">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={user.picture} className="size-12 rounded-full border-2 border-zinc-800" alt="avatar" />
                        <div className="absolute -bottom-1 -right-1 size-5 bg-lime-400 border-2 border-zinc-900 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="size-3 text-black" />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-sm">{user.name}</span>
                        <span className="text-[10px] font-mono text-zinc-500">{user.email}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setUser(null)} 
                      className="size-10 flex items-center justify-center rounded-xl bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors"
                    >
                      <LogOut size={18}/>
                    </button>
                  </div>
                )}
                
                {/* Bot Protection / Hidden */}
                <input type="text" value={honeypot} onChange={e => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)} 
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold rounded-2xl hover:bg-zinc-800 transition-all disabled:opacity-50"
                >
                  修改資料
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={!user || isSubmitting} 
                  className="flex-[2] h-16 bg-gradient-to-r from-lime-400 to-cyan-400 text-black font-black rounded-2xl disabled:opacity-20 disabled:grayscale transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    '正在處理中...'
                  ) : (
                    <>
                      確認送出 <Send size={20} />
                    </>
                  )}
                </button>
              </div>
              
              <div className="flex items-center gap-2 justify-center py-4 text-lime-400">
                <Info size={14} />
                <button 
                  onClick={() => setShowPolicyModal(true)}
                  className="text-[10px] font-bold tracking-tight text-lime-400/80 hover:text-lime-400 transition-colors underline decoration-lime-400/30 underline-offset-2"
                >
                  送出即代表同意本系統之投票規範與隱私條款
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* Policy Modal */}
      <AnimatePresence>
        {showPolicyModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-black mb-4 text-white">投票規範與隱私條款</h3>
              <div className="space-y-4 text-sm text-zinc-300 font-medium leading-relaxed">
                <p>
                  Gmail 僅用於確認一中生身份，及限制提名次數。
                </p>
                <p>
                  重複提名將不記入提名之名單中，請確認提名內容正確後再送出表單。
                </p>
              </div>
              <button 
                onClick={() => setShowPolicyModal(false)}
                className="w-full py-3 mt-8 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-colors"
              >
                我瞭解了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-lime-400 via-cyan-400 to-lime-400" />
    </div>
  );
}
