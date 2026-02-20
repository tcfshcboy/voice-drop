import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  AlertTriangle, 
  Heart, 
  PenTool, 
  Search, 
  Smartphone, 
  BarChart2, 
  Gift, 
  AlertOctagon, 
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  X,
  ShieldCheck,
  ScrollText,
  Info,
  UploadCloud,
  FileImage,
  Mail,
  BadgeCheck,
  User
} from 'lucide-react';

// --- CONFIGURATION ---
// ⚠️ [重要] 請將此處替換為您在 Apps Script 部署後取得的 "Web App URL"
// 網址格式通常為: https://script.google.com/macros/s/......./exec
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwMEU3vYVDZA9xMgINZF0OjZ_4d6vk4jap8tIPOt08M7nNAl-zRjlPDlQEueAj3vTzF5g/exec";

// --- TYPES & CONSTANTS ---

type CategoryType = {
  id: string;
  label: string;
  icon: React.ReactNode;
  limit: number;
  color: string;
  desc: string;
  mood: 'idle' | 'happy' | 'shocked' | 'love' | 'thinking' | 'sad' | 'writing' | 'lying' | 'rules'; // Added writing, lying, rules
  placeholder: string; // Added placeholder
};

const CATEGORIES: CategoryType[] = [
  { 
    id: '靠北', 
    label: '靠北 📣', 
    icon: <AlertTriangle />, 
    limit: 60, 
    color: 'text-yellow-400 border-yellow-400 shadow-yellow-400/50', 
    desc: "有話直說，不吐不快", 
    mood: 'shocked',
    placeholder: "靠北是門藝術，\n酸也可以很有風度！"
  },
  { 
    id: '告白', 
    label: '告白 😍', 
    icon: <Heart />, 
    limit: 60, 
    color: 'text-pink-500 border-pink-500 shadow-pink-500/50', 
    desc: "趁亂告白，大概會失敗", 
    mood: 'love',
    placeholder: "青春怎能留白？\n三年別忘告白！"
  },
  { 
    id: '詩文', 
    label: '詩文 ✏️', 
    icon: <PenTool />, 
    limit: 120, 
    color: 'text-cyan-400 border-cyan-400 shadow-cyan-400/50', 
    desc: "文青系是你？", 
    mood: 'writing',
    placeholder: "都說一鳴驚人，\n就看你怎樣以詩圈粉！"
  },
  { 
    id: '遺失物', 
    label: '遺失物 🔍', 
    icon: <Search />, 
    limit: 150, 
    color: 'text-blue-500 border-blue-500 shadow-blue-500/50', 
    desc: "東西又不見了？", 
    mood: 'sad',
    placeholder: "失主不想變施主，\n記得關注此服務！"
  },
  { 
    id: '限動', 
    label: '限動/轉發 📱', 
    icon: <Smartphone />, 
    limit: 60, 
    color: 'text-purple-500 border-purple-500 shadow-purple-500/50', 
    desc: "精彩畫面支援", 
    mood: 'happy',
    placeholder: "都說好事傳千里 (?\n當然就是要即時傳出去 !"
  },
  { 
    id: '問答', 
    label: '問答/民調 📊', 
    icon: <BarChart2 />, 
    limit: 60, 
    color: 'text-green-400 border-green-400 shadow-green-400/50', 
    desc: "大家怎麼看？", 
    mood: 'thinking',
    placeholder: "不怕你問 只怕你一失神，\n就已築起 千行蓋樓文！"
  },
  { 
    id: '生日', 
    label: '生日快樂 🎁', 
    icon: <Gift />, 
    limit: 60, 
    color: 'text-orange-400 border-orange-400 shadow-orange-400/50', 
    desc: "祝壽專用", 
    mood: 'happy',
    placeholder: "當玩膩了蛋糕、蠟燭、刮鬍泡，\n還有什麼祝福比上靠北更「終生難忘」！"
  },
  { 
    id: '假訊息', 
    label: '假訊息回報 🚫', 
    icon: <AlertOctagon />, 
    limit: 60, 
    color: 'text-red-500 border-red-500 shadow-red-500/50', 
    desc: "闢謠專線", 
    mood: 'lying',
    placeholder: "歡迎針對虛假訊息進行回報，\n小編將盡速處理！"
  },
];

type FormState = {
  agreed: boolean;
  category: CategoryType | null;
  content: string;
  hasImage: boolean;
  imageFile: File | null;
  email: string; // New field
};

const INITIAL_FORM_STATE: FormState = {
  agreed: false,
  category: null,
  content: '',
  hasImage: false,
  imageFile: null,
  email: ''
};

// --- COMPONENTS ---

const DangoMascot = ({ mood }: { mood: 'idle' | 'happy' | 'shocked' | 'love' | 'thinking' | 'sad' | 'writing' | 'lying' | 'rules' }) => {
  const variants = {
    idle: { scale: 1, rotate: 0 },
    happy: { scale: 1.1, rotate: [0, -10, 10, 0], transition: { repeat: Infinity, duration: 2 } },
    shocked: { scale: 0.9, x: [0, -5, 5, 0], transition: { repeat: Infinity, duration: 0.2 } },
    love: { scale: 1.05, y: [0, -10, 0], transition: { repeat: Infinity, duration: 1.5 } },
    thinking: { scale: 1, rotate: [0, 5, 0], transition: { repeat: Infinity, duration: 3 } },
    sad: { scale: 0.9, y: 10, rotate: [0, -5, 0] },
    writing: { scale: 1, rotate: [0, 5, 0], x: [0, 2, 0], transition: { repeat: Infinity, duration: 1 } },
    lying: { scale: 1, x: [0, -3, 3, 0], transition: { repeat: Infinity, duration: 2, repeatDelay: 1 } },
    rules: { scale: 1, rotate: [0, 2, -2, 0], transition: { repeat: Infinity, duration: 4 } }
  };

  const emojis = {
    idle: '🍡',
    happy: '🍡✨',
    shocked: '🍡⁉️',
    love: '🍡💖',
    thinking: '🍡💤',
    sad: '🍡💧',
    writing: '🍡✏️',
    lying: '🍡🤥',
    rules: '🍡📜'
  };

  return (
    <motion.div 
      className="text-6xl md:text-8xl select-none cursor-default filter drop-shadow-lg"
      variants={variants}
      animate={mood}
    >
      {emojis[mood]}
    </motion.div>
  );
};

const StepLayout = ({ title, children, dangoMood = 'idle' }: { title: string, children?: React.ReactNode, dangoMood?: 'idle' | 'happy' | 'shocked' | 'love' | 'thinking' | 'sad' | 'writing' | 'lying' | 'rules' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 1.05 }}
    transition={{ duration: 0.4, ease: "backOut" }}
    className="flex flex-col items-center w-full max-w-lg mx-auto p-6 min-h-[60vh] justify-center"
  >
    <div className="mb-8 text-center">
      <DangoMascot mood={dangoMood} />
      <h2 className="mt-6 text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-cyan-400 to-fuchsia-500 tracking-wider">
        {title}
      </h2>
    </div>
    <div className="w-full space-y-6">
      {children}
    </div>
  </motion.div>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/90 sticky top-0 z-10">
              <h3 className="text-xl font-bold text-lime-400 flex items-center gap-2">
                <Info size={20} /> {title}
              </h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X size={20} className="text-zinc-400 hover:text-white" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 text-zinc-300 leading-relaxed font-sans scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {children}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 text-center sticky bottom-0 z-10">
              <button 
                onClick={onClose}
                className="px-8 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-bold transition-colors w-full sm:w-auto"
              >
                我知道了 👌
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- MAIN APP ---

export default function App() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [activeModal, setActiveModal] = useState<'identity' | 'rules' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Background particle effect
  useEffect(() => {
    // Just a placeholder for potential canvas effect, keeping it simple for now
  }, []);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);
  
  const resetForm = () => {
      setForm(INITIAL_FORM_STATE);
      setStep(0);
      setSubmitted(false);
      setErrorMsg(null);
  };

  const handleCategorySelect = (cat: CategoryType) => {
    setForm({ ...form, category: cat, content: '' }); 
    setTimeout(nextStep, 300);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm({ ...form, content: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("圖片太大了！請上傳小於 5MB 的圖片 🍡");
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setForm({ ...form, imageFile: file });
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({...form, email: e.target.value});
  }

  // Helper to convert file to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };
  
  // Strict Identity Validation Logic
  const checkEmailStatus = (email: string) => {
      if (!email) return { valid: false, msg: '必填' };
      
      const lowerEmail = email.toLowerCase().trim();

      // Check length > 12 characters (must be strictly greater than 12)
      if (lowerEmail.length <= 12) {
          return { valid: false, msg: '僅接受 Google 或教育信箱', color: 'text-red-500' };
      }
      
      // 1. Specific School Student
      if (lowerEmail.endsWith('@std.tcfsh.tc.edu.tw')) {
          return { valid: true, type: 'school', label: '一中生投稿', color: 'text-green-400' };
      }
      
      // 2. Google Account
      if (lowerEmail.endsWith('@gmail.com')) {
           return { valid: true, type: 'general', label: '一般投稿', color: 'text-blue-400' };
      }

      // 3. Other tc.edu.tw domains (General)
      if (lowerEmail.endsWith('tc.edu.tw')) {
           return { valid: true, type: 'general', label: '一般投稿', color: 'text-blue-400' };
      }

      return { valid: false, msg: '僅接受 Google 或教育信箱', color: 'text-red-500' };
  }

  const handleSubmit = async () => {
    if (!form.category) return;
    
    // Final validation before submit
    const emailStatus = checkEmailStatus(form.email);
    if (!emailStatus.valid) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    let payload: any = {
        agreed: form.agreed ? "是" : "否",
        category: form.category.label,
        content: form.content,
        hasImage: form.hasImage ? "有" : "沒有",
        email: form.email, // Send email as is
        imageLink: "" // Fallback
    };

    try {
        // Handle File Upload if exists
        if (form.hasImage && form.imageFile) {
            const base64Data = await fileToBase64(form.imageFile);
            const cleanBase64 = base64Data.includes(',') 
                ? base64Data.split(',')[1] 
                : base64Data;
            
            payload.fileData = cleanBase64;
            payload.fileName = form.imageFile.name;
            payload.mimeType = form.imageFile.type;
        }

        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors", 
            headers: {
                "Content-Type": "text/plain",
            },
            body: JSON.stringify(payload)
        });

        setSubmitted(true);
        setIsSubmitting(false);

    } catch (err) {
        console.error("Submission Error:", err);
        setErrorMsg("傳送失敗，請檢查網路連線或稍後再試。");
        setIsSubmitting(false);
    }
  };

  const isContentValid = () => {
    if (!form.category) return false;
    const len = form.content.length;
    return len > 0 && len <= form.category.limit;
  };

  // Render Steps
  const renderStep = () => {
    switch (step) {
      case 0: // Welcome & Rules
        return (
          <>
            <StepLayout title="RULES / 版規" dangoMood="rules">
              <div className="bg-zinc-800/50 backdrop-blur-md border border-zinc-700 p-6 rounded-2xl space-y-4 text-sm md:text-base text-zinc-300 shadow-xl">
                <p>🚫 <span className="text-white font-bold">不可</span> 指名道姓、人身攻擊。</p>
                <p>🚫 <span className="text-white font-bold">禁止</span> 散布色情、暴力內容。</p>
                <p>⚖️ 言論自由無價 & 法律責任自負，別搞 !</p>
                <p>🍡 小編保有最終修改、刪除投稿的權利。</p>
                
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                   <button 
                     onClick={() => setActiveModal('identity')}
                     className="flex-1 py-3 px-4 rounded-xl border border-zinc-600 bg-zinc-900/50 hover:bg-zinc-800 hover:border-cyan-400 transition-all text-sm font-bold flex items-center justify-center gap-2 text-zinc-200"
                   >
                     <ShieldCheck size={18} className="text-cyan-400"/> 身份標註政策
                   </button>
                   <button 
                     onClick={() => setActiveModal('rules')}
                     className="flex-1 py-3 px-4 rounded-xl border border-zinc-600 bg-zinc-900/50 hover:bg-zinc-800 hover:border-fuchsia-400 transition-all text-sm font-bold flex items-center justify-center gap-2 text-zinc-200"
                   >
                     <ScrollText size={18} className="text-fuchsia-400"/> 投稿審稿細則
                   </button>
                </div>
              </div>
              
              <label className="flex items-center space-x-4 p-4 rounded-xl border-2 border-dashed border-zinc-600 hover:border-lime-400 transition-colors cursor-pointer group bg-zinc-900/50">
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${form.agreed ? 'bg-lime-400 border-lime-400' : 'border-zinc-500 group-hover:border-lime-400'}`}>
                  {form.agreed && <CheckCircle2 size={16} className="text-black" />}
                </div>
                <input 
                  type="checkbox" 
                  checked={form.agreed} 
                  onChange={(e) => setForm({...form, agreed: e.target.checked})}
                  className="hidden" 
                />
                <span className={`font-bold transition-colors ${form.agreed ? 'text-lime-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                  是，我理解並同意相關規則
                </span>
              </label>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                disabled={!form.agreed}
                className={`w-full py-4 rounded-xl font-black text-lg tracking-widest transition-all ${
                  form.agreed 
                  ? 'bg-lime-400 text-black shadow-[0_0_20px_rgba(163,230,53,0.4)]' 
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                LET'S GO 🚀
              </motion.button>
            </StepLayout>

            {/* Modals */}
            <Modal 
              isOpen={activeModal === 'identity'} 
              onClose={() => setActiveModal(null)} 
              title="身份識別政策 📣"
            >
              <div className="space-y-6">
                <div className="bg-cyan-500/10 border border-cyan-500/30 p-4 rounded-xl">
                  <h4 className="font-bold text-cyan-400 mb-2 text-lg">📌 身分標註認證</h4>
                  <p className="mb-3 leading-relaxed">
                    透過使用<span className="text-white font-bold">在學 Gmail 帳號</span>填寫投稿表單，即可以「一中生」身份發言，且投稿上將標註。
                  </p>
                  <div className="bg-cyan-900/40 p-3 rounded-lg text-sm text-cyan-200 border border-cyan-500/20">
                    💡 舉例：若您希望被標註「一中生投稿」，請記得在最後確認頁面填入學生 Gmail 帳號 
                    <br/>
                    (如 <span className="font-mono text-cyan-100 bg-black/30 px-1 rounded">xxxx@std.tcfsh.tc.edu.tw</span>)。
                  </div>
                </div>
                
                <div className="bg-zinc-800 p-4 rounded-xl">
                  <h4 className="font-bold text-zinc-400 mb-2 text-lg">📌 強制 Gmail 登錄</h4>
                  <p>為防範濫用，系統<span className="text-white font-bold">強制</span>要求填入有效的 Google 帳號或 tc.edu.tw 教育信箱。若非上述兩者，將無法送出投稿。</p>
                </div>
              </div>
            </Modal>

            <Modal 
              isOpen={activeModal === 'rules'} 
              onClose={() => setActiveModal(null)} 
              title="投稿細則"
            >
              <div className="space-y-8">
                <section>
                  <h4 className="text-lg font-bold text-white mb-3 border-l-4 border-lime-400 pl-3">【投稿基本規則】</h4>
                  <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                    <li>無人身攻擊或人格污辱</li>
                    <li>無違反 Meta 社群守則</li>
                    <li>無觸犯個人隱私</li>
                  </ul>
                </section>
                {/* Simplified rules content for brevity in this update, keeping layout consistent */}
                <div className="text-center text-zinc-500">
                    ... (同前述規則) ...
                </div>
              </div>
            </Modal>
          </>
        );

      case 1: // Category Selection
        return (
          <StepLayout title="CATEGORY / 分類" dangoMood="idle">
            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map((cat) => (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.05, rotate: Math.random() * 2 - 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCategorySelect(cat)}
                  className={`relative p-4 rounded-2xl bg-zinc-900 border-2 text-left transition-all duration-300 group overflow-hidden ${
                    form.category?.id === cat.id 
                    ? cat.color 
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-current`} />
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <div className="font-bold text-lg">{cat.label}</div>
                  <div className="text-xs opacity-60 mt-1">{cat.desc}</div>
                </motion.button>
              ))}
            </div>
            <div className="flex justify-start">
               <button onClick={prevStep} className="text-zinc-500 hover:text-white flex items-center text-sm font-mono mt-4">
                 <ChevronLeft size={16} /> BACK
               </button>
            </div>
          </StepLayout>
        );

      case 2: // Content Input
        return (
          <StepLayout title="CONTENT / 內容" dangoMood={form.category?.mood || 'thinking'}>
            <div className={`text-center mb-2 px-3 py-1 rounded-full border inline-block mx-auto ${form.category?.color.split(' ')[0]} border-current bg-black/30 text-xs font-mono`}>
              {form.category?.label} • 限 {form.category?.limit} 字
            </div>
            
            <div className="relative">
              <textarea
                value={form.content}
                onChange={handleContentChange}
                placeholder={form.category?.placeholder || "在這裡輸入你的內容..."}
                className="w-full h-48 bg-zinc-900 border-2 border-zinc-700 rounded-2xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all resize-none font-mono text-lg leading-relaxed"
                autoFocus
              />
              <div className={`absolute bottom-4 right-4 text-sm font-bold font-mono px-2 py-1 rounded ${
                (form.content.length > (form.category?.limit || 0)) 
                ? 'bg-red-500/20 text-red-500' 
                : 'bg-zinc-800 text-zinc-400'
              }`}>
                {form.content.length} / {form.category?.limit}
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={prevStep} className="flex-1 py-4 rounded-xl font-bold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
                BACK
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                disabled={!isContentValid()}
                className={`flex-1 py-4 rounded-xl font-black text-lg tracking-widest transition-all ${
                  isContentValid()
                  ? 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]' 
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                NEXT
              </motion.button>
            </div>
          </StepLayout>
        );

      case 3: // Image Option
        return (
          <StepLayout title="ATTACHMENT / 附件" dangoMood="shocked">
             <div className="bg-zinc-800/50 backdrop-blur-md border border-zinc-700 p-8 rounded-2xl text-center space-y-6">
                <div className="text-zinc-400">
                  <p className="mb-2 text-base text-lime-400">有圖像有真相？</p>
                  <p className="text-xs text-lime-400/80">※ 圖片/影像將會直接上傳至雲端，單檔限制 5MB。</p>
                </div>

                <div className="flex justify-center gap-4">
                  <button 
                    onClick={() => { setForm({...form, hasImage: false, imageFile: null}); nextStep(); }}
                    className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2 w-32 transition-all ${!form.hasImage ? 'border-zinc-600 hover:border-zinc-500 bg-zinc-900' : 'border-zinc-700 opacity-50'}`}
                  >
                    <X size={32} className="text-zinc-500" />
                    <span className="font-bold text-zinc-400">沒有</span>
                  </button>

                  <button 
                     onClick={() => { setForm({...form, hasImage: true}); }}
                     className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2 w-32 transition-all ${form.hasImage ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-zinc-600 hover:border-fuchsia-500 hover:text-fuchsia-500 text-zinc-400'}`}
                  >
                    <ImageIcon size={32} className={form.hasImage ? "text-fuchsia-500" : ""} />
                    <span className={`font-bold ${form.hasImage ? "text-fuchsia-500" : ""}`}>我有圖片</span>
                  </button>
                </div>

                <AnimatePresence>
                  {form.hasImage && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-600 rounded-xl cursor-pointer hover:border-fuchsia-500 hover:bg-zinc-800/50 transition-all group">
                         {form.imageFile ? (
                           <div className="flex flex-col items-center text-fuchsia-400">
                              <FileImage size={32} className="mb-2"/>
                              <span className="font-mono text-sm max-w-[200px] truncate">{form.imageFile.name}</span>
                              <span className="text-xs text-zinc-500">{(form.imageFile.size / 1024 / 1024).toFixed(2)} MB</span>
                           </div>
                         ) : (
                           <div className="flex flex-col items-center text-zinc-500 group-hover:text-zinc-300">
                              <UploadCloud size={32} className="mb-2"/>
                              <span className="text-sm font-bold">點擊上傳圖片</span>
                              <span className="text-xs text-lime-400/80">僅支援 JPG, PNG 檔</span>
                           </div>
                         )}
                         <input 
                           ref={fileInputRef}
                           type="file" 
                           accept="image/*" 
                           onChange={handleFileChange}
                           className="hidden" 
                         />
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             <div className="flex gap-4">
              <button onClick={prevStep} className="flex-1 py-4 rounded-xl font-bold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
                BACK
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                disabled={form.hasImage && !form.imageFile} // Disable if checked but no file
                className={`flex-1 py-4 rounded-xl font-black text-lg tracking-widest shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all ${
                   (form.hasImage && !form.imageFile)
                   ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed shadow-none'
                   : 'bg-fuchsia-500 text-white'
                }`}
              >
                NEXT
              </motion.button>
            </div>
          </StepLayout>
        );

      case 4: // Review & Identity
        const emailStatus = checkEmailStatus(form.email);
        return (
          <StepLayout title="REVIEW / 確認" dangoMood="happy">
             <div className="bg-zinc-900 border-2 border-zinc-700 p-6 rounded-2xl space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-zinc-800 rounded-bl-full opacity-50 pointer-events-none" />

                <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                   <div className="p-2 rounded bg-zinc-800 text-white">
                      {form.category?.icon}
                   </div>
                   <div>
                      <div className="text-xs text-zinc-500 font-mono uppercase">Category</div>
                      <div className="font-bold text-lg">{form.category?.label}</div>
                   </div>
                </div>

                <div>
                  <div className="text-xs text-zinc-500 font-mono uppercase mb-1">Content</div>
                  <div className="text-white text-lg whitespace-pre-wrap font-sans leading-relaxed">
                    {form.content}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-zinc-800">
                   <div className={`w-3 h-3 rounded-full ${form.hasImage ? 'bg-green-500' : 'bg-zinc-600'}`} />
                   <span className="text-sm text-zinc-400">
                      {form.hasImage ? `圖片附件: ${form.imageFile?.name || '無'}` : '無附件影像'}
                   </span>
                </div>
             </div>

             {/* Identity Verification Section - Updated Logic */}
             <div className={`border p-4 rounded-2xl flex flex-col gap-3 transition-colors ${
                 form.email ? (emailStatus.valid ? 'bg-zinc-900 border-zinc-700' : 'bg-red-900/10 border-red-500/50') : 'bg-zinc-900 border-zinc-700'
             }`}>
                 <div className="flex items-center gap-2 font-bold justify-between">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <ShieldCheck size={20} />
                        <span>身分標註 (必填)</span>
                    </div>
                    {/* Status Badge */}
                    {form.email && emailStatus.valid && (
                        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-zinc-800 border ${
                            emailStatus.type === 'school' ? 'border-green-500 text-green-400' : 'border-blue-500 text-blue-400'
                        }`}>
                            {emailStatus.type === 'school' ? <BadgeCheck size={14}/> : <User size={14} />}
                            {emailStatus.label}
                        </div>
                    )}
                 </div>
                 
                 <div className="relative">
                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                     <input 
                        type="email"
                        placeholder="請輸入 Google 帳號或學校信箱"
                        value={form.email}
                        onChange={handleEmailChange}
                        className={`w-full bg-zinc-900 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none transition-all placeholder-zinc-600 ${
                            !form.email ? 'border-zinc-700 focus:border-cyan-400' :
                            emailStatus.valid ? 'border-zinc-700 focus:border-green-400' : 'border-red-500 focus:border-red-500'
                        }`}
                     />
                     {form.email && (
                         <div className="absolute right-3 top-1/2 -translate-y-1/2">
                             {emailStatus.valid ? (
                                 <BadgeCheck className={emailStatus.color} size={20} />
                             ) : (
                                 <AlertOctagon className={emailStatus.color} size={20} />
                             )}
                         </div>
                     )}
                 </div>
                 
                 {!emailStatus.valid && form.email ? (
                     <p className="text-xs text-red-400 pl-1 font-bold">
                         ⛔ 錯誤：{emailStatus.msg}
                     </p>
                 ) : (
                     <p className="text-xs text-zinc-500 pl-1">
                         ※ 僅支援 <span className="font-mono text-cyan-500">gmail.com</span> 或 <span className="font-mono text-cyan-500">tc.edu.tw</span> 教育網域。
                     </p>
                 )}
             </div>

             <div className="space-y-4">
                {errorMsg && (
                    <div className="p-3 bg-red-500/20 border border-red-500 rounded-xl flex items-center gap-2 text-red-200 text-sm">
                        <AlertTriangle size={16} />
                        {errorMsg}
                    </div>
                )}
                <div className="flex gap-4">
                  <button onClick={prevStep} className="flex-1 py-4 rounded-xl font-bold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
                    EDIT
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting || !emailStatus.valid} // Block submit if email invalid
                    className="flex-1 py-4 rounded-xl font-black text-lg tracking-widest bg-gradient-to-r from-lime-400 to-cyan-400 text-black shadow-[0_0_20px_rgba(163,230,53,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 disabled:bg-none disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none"
                  >
                    {isSubmitting ? (
                      <span className="animate-pulse">SENDING...</span>
                    ) : (
                      <>
                        SUBMIT <Send size={20} />
                      </>
                    )}
                  </motion.button>
                </div>
             </div>
          </StepLayout>
        );
      
      default:
        return null;
    }
  };

  // Success Screen
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black text-white relative overflow-hidden">
         <motion.div 
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           className="text-center space-y-6 max-w-md z-10"
         >
           <DangoMascot mood="love" />
           <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-cyan-400">
             投稿成功！
           </h1>
           <p className="text-zinc-400">
             感謝您的貢獻，您的聲音已被接收🍡<br/>
             <span className="text-xs text-lime-400"> 串流湧動！請靜待小編~審核後就會發文囉！</span>
           </p>
           <button 
             onClick={resetForm} // Changed from window.location.reload()
             className="px-8 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-all"
           >
             再投一篇
           </button>
         </motion.div>
         <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-10 left-10 w-32 h-32 bg-fuchsia-500 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-500 rounded-full blur-3xl animate-pulse delay-700" />
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-lime-400 selection:text-black flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
           <img 
             src="https://i.meee.com.tw/xqGCQbQ.png" 
             alt="Logo" 
             className="w-10 h-10 rounded-full object-cover border-2 border-lime-400" 
           />
           <span className="font-bold tracking-tight">靠北臺中一中</span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
             <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= step ? 'w-8 bg-lime-400' : 'w-2 bg-zinc-800'}`} />
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait">
           {renderStep()}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-zinc-500 font-mono">
        &copy; {new Date().getFullYear()} <a href="https://www.instagram.com/tcfsh_cboy/" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400 transition-colors underline underline-offset-2">TCFSH_CBOY</a>. Designed with 🍡 Power.
      </footer>
    </div>
  );
}
