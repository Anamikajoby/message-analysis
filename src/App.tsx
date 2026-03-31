import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldQuestion, 
  Zap, 
  BrainCircuit, 
  Mail, 
  BarChart3, 
  Settings, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  AtSign
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from "@/src/lib/utils";

// --- Types ---

interface AnalysisResult {
  riskScore: number;
  verdict: "Safe" | "Suspicious";
  reasons: string[];
  warning: string;
  insight?: string;
}

interface Detection {
  id: string;
  title: string;
  status: "SAFE" | "PENDING" | "THREAT";
  details: string;
}

// --- Gemini Service ---

function extractJson(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : text;
}

async function analyzeMessage(message: string, contacts?: string): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is missing or invalid. Please configure it in the Secrets panel.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Analyze the following content and determine if it is a SAFE message, a PHISHING attempt, or GIBBERISH/NON-MESSAGE content.
    
    User Context:
    Known Contacts: ${contacts || "None provided"}
    
    Content to Analyze:
    """
    ${message}
    """
    
    Guidelines:
    1. If the content is gibberish, random characters, or clearly not a message/email, return a low riskScore (0-10) and verdict "Safe", and explicitly state "Non-message content detected" in the reasons.
    2. If it is a message, analyze for phishing signals (urgency, suspicious links, sender mismatch).
    3. Be neutral and unbiased.
    
    Return output strictly in JSON format:
    {
      "riskScore": number (0-100),
      "verdict": "Safe" or "Suspicious",
      "reasons": ["reason1", "reason2"],
      "warning": "Clear explanation for the user",
      "insight": "Technical pattern name (e.g., 'Gibberish Detected', 'Whaling', etc.)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    return JSON.parse(extractJson(text));
  } catch (error) {
    console.error("Detailed Analysis Error:", error);
    throw error;
  }
}

// --- Components ---

export default function App() {
  const [messageInput, setMessageInput] = useState("");
  const [contactsInput, setContactsInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [recentDetections, setRecentDetections] = useState<Detection[]>([
    { id: "0x8FA...92", title: "Payroll Update (Legitimate)", status: "SAFE", details: "Verified by 3 trust layers" },
    { id: "0x42B...11", title: "New Service Agreement", status: "PENDING", details: "Scanning attachments..." },
    { id: "0xCF9...04", title: "Invoice #882193-Z", status: "THREAT", details: "Social engineering signature" },
  ]);

  const handleAnalyze = async () => {
    if (!messageInput.trim()) return;
    
    setIsAnalyzing(true);
    setResult(null);
    
    try {
      const analysis = await analyzeMessage(messageInput, contactsInput);
      setResult(analysis);
      
      // Add to recent detections
      const newDetection: Detection = {
        id: `0x${Math.random().toString(16).slice(2, 8).toUpperCase()}...${Math.random().toString(16).slice(2, 4)}`,
        title: messageInput.slice(0, 30) + (messageInput.length > 30 ? "..." : ""),
        status: analysis.verdict === "Safe" ? "SAFE" : "THREAT",
        details: analysis.insight || analysis.warning.slice(0, 50) + "..."
      };
      setRecentDetections(prev => [newDetection, ...prev.slice(0, 2)]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      alert(`Analysis failed: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-24 md:pb-12">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary fill-primary/10" />
            <h1 className="text-xl font-extrabold tracking-tighter text-primary">Antigravity AI</h1>
          </div>
          
          <nav className="hidden md:flex gap-8">
            <a href="#" className="text-lg font-semibold tracking-tight text-primary border-b-2 border-primary">Defense</a>
            <a href="#" className="text-lg font-semibold tracking-tight text-on-surface-variant hover:text-primary transition-colors">Inbox</a>
            <a href="#" className="text-lg font-semibold tracking-tight text-on-surface-variant hover:text-primary transition-colors">Insights</a>
          </nav>

          <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border-2 border-surface-container">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0xus4_z-xSxdmE7o66jDvj5r_3m5hYwrZ7icSgaZ4Q9VNey8-WURNIQWQkRT5gN4yIMZLubDBsRxhy4Id-GPVNQAk3wJr7BeWrEbgMBJ-qFZSzxyfF8qAS_fUsd4VZ0wu4m8gyLXgRz3JwMaxmtVw_6hYYEeihnyD0KvcqP4TWjdQKUkJ8IVsKx7rBy67nTlpRdoqQXZFkgV6p1O-C_oh__zEa6lO1uw7FwGK6BPO3TVxDlzBgnEG4nvGfXLNFCiJAO3yK3dzVuC0" 
              alt="User"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <div className="h-px w-full bg-surface-container-low" />
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-12">
        {/* Hero */}
        <section className="mb-16">
          <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-3 block">Neural Security Layer</span>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-on-surface mb-6 max-w-3xl leading-[0.95]">
            Precision Intelligence for <span className="text-primary-container">Evolving Threats.</span>
          </h2>
          <p className="text-on-surface-variant text-lg max-w-xl leading-relaxed font-medium opacity-80">
            The Antigravity AI Engine analyzes linguistic patterns and contextual metadata to neutralize phishing attempts before they reach the inbox.
          </p>
        </section>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Input */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-lg p-8 shadow-[0_-4px_48px_rgba(27,28,28,0.06)]">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
                <BrainCircuit className="w-6 h-6 text-on-primary-fixed" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">Message Analysis</h3>
                <p className="text-sm text-on-surface-variant font-medium">Paste the suspicious content below</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">Message Input</label>
                <textarea 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="w-full h-64 bg-surface-container-highest border-none focus:ring-2 focus:ring-primary rounded-lg p-4 text-on-surface placeholder:text-outline transition-all resize-none font-medium" 
                  placeholder="Paste the raw email header and body content here for deep inspection..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">Known Contacts (optional)</label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                  <input 
                    type="text"
                    value={contactsInput}
                    onChange={(e) => setContactsInput(e.target.value)}
                    className="w-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary rounded-md pl-12 pr-4 py-3 text-on-surface placeholder:text-outline transition-all font-medium" 
                    placeholder="e.g., manager@company.com" 
                  />
                </div>
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !messageInput.trim()}
                className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-full shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:scale-100"
              >
                <span>{isAnalyzing ? "Analyzing..." : "Analyze Message"}</span>
                <Zap className={cn("w-5 h-5 transition-transform", isAnalyzing ? "animate-pulse" : "group-hover:translate-x-1")} />
              </button>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-5 space-y-8">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-surface-container-low rounded-lg p-8 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Risk Assessment</h3>
                      <div className="flex items-baseline gap-2">
                        <span className={cn(
                          "text-5xl font-black",
                          result.verdict === "Suspicious" ? "text-tertiary" : "text-primary"
                        )}>{result.riskScore}</span>
                        <span className="text-xl font-bold text-on-surface-variant">/ 100</span>
                      </div>
                    </div>
                    <div className={cn(
                      "px-4 py-2 rounded-full flex items-center gap-2",
                      result.verdict === "Suspicious" ? "bg-tertiary-container/20" : "bg-primary/10"
                    )}>
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        result.verdict === "Suspicious" ? "bg-tertiary" : "bg-primary"
                      )}></span>
                      <span className={cn(
                        "font-bold text-sm",
                        result.verdict === "Suspicious" ? "text-tertiary" : "text-primary"
                      )}>{result.verdict}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 w-full bg-surface-container-highest rounded-full mb-8 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${result.riskScore}%` }}
                      className={cn(
                        "h-full rounded-full shadow-lg",
                        result.verdict === "Suspicious" ? "bg-tertiary shadow-tertiary/30" : "bg-primary shadow-primary/30"
                      )}
                    />
                  </div>

                  {/* Warning Message */}
                  <div className={cn(
                    "bg-surface-container-lowest border-l-4 p-5 rounded-md mb-6",
                    result.verdict === "Suspicious" ? "border-tertiary" : "border-primary"
                  )}>
                    <div className="flex gap-3">
                      {result.verdict === "Suspicious" ? (
                        <ShieldAlert className="w-5 h-5 text-tertiary shrink-0" />
                      ) : (
                        <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                      )}
                      <p className="text-sm font-semibold text-on-surface leading-relaxed">
                        {result.warning}
                      </p>
                    </div>
                  </div>

                  {/* Reasons */}
                  <ul className="space-y-4">
                    {result.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <AlertCircle className={cn(
                          "w-4 h-4 mt-0.5 shrink-0",
                          result.verdict === "Suspicious" ? "text-tertiary" : "text-primary"
                        )} />
                        <span className="text-sm text-on-surface-variant font-medium leading-tight">{reason}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Insight Component */}
                  {result.insight && (
                    <div className="mt-8 bg-surface-container-lowest rounded-lg p-6 border-l-2 border-primary-fixed shadow-sm relative overflow-hidden">
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="w-4 h-4 text-primary fill-primary" />
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Antigravity Insight</h4>
                      </div>
                      <p className="text-sm text-on-surface-variant italic font-medium">
                        "{result.insight}"
                      </p>
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-primary-fixed/10 to-transparent"></div>
                    </div>
                  )}

                  <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary opacity-[0.03] rounded-full blur-3xl"></div>
                </motion.div>
              ) : (
                <div className="bg-surface-container-low rounded-lg p-8 h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-outline-variant/15">
                  <ShieldQuestion className="w-16 h-16 text-outline-variant mb-4" />
                  <h3 className="text-lg font-bold text-on-surface-variant mb-2">Awaiting Analysis</h3>
                  <p className="text-sm text-outline font-medium max-w-[200px]">
                    Paste a message to begin the neural security inspection.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Network Posture */}
        <section className="mt-20">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-2xl font-bold tracking-tight mb-2">Network Posture</h3>
              <p className="text-on-surface-variant font-medium">Live telemetry from the Antigravity fleet</p>
            </div>
            <button className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
              View Full Report <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentDetections.map((det, idx) => (
              <motion.div 
                key={det.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-surface-container-low p-6 rounded-lg border-b-4 border-transparent hover:border-primary/20 transition-all"
              >
                <div className="flex justify-between mb-4">
                  {det.status === "SAFE" ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : det.status === "THREAT" ? (
                    <ShieldAlert className="w-5 h-5 text-tertiary" />
                  ) : (
                    <Clock className="w-5 h-5 text-outline" />
                  )}
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-md",
                    det.status === "SAFE" ? "bg-primary/10 text-primary" :
                    det.status === "THREAT" ? "bg-tertiary/10 text-tertiary" :
                    "bg-surface-container-high text-on-surface-variant"
                  )}>
                    {det.status}
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant font-mono mb-2">{det.id}</p>
                <p className="font-bold text-sm truncate mb-1">{det.title}</p>
                <p className="text-[10px] text-outline font-medium">{det.details}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-8 pb-6 pt-2 bg-white/80 backdrop-blur-xl shadow-[0_-4px_48px_rgba(27,28,28,0.06)] rounded-t-[3rem]">
        <a href="#" className="flex flex-col items-center justify-center bg-primary text-white rounded-full p-3 scale-90">
          <ShieldCheck className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">Defense</span>
        </a>
        <a href="#" className="flex flex-col items-center justify-center text-on-surface-variant p-3">
          <Mail className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">Inbox</span>
        </a>
        <a href="#" className="flex flex-col items-center justify-center text-on-surface-variant p-3">
          <BarChart3 className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">Insights</span>
        </a>
        <a href="#" className="flex flex-col items-center justify-center text-on-surface-variant p-3">
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">Settings</span>
        </a>
      </nav>
    </div>
  );
}
