import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Trophy, 
  UserPlus, 
  Upload, 
  Trash2, 
  Play, 
  RotateCcw, 
  Settings2,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Download,
  Database,
  UserCheck
} from 'lucide-react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Participant {
  id: string;
  name: string;
}

type View = 'input' | 'draw' | 'group';

// --- Constants ---
const MOCK_NAMES = [
  '王小明', '李小華', '張大千', '林志玲', '周杰倫', 
  '蔡依林', '陳奕迅', '五月天', '蕭敬騰', '鄧紫棋',
  '王力宏', '林俊傑', '張惠妹', '孫燕姿', '梁靜茹',
  '羅志祥', '楊丞琳', '潘瑋柏', '郭采潔', '趙又廷'
];

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  disabled 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  className?: string;
  disabled?: boolean;
}) => {
  const variants = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm',
    secondary: 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 shadow-sm',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
    ghost: 'bg-transparent text-zinc-600 hover:bg-zinc-100',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('glass rounded-2xl p-6', className)}>
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [view, setView] = useState<View>('input');
  const [inputText, setInputText] = useState('');
  
  // Lucky Draw State
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [drawnHistory, setDrawnHistory] = useState<Participant[]>([]);
  const [currentCyclingName, setCurrentCyclingName] = useState<string>('');

  // Grouping State
  const [groupSize, setGroupSize] = useState(3);
  const [groups, setGroups] = useState<Participant[][]>([]);

  // Duplicate Detection
  const duplicateNames = useMemo(() => {
    const counts: Record<string, number> = {};
    participants.forEach(p => {
      counts[p.name] = (counts[p.name] || 0) + 1;
    });
    return Object.keys(counts).filter(name => counts[name] > 1);
  }, [participants]);

  const hasDuplicates = duplicateNames.length > 0;

  // --- Handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const names = results.data
          .flat()
          .map(n => String(n).trim())
          .filter(n => n.length > 0);
        
        const newParticipants = names.map(name => ({
          id: Math.random().toString(36).substr(2, 9),
          name
        }));
        setParticipants(prev => [...prev, ...newParticipants]);
      },
      header: false
    });
  };

  const handleAddManual = () => {
    const names = inputText
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);
    
    const newParticipants = names.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name
    }));
    setParticipants(prev => [...prev, ...newParticipants]);
    setInputText('');
  };

  const loadMockData = () => {
    const newParticipants = MOCK_NAMES.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name
    }));
    setParticipants(newParticipants);
  };

  const removeDuplicates = () => {
    const seen = new Set();
    const uniqueParticipants = participants.filter(p => {
      if (seen.has(p.name)) return false;
      seen.add(p.name);
      return true;
    });
    setParticipants(uniqueParticipants);
  };

  const clearParticipants = () => {
    if (confirm('確定要清除所有名單嗎？')) {
      setParticipants([]);
      setDrawnHistory([]);
      setWinner(null);
      setGroups([]);
    }
  };

  // Lucky Draw Logic
  const startDraw = () => {
    if (participants.length === 0) return;
    
    const available = allowRepeat 
      ? participants 
      : participants.filter(p => !drawnHistory.find(h => h.id === p.id));

    if (available.length === 0) {
      alert('所有人都已經抽過了！');
      return;
    }

    setIsDrawing(true);
    setWinner(null);

    let count = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * available.length);
      setCurrentCyclingName(available[randomIndex].name);
      count++;
      
      if (count > 20) {
        clearInterval(interval);
        const finalWinner = available[Math.floor(Math.random() * available.length)];
        setWinner(finalWinner);
        setDrawnHistory(prev => [...prev, finalWinner]);
        setIsDrawing(false);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b']
        });
      }
    }, 100);
  };

  // Grouping Logic
  const generateGroups = () => {
    if (participants.length === 0) return;
    
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const newGroups: Participant[][] = [];
    
    for (let i = 0; i < shuffled.length; i += groupSize) {
      newGroups.push(shuffled.slice(i, i + groupSize));
    }
    
    setGroups(newGroups);
  };

  const exportGroupsToCSV = () => {
    if (groups.length === 0) return;

    const csvData = groups.flatMap((group, index) => 
      group.map(p => ({
        '組別': `第 ${index + 1} 組`,
        '姓名': p.name
      }))
    );

    const csv = Papa.unparse(csvData);
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `分組結果_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
            <Users size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">HR 抽籤分組工具</h1>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Internal Tool</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
          <button 
            onClick={() => setView('input')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              view === 'input' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            名單匯入
          </button>
          <button 
            onClick={() => setView('draw')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              view === 'draw' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            獎品抽籤
          </button>
          <button 
            onClick={() => setView('group')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              view === 'group' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            自動分組
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-zinc-500 font-medium">目前名單</p>
            <p className="text-sm font-bold">{participants.length} 人</p>
          </div>
          <Button variant="ghost" onClick={clearParticipants} className="text-red-500 hover:bg-red-50">
            <Trash2 size={18} />
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        <AnimatePresence mode="wait">
          {view === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                  <div className="flex items-center gap-2 mb-4 text-zinc-900">
                    <Database size={20} />
                    <h2 className="font-bold">快速開始</h2>
                  </div>
                  <p className="text-sm text-zinc-500 mb-4">
                    如果您是第一次使用，可以點擊下方按鈕載入模擬名單進行測試。
                  </p>
                  <Button variant="secondary" onClick={loadMockData} className="w-full">
                    載入模擬名單
                  </Button>
                </Card>

                <Card className="md:col-span-1">
                  <div className="flex items-center gap-2 mb-4 text-zinc-900">
                    <Upload size={20} />
                    <h2 className="font-bold">上傳 CSV 檔案</h2>
                  </div>
                  <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-zinc-300 transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-400">
                      <Upload size={20} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-zinc-900">點擊或拖曳檔案</p>
                    </div>
                  </div>
                </Card>

                <Card className="md:col-span-1">
                  <div className="flex items-center gap-2 mb-4 text-zinc-900">
                    <UserPlus size={20} />
                    <h2 className="font-bold">手動貼上姓名</h2>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="每行一個姓名"
                    className="w-full h-24 p-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none text-sm resize-none"
                  />
                  <Button onClick={handleAddManual} className="w-full mt-3" disabled={!inputText.trim()}>
                    加入名單
                  </Button>
                </Card>
              </div>

              <Card>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="font-bold text-xl">名單預覽 ({participants.length})</h2>
                    {hasDuplicates && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-100 animate-pulse">
                        <AlertCircle size={14} />
                        發現重複姓名
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasDuplicates && (
                      <Button variant="danger" onClick={removeDuplicates} className="text-xs py-1.5">
                        移除重複姓名
                      </Button>
                    )}
                    {participants.length > 0 && (
                      <Button variant="secondary" onClick={() => setView('draw')}>
                        開始抽籤 <ChevronRight size={18} />
                      </Button>
                    )}
                  </div>
                </div>
                
                {participants.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-zinc-400">
                    <Users size={48} strokeWidth={1} />
                    <p className="mt-4 font-medium">尚未匯入任何名單</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {participants.map((p) => {
                      const isDuplicate = duplicateNames.includes(p.name);
                      return (
                        <div 
                          key={p.id} 
                          className={cn(
                            "px-3 py-2 border rounded-lg text-sm font-medium flex items-center justify-between group transition-colors",
                            isDuplicate 
                              ? "bg-amber-50 border-amber-200 text-amber-700" 
                              : "bg-white border-zinc-100 text-zinc-700"
                          )}
                        >
                          <span className="truncate flex items-center gap-2">
                            {p.name}
                            {isDuplicate && <AlertCircle size={12} className="text-amber-400" />}
                          </span>
                          <button 
                            onClick={() => setParticipants(prev => prev.filter(x => x.id !== p.id))}
                            className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {view === 'draw' && (
            <motion.div
              key="draw"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <Card className="text-center py-12 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500" />
                
                <div className="mb-8">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-4">
                    <Trophy size={32} />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">幸運大抽獎</h2>
                  <p className="text-zinc-500 mt-2">點擊按鈕隨機抽取一名幸運兒</p>
                </div>

                <div className="h-40 flex items-center justify-center mb-8">
                  <AnimatePresence mode="wait">
                    {isDrawing ? (
                      <motion.div
                        key="cycling"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-5xl font-black text-zinc-900"
                      >
                        {currentCyclingName}
                      </motion.div>
                    ) : winner ? (
                      <motion.div
                        key="winner"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                      >
                        <span className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-2">Winner</span>
                        <div className="text-6xl font-black text-zinc-900 drop-shadow-sm">
                          {winner.name}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="text-zinc-300 text-5xl font-black">???</div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <Button 
                    onClick={startDraw} 
                    className="px-12 py-4 text-lg rounded-2xl"
                    disabled={isDrawing || participants.length === 0}
                  >
                    {isDrawing ? '抽籤中...' : winner ? '再抽一次' : '開始抽籤'}
                  </Button>

                  <div className="flex items-center gap-6 mt-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div 
                        onClick={() => setAllowRepeat(!allowRepeat)}
                        className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                          allowRepeat ? "bg-zinc-900 border-zinc-900" : "border-zinc-300 group-hover:border-zinc-400"
                        )}
                      >
                        {allowRepeat && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium text-zinc-600">允許重複中獎</span>
                    </label>
                    <div className="h-4 w-px bg-zinc-200" />
                    <div className="text-sm font-medium text-zinc-500">
                      剩餘可抽：{participants.length - (allowRepeat ? 0 : drawnHistory.length)} 人
                    </div>
                  </div>
                </div>
              </Card>

              {drawnHistory.length > 0 && (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2">
                      <RotateCcw size={18} className="text-zinc-400" />
                      中獎歷史
                    </h3>
                    <button 
                      onClick={() => setDrawnHistory([])}
                      className="text-xs font-bold text-zinc-400 hover:text-zinc-600"
                    >
                      清除歷史
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {drawnHistory.map((h, i) => (
                      <div key={i} className="px-3 py-1 bg-zinc-100 rounded-full text-xs font-bold text-zinc-600">
                        {h.name}
                      </div>
                    )).reverse()}
                  </div>
                </Card>
              )}
            </motion.div>
          )}

          {view === 'group' && (
            <motion.div
              key="group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">自動分組</h2>
                    <p className="text-zinc-500 text-sm">設定每組人數，系統將隨機分配名單</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setGroupSize(Math.max(2, groupSize - 1))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all"
                      >
                        -
                      </button>
                      <div className="px-4 font-bold text-sm min-w-[80px] text-center">
                        每組 {groupSize} 人
                      </div>
                      <button 
                        onClick={() => setGroupSize(groupSize + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all"
                      >
                        +
                      </button>
                    </div>
                    <Button onClick={generateGroups} disabled={participants.length === 0}>
                      開始分組
                    </Button>
                    {groups.length > 0 && (
                      <Button variant="success" onClick={exportGroupsToCSV}>
                        <Download size={18} /> 匯出結果
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {groups.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="h-full border-t-4 border-t-zinc-900">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-black text-zinc-400 uppercase tracking-tighter">Team {i + 1}</h3>
                          <span className="text-xs font-bold px-2 py-1 bg-zinc-100 rounded-md text-zinc-500">
                            {group.length} 人
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {group.map((p) => (
                            <li key={p.id} className="flex items-center gap-3 text-sm font-medium text-zinc-700">
                              <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                              {p.name}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-zinc-300">
                  <Settings2 size={64} strokeWidth={1} />
                  <p className="mt-4 font-medium">點擊「開始分組」按鈕生成結果</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center border-t border-zinc-100">
        <p className="text-xs text-zinc-400 font-medium">
          &copy; {new Date().getFullYear()} HR Tooling. Built for efficiency.
        </p>
      </footer>
    </div>
  );
}
