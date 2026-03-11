import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as htmlToImage from 'html-to-image';
import ReactMarkdown from 'react-markdown';
import { 
  PawPrint, 
  RotateCcw, 
  Share2, 
  Heart, 
  MessageCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Zap,
  Shield,
  Star,
  Compass,
  ChevronDown,
  AlertCircle,
  Lock,
  LogOut,
  CheckCircle2,
  Loader2,
  Venus,
  Mars
} from 'lucide-react';
import { 
  QUESTIONS, 
  MBTI_TYPES, 
  ZODIAC_DATA, 
  WU_XING_DATA, 
  PAST_LIFE_DATA,
  FORTUNE_DATA,
  BREED_DATA,
  CAT_BREED_DATA,
  GENDER_LABELS,
  getPersonalityTitleAndTemplate,
  ALL_MBTI_CODES,
  getRelationship,
  RelationshipResult
} from './data';

type Step = 'home' | 'quiz' | 'result';

const AUTH_KEY = 'petmbti_auth';
const CODE = '1234';

function AuthGate({ onAuth }: { onAuth: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CODE) {
      localStorage.setItem(AUTH_KEY, 'true');
      onAuth();
    } else {
      setError('验证码错误');
      setTimeout(() => setError(''), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8] px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-white text-center"
      >
        <div className="w-16 h-16 bg-[#FFE66D] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Lock size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-black mb-2">请输入邀请码</h2>
        <p className="text-gray-400 mb-6 text-sm font-medium">请输入您收到的访问邀请码</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="请输入邀请码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all text-center text-xl font-black tracking-[0.5em] ${
              error ? 'border-red-400 animate-shake' : 'border-transparent focus:border-[#FFE66D]'
            }`}
          />
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <button
            type="submit"
            className="w-full py-4 bg-[#2D2D2D] text-white rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            进入
          </button>
        </form>
        <p className="mt-6 text-[10px] text-gray-300 font-bold">验证成功后将在当前设备保持访问权限</p>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [step, setStep] = useState<Step>('home');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(QUESTIONS.length).fill(null));
  const [petName, setPetName] = useState('');
  const [petBirthday, setPetBirthday] = useState('');
  const [petType, setPetType] = useState('dog');
  const [petGender, setPetGender] = useState('male');
  const [selectedBreedId, setSelectedBreedId] = useState('other_dog');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [ownerMbti, setOwnerMbti] = useState('INTJ');
  const [matchResult, setMatchResult] = useState<RelationshipResult | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const showToastWithMsg = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  useEffect(() => {
    const auth = localStorage.getItem(AUTH_KEY);
    if (auth === 'true') {
      setIsAuthorized(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthorized(false);
  };

  const handleStart = () => {
    if (!petName.trim()) {
      showToastWithMsg('请输入你家毛孩子的名字哦！');
      return;
    }
    if (!petBirthday) {
      showToastWithMsg('请输入它的生日，我们需要计算星盘哦！');
      return;
    }
    setStep('quiz');
  };

  const handleAnswerSelect = (optionIndex: number) => {
    if (answers[currentQuestionIndex] !== null) return; // Prevent multiple selections

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);

    setTimeout(() => {
      setCurrentQuestionIndex(prev => {
        if (prev < QUESTIONS.length - 1) {
          return prev + 1;
        } else {
          setStep('result');
          return prev;
        }
      });
    }, 300);
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (answers[currentQuestionIndex] !== null && currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (answers[currentQuestionIndex] !== null && currentQuestionIndex === QUESTIONS.length - 1) {
      setStep('result');
    }
  };

  const scores = useMemo(() => {
    const s = { EI: 0, SN: 0, TF: 0, JP: 0 };
    answers.forEach((ansIndex, qIndex) => {
      if (ansIndex !== null) {
        const question = QUESTIONS[qIndex];
        if (ansIndex < question.options.length) {
          const opt = question.options[ansIndex];
          s[opt.dimension] += opt.value;
        }
      }
    });

    if (petType === 'dog') {
      const breed = BREED_DATA.find(b => b.id === selectedBreedId);
      if (breed) {
        if (breed.modifiers.EI) s.EI += breed.modifiers.EI;
        if (breed.modifiers.SN) s.SN += breed.modifiers.SN;
        if (breed.modifiers.TF) s.TF += breed.modifiers.TF;
        if (breed.modifiers.JP) s.JP += breed.modifiers.JP;
      }
    } else if (petType === 'cat') {
      const breed = CAT_BREED_DATA.find(b => b.id === selectedBreedId);
      if (breed) {
        if (breed.modifiers.EI) s.EI += breed.modifiers.EI;
        if (breed.modifiers.SN) s.SN += breed.modifiers.SN;
        if (breed.modifiers.TF) s.TF += breed.modifiers.TF;
        if (breed.modifiers.JP) s.JP += breed.modifiers.JP;
      }
    }

    // Gender modifiers (Scheme A: Mild weighting)
    if (petGender === 'male') {
      s.EI += 0.3; // Slightly more energetic
      s.JP += 0.2; // Slightly more territorial/structured
    } else if (petGender === 'female') {
      s.TF -= 0.3; // Slightly more empathetic/sensitive
      s.SN -= 0.2; // Slightly more intuitive
    }

    return s;
  }, [answers, petType, selectedBreedId, petGender]);

  const zodiac = useMemo(() => {
    if (!petBirthday) return ZODIAC_DATA["白羊座"];
    const date = new Date(petBirthday);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    let name = "白羊座";
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) name = "白羊座";
    else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) name = "金牛座";
    else if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) name = "双子座";
    else if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) name = "巨蟹座";
    else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) name = "狮子座";
    else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) name = "处女座";
    else if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) name = "天秤座";
    else if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) name = "天蝎座";
    else if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) name = "射手座";
    else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) name = "摩羯座";
    else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) name = "水瓶座";
    else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) name = "双鱼座";
    return ZODIAC_DATA[name];
  }, [petBirthday]);

  const wuXing = useMemo(() => {
    if (!petBirthday) return WU_XING_DATA["木"];
    const month = new Date(petBirthday).getMonth() + 1;
    if ([3, 4, 5].includes(month)) return WU_XING_DATA["木"];
    if ([6, 7, 8].includes(month)) return WU_XING_DATA["火"];
    if ([9, 10, 11].includes(month)) return WU_XING_DATA["金"];
    return WU_XING_DATA["水"];
  }, [petBirthday]);

  const resultType = useMemo(() => {
    const e = scores.EI >= 0 ? 'E' : 'I';
    const s = scores.SN >= 0 ? 'S' : 'N';
    const t = scores.TF >= 0 ? 'T' : 'F';
    const j = scores.JP >= 0 ? 'J' : 'P';
    const code = `${e}${s}${t}${j}`;
    const baseType = MBTI_TYPES[code] || MBTI_TYPES['ENFP'];
    
    // Scheme B: Result modifiers based on gender
    const genderLabel = GENDER_LABELS[petGender]?.[e] || GENDER_LABELS['neutral'][e];
    
    return { ...baseType, genderLabel };
  }, [scores, petGender]);

  const personalityTitle = useMemo(() => {
    if (!resultType.code) return "";
    const { title } = getPersonalityTitleAndTemplate(resultType.code, scores);
    return title;
  }, [resultType.code, scores]);

  const pastLife = useMemo(() => {
    if (!petBirthday || !resultType.code) return PAST_LIFE_DATA[0];
    
    // Combine MBTI code and Zodiac to create a more deterministic but varied seed
    const mbtiSeed = resultType.code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const zodiacSeed = zodiac.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const birthdaySeed = new Date(petBirthday).getTime() % 10000;
    
    const seed = mbtiSeed + zodiacSeed + birthdaySeed + (petName?.length || 0);
    const index = Math.abs(Math.floor(seed)) % PAST_LIFE_DATA.length;
    return PAST_LIFE_DATA[index];
  }, [petName, petBirthday, resultType.code, zodiac]);

  const indices = useMemo(() => {
    const sJP = scores.JP || 0;
    const sEI = scores.EI || 0;
    const sTF = scores.TF || 0;
    const sSN = scores.SN || 0;

    const stability = Math.min(100, Math.max(20, 50 + (sJP * 5) + (['土', '水'].includes(zodiac.element) ? 20 : 0)));
    const clinginess = Math.min(100, Math.max(20, 50 + (sEI * 3) - (sTF * 5)));
    const destructiveness = Math.min(100, Math.max(20, 50 + (sSN * 5) + (['火', '风'].includes(zodiac.element) ? 20 : 0)));
    return { 
      stability: isNaN(stability) ? 50 : stability, 
      clinginess: isNaN(clinginess) ? 50 : clinginess, 
      destructiveness: isNaN(destructiveness) ? 50 : destructiveness 
    };
  }, [scores, zodiac]);

  const fortune = useMemo(() => {
    if (!petBirthday) return "宜加餐，忌运动";
    
    // Daily seed + pet characteristics
    const today = new Date().getDate();
    const mbtiSeed = resultType.code?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    const seed = today + mbtiSeed + (petName?.length || 0);
    
    const item = FORTUNE_DATA[seed % FORTUNE_DATA.length];
    return `宜${item.yi}，忌${item.ji}`;
  }, [petName, petBirthday, resultType.code]);

  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;

  const reset = () => {
    setStep('home');
    setCurrentQuestionIndex(0);
    setAnswers(new Array(QUESTIONS.length).fill(null));
    setPetName('');
    setPetBirthday('');
    setPetGender('male');
    setSelectedBreedId(petType === 'dog' ? 'other_dog' : 'other_cat');
    setMatchResult(null);
  };

  const calculateMatch = () => {
    if (!resultType.code || !ownerMbti) return;
    const result = getRelationship(resultType.code, ownerMbti);
    setMatchResult(result);
  };

  const exportToImage = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPDF(true);
    
    try {
      // Use toPng for better compatibility in iframe
      const dataUrl = await htmlToImage.toPng(reportRef.current, {
        pixelRatio: 2,
        backgroundColor: '#FDFCF8',
        filter: (node) => {
          if (node instanceof HTMLElement && node.hasAttribute('data-html2canvas-ignore')) {
            return false;
          }
          return true;
        }
      });
      
      if (!dataUrl) throw new Error('截图生成失败');

      const fileName = `PetMBTI_${petName}_${new Date().toISOString().split('T')[0]}.png`;

      // Simplified download logic for better iframe compatibility
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToastWithMsg('报告图片已保存');
    } catch (error) {
      console.error('Image generation failed:', error);
      showToastWithMsg('生成报告图片失败，请重试');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!isAuthorized) {
    return <AuthGate onAuth={() => setIsAuthorized(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2D2D2D] font-sans selection:bg-[#FFE66D]">
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-[#2D2D2D] text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold"
          >
            <CheckCircle2 className="text-emerald-400" /> {toastMessage || '已保存到下载文件夹'}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center text-center"
          >
            <div className="mb-6 sm:mb-8 relative">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="w-32 h-32 bg-gradient-to-br from-[#FFE66D] to-[#FFD93D] rounded-full flex items-center justify-center shadow-2xl relative"
              >
                <PawPrint size={64} className="text-white drop-shadow-md" />
              </motion.div>
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter leading-tight">
              宠物灵性 <br/> <span className="text-[#FF6B6B]">性格测试</span>
            </h1>
            <p className="text-lg text-gray-400 mb-8 max-w-md font-medium">
              探索毛孩子的灵魂色彩，揭秘毛孩子的灵性人格。
            </p>

            <div className="w-full max-w-sm space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FFE66D] transition-colors">
                    <PawPrint size={20} />
                  </div>
                  <input
                    type="text"
                    placeholder="毛孩子的名字"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-white border-2 border-gray-100 rounded-[2rem] focus:border-[#FFE66D] outline-none transition-all text-xl font-bold placeholder:text-gray-200 shadow-sm"
                  />
                </div>
                
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FFE66D] transition-colors">
                    <Calendar size={20} />
                  </div>
                  <input
                    type="date"
                    value={petBirthday}
                    onChange={(e) => setPetBirthday(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-white border-2 border-gray-100 rounded-[2rem] focus:border-[#FFE66D] outline-none transition-all text-xl font-bold placeholder:text-gray-200 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                {[
                  { id: 'dog', label: '汪星人' },
                  { id: 'cat', label: '喵星人' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setPetType(type.id);
                      setSelectedBreedId(type.id === 'dog' ? 'other_dog' : 'other_cat');
                    }}
                    className={`flex-1 py-3 rounded-2xl border-2 transition-all font-black text-sm ${
                      petType === type.id 
                      ? 'border-[#FFE66D] bg-[#FFE66D] text-white shadow-md' 
                      : 'border-gray-100 text-gray-300 hover:border-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 justify-center">
                {[
                  { id: 'male', label: '公', icon: <Mars size={16} /> },
                  { id: 'female', label: '母', icon: <Venus size={16} /> }
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setPetGender(g.id)}
                    className={`flex-1 py-3 rounded-2xl border-2 transition-all font-black text-sm flex items-center justify-center gap-2 ${
                      petGender === g.id 
                      ? 'border-[#FF6B6B] bg-[#FF6B6B] text-white shadow-md' 
                      : 'border-gray-100 text-gray-300 hover:border-gray-200'
                    }`}
                  >
                    {g.icon} {g.label}
                  </button>
                ))}
              </div>

              {(petType === 'dog' || petType === 'cat') && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 text-left"
                >
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">
                    选择{petType === 'dog' ? '狗狗' : '猫猫'}品种
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBreedId}
                      onChange={(e) => setSelectedBreedId(e.target.value)}
                      className="w-full pl-6 pr-12 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#FFE66D] outline-none appearance-none font-bold text-gray-700 shadow-sm cursor-pointer"
                    >
                      {(petType === 'dog' ? BREED_DATA : CAT_BREED_DATA).map(breed => (
                        <option key={breed.id} value={breed.id}>
                          {breed.icon} {breed.name} ({breed.enName})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={20} />
                  </div>
                </motion.div>
              )}

              <button
                onClick={handleStart}
                className="w-full py-6 bg-[#2D2D2D] text-white rounded-[2rem] font-black text-2xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
              >
                开启灵性之旅 <ArrowRight size={28} />
              </button>

              <div className="flex items-center gap-2 justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <AlertCircle size={14} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 font-medium">
                  免责声明：品种倾向仅供参考，每个生命都是独特的个体。
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
          >
            <div className="mb-8 sm:mb-12">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <span className="text-xs font-black text-[#FF6B6B] uppercase tracking-[0.3em]">Deep Analysis</span>
                  <h2 className="text-3xl font-black">
                    {currentQuestionIndex + 1} <span className="text-gray-200">/ {QUESTIONS.length}</span>
                  </h2>
                </div>
                <p className="text-sm font-black text-[#FFE66D]">{Math.round(progress)}%</p>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden p-1 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-[#FFE66D] to-[#FFD93D] rounded-full shadow-sm"
                />
              </div>
            </div>

            <motion.h3 
              key={currentQuestionIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-black mb-12 leading-tight min-h-[4rem]"
            >
              {QUESTIONS[currentQuestionIndex]?.text}
            </motion.h3>

            <div className="grid grid-cols-1 gap-4">
              {QUESTIONS[currentQuestionIndex] && [...QUESTIONS[currentQuestionIndex].options, { text: "不清楚 / 没遇到过 / 不适用", dimension: 'EI', value: 0 }].map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(idx)}
                  className={`w-full p-6 bg-white border-2 rounded-3xl text-left transition-all group active:scale-[0.98] ${
                    answers[currentQuestionIndex] === idx 
                    ? 'border-[#FFE66D] bg-[#FFE66D]/5 shadow-lg' 
                    : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all shadow-sm ${
                      answers[currentQuestionIndex] === idx 
                      ? 'bg-[#FFE66D] text-white' 
                      : 'bg-gray-50 text-gray-300 group-hover:bg-gray-100'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className={`text-lg font-bold transition-colors ${
                      answers[currentQuestionIndex] === idx ? 'text-[#2D2D2D]' : 'text-gray-600'
                    }`}>
                      {option.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-12 flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
                className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all ${
                  currentQuestionIndex === 0 
                  ? 'text-gray-200 cursor-not-allowed' 
                  : 'text-gray-400 hover:bg-gray-100 hover:text-[#2D2D2D]'
                }`}
              >
                <ArrowLeft size={20} /> 上一题
              </button>

              <button
                onClick={handleNext}
                disabled={answers[currentQuestionIndex] === null}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-sm transition-all ${
                  answers[currentQuestionIndex] === null
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-[#2D2D2D] text-white hover:scale-105 shadow-lg'
                }`}
              >
                {currentQuestionIndex === QUESTIONS.length - 1 ? '查看结果' : '下一题'} <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-12"
          >
            <div ref={reportRef} className="rounded-[2rem] sm:rounded-[3rem] overflow-hidden border-4 sm:border-8 relative" style={{ backgroundColor: '#ffffff', borderColor: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              <div 
                className="p-6 sm:p-10 relative overflow-hidden"
                style={{ backgroundColor: resultType.color, color: '#ffffff' }}
              >
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <span className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                      SPIRITUAL REPORT
                    </span>
                    <span className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase border" style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                      {zodiac.name}
                    </span>
                    <span className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                      {petGender === 'male' ? '公' : petGender === 'female' ? '母' : '不确定'}
                    </span>
                  </div>
                  <h1 className="text-4xl sm:text-6xl font-black mb-3 sm:mb-4 tracking-tighter" style={{ color: '#ffffff' }}>{petName}</h1>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-3xl font-black px-3 sm:px-4 py-1 rounded-lg sm:rounded-xl" style={{ backgroundColor: '#ffffff', color: '#000000', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                      {zodiac.modifier}{resultType.elementModifier}{petType === 'dog' ? '犬' : petType === 'cat' ? '猫' : '灵'}
                    </span>
                    <span className="text-sm sm:text-xl font-black px-3 sm:px-4 py-1 rounded-lg sm:rounded-xl" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', color: '#ffffff' }}>
                      {resultType.genderLabel}
                    </span>
                    <span className="text-lg sm:text-2xl font-mono font-bold opacity-80" style={{ color: '#ffffff' }}>{resultType.code}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-10 space-y-8 sm:space-y-10">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="p-3 sm:p-4 rounded-2xl sm:rounded-[2rem] text-center border" style={{ backgroundColor: '#f9fafb', borderColor: '#f3f4f6' }}>
                    <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2" style={{ color: '#d1d5db' }}>五行属性</div>
                    <div className="text-sm sm:text-xl font-black" style={{ color: '#2D2D2D' }}>{wuXing.name}</div>
                  </div>
                  <div className="p-3 sm:p-4 rounded-2xl sm:rounded-[2rem] text-center border" style={{ backgroundColor: '#f9fafb', borderColor: '#f3f4f6' }}>
                    <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2" style={{ color: '#d1d5db' }}>幸运色</div>
                    <div className="text-sm sm:text-xl font-black" style={{ color: '#2D2D2D' }}>{zodiac.luckyColor}</div>
                  </div>
                  <div className="p-3 sm:p-4 rounded-2xl sm:rounded-[2rem] text-center border" style={{ backgroundColor: '#f9fafb', borderColor: '#f3f4f6' }}>
                    <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2" style={{ color: '#d1d5db' }}>守护元素</div>
                    <div className="text-sm sm:text-xl font-black" style={{ color: '#2D2D2D' }}>{zodiac.element}</div>
                  </div>
                </div>

                <section>
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#FFE66D', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                      <Sparkles size={18} className="sm:size-[20px]" style={{ color: '#ffffff' }} />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black" style={{ color: '#2D2D2D' }}>人格深度解析</h2>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <p className="text-lg sm:text-xl font-bold leading-snug italic border-l-4 pl-4 sm:pl-6" style={{ color: '#374151', borderLeftColor: '#FFE66D' }}>
                      "{resultType.summary}"
                    </p>
                    <p className="text-sm sm:text-base leading-relaxed font-medium" style={{ color: '#6b7280' }}>
                      {resultType.description} {zodiac.trait}。
                    </p>
                  </div>
                </section>

                <section className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>
                      <Zap size={18} className="sm:size-[20px]" style={{ color: '#3b82f6' }} />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black" style={{ color: '#2D2D2D' }}>灵魂指数</h2>
                  </div>
                  <div className="space-y-4 sm:space-y-5">
                    {[
                      { label: "情绪稳定指数", value: indices.stability, color: "#34d399" },
                      { label: "粘人撒娇指数", value: indices.clinginess, color: "#fb7185" },
                      { label: "拆家破坏指数", value: indices.destructiveness, color: "#fb923c" }
                    ].map((idx, i) => (
                      <div key={i} className="space-y-1.5 sm:space-y-2">
                        <div className="flex justify-between text-[10px] sm:text-sm font-black uppercase tracking-widest">
                          <span style={{ color: '#9ca3af' }}>{idx.label}</span>
                          <span style={{ color: '#374151' }}>{idx.value}%</span>
                        </div>
                        <div className="h-2 sm:h-2.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${idx.value}%` }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                            className="h-full"
                            style={{ backgroundColor: idx.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border" style={{ backgroundColor: '#faf5ff', borderColor: '#f3e8ff' }}>
                    <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2" style={{ color: '#d8b4fe' }}>前世身份</div>
                    <div className="text-lg sm:text-xl font-black" style={{ color: '#7e22ce' }}>{pastLife}</div>
                  </div>
                  <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border" style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7' }}>
                    <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2" style={{ color: '#fcd34d' }}>今日运势</div>
                    <div className="text-lg sm:text-xl font-black" style={{ color: '#b45309' }}>{fortune}</div>
                  </div>
                </div>

                {/* Pet-Owner Match Analysis Module */}
                <section className="p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border-4 space-y-6" style={{ backgroundColor: '#ffffff', borderColor: '#FFE66D', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#fffbeb' }}>
                      <Heart size={20} style={{ color: '#fb7185' }} />
                    </div>
                    <h2 className="text-2xl font-black" style={{ color: '#2D2D2D' }}>测测你和宠物的匹配度</h2>
                  </div>

                  <div className="space-y-4" data-html2canvas-ignore>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">你的 MBTI 类型</label>
                      <div className="flex gap-2">
                        <select 
                          value={ownerMbti}
                          onChange={(e) => setOwnerMbti(e.target.value)}
                          className="flex-1 px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#FFE66D] outline-none font-bold text-gray-700 shadow-sm cursor-pointer"
                        >
                          {ALL_MBTI_CODES.map(code => (
                            <option key={code} value={code}>{code}</option>
                          ))}
                        </select>
                        <button 
                          onClick={calculateMatch}
                          className="px-8 py-4 bg-[#2D2D2D] text-white rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          计算匹配度
                        </button>
                      </div>
                    </div>
                  </div>

                  {matchResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-6 pt-4"
                    >
                      <div className="text-center space-y-2">
                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">你和 {petName} 的匹配度</p>
                        <div className="text-6xl font-black text-[#fb7185] tracking-tighter">{matchResult.score}%</div>
                      </div>

                      <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden p-1 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${matchResult.score}%` }}
                          className="h-full bg-gradient-to-r from-[#fb7185] to-[#f43f5e] rounded-full shadow-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">关系类型</p>
                            <span className="px-3 py-1 bg-[#fb7185] text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                              {matchResult.type}
                            </span>
                          </div>
                          <p className="text-xl font-black text-[#2D2D2D]">{matchResult.summary}</p>
                        </div>

                        <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 space-y-3">
                          <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-[#fb7185]" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">日常相处画风</p>
                          </div>
                          <p className="text-sm font-bold text-gray-600 leading-relaxed">
                            {matchResult.vibe}
                          </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 space-y-4">
                          <div className="flex items-center gap-2">
                            <Shield size={14} className="text-[#3b82f6]" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">家庭话语权</p>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-end">
                              <div className="text-center">
                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">你</p>
                                <p className="text-lg font-black text-[#2D2D2D]">{matchResult.bossRatio.owner}%</p>
                              </div>
                              <div className="flex-1 px-4 pb-2">
                                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden flex">
                                  <div 
                                    className="h-full bg-[#3b82f6]" 
                                    style={{ width: `${matchResult.bossRatio.owner}%` }} 
                                  />
                                  <div 
                                    className="h-full bg-[#fb7185]" 
                                    style={{ width: `${matchResult.bossRatio.pet}%` }} 
                                  />
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">{petName}</p>
                                <p className="text-lg font-black text-[#fb7185]">{matchResult.bossRatio.pet}%</p>
                              </div>
                            </div>
                            <p className="text-[10px] text-center font-bold text-gray-400 italic">
                              “{matchResult.bossText}”
                            </p>
                          </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-[#2D2D2D] text-white space-y-2">
                          <div className="flex items-center gap-2">
                            <MessageCircle size={14} className="text-[#FFE66D]" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">相处建议</p>
                          </div>
                          <p className="text-sm font-bold leading-relaxed">
                            {matchResult.advice}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="text-center">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">宠物 MBTI</p>
                          <p className="text-lg font-black text-[#2D2D2D]">{resultType.code}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200" />
                        <div className="text-center">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">主人 MBTI</p>
                          <p className="text-lg font-black text-[#2D2D2D]">{ownerMbti}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </section>

                <div className="p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border text-center" style={{ backgroundColor: '#f9fafb', borderColor: '#f3f4f6' }}>
                  <div className="flex justify-center gap-2 mb-3 sm:mb-4">
                    <Shield size={14} className="sm:size-[16px]" style={{ color: '#d1d5db' }} />
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#d1d5db' }}>Algorithm Verification</span>
                  </div>
                  <p className="text-[10px] sm:text-xs leading-relaxed font-medium" style={{ color: '#9ca3af' }}>
                    本报告基于行为心理学（MBTI模型）、习惯稳定性理论与星象倾向模型交叉校验生成。
                  </p>
                </div>

                <div className="pt-6 flex flex-col items-center gap-6">
                  <div className="flex flex-col gap-6 w-full">
                    <div className="flex gap-4 w-full" data-html2canvas-ignore>
                      <button 
                        onClick={exportToImage}
                        disabled={isGeneratingPDF}
                        className="flex-1 py-5 bg-[#2D2D2D] text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingPDF ? (
                          <>
                            <Loader2 size={24} className="animate-spin" /> 生成中...
                          </>
                        ) : (
                          <>
                            <Share2 size={24} /> 保存报告图片
                          </>
                        )}
                      </button>
                      <button 
                        onClick={reset}
                        className="px-8 py-5 bg-gray-100 text-gray-500 rounded-[2rem] font-black text-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                      >
                        <RotateCcw size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="max-w-2xl mx-auto px-6 py-12 text-center">
        <button 
          onClick={handleLogout}
          className="text-gray-300 hover:text-gray-500 transition-colors flex items-center gap-2 mx-auto text-xs font-black uppercase tracking-widest"
        >
          <LogOut size={14} /> 退出验证系统
        </button>
      </footer>

      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FFE66D] rounded-full blur-[150px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FF6B6B] rounded-full blur-[150px]" 
        />
      </div>
    </div>
  );
}
