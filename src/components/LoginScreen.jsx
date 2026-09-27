import React, { useState } from "react";
import { Lock, Mail, KeyRound, ChevronRight, ShieldCheck, Activity, Loader2 } from "lucide-react";
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "../utils/firebase";

export function LoginScreen({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    setError("");

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Bemærk: onAuthStateChanged i App.jsx håndterer selve login-statet
    } catch (err) {
      let msg = "Der opstod en fejl.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") msg = "Forkert e-mail eller adgangskode.";
      if (err.code === "auth/email-already-in-use") msg = "E-mailen er allerede i brug.";
      if (err.code === "auth/weak-password") msg = "Adgangskoden skal være mindst 6 tegn.";
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center p-6 text-white selection:bg-blue-500/30">
      
      {/* Dekorativ baggrundseffekt */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-900 shadow-[0_0_40px_rgba(37,99,235,0.3)] mb-6 border border-blue-500/30">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2" style={{ fontFamily: "Sanomat Sans Web, sans-serif" }}>
            SINCITY<span className="text-blue-500">RADAR</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm tracking-wide">
            2-3% Swing Strategy & Portfolio Tracker
          </p>
        </div>

        {/* Login Formular */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-extrabold mb-6">
            {isRegistering ? "Opret Konto" : "Log Ind"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">E-mailadresse</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-500" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-white text-base rounded-2xl pl-11 pr-4 py-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium"
                  placeholder="din@email.dk"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Adgangskode</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="w-5 h-5 text-slate-500" />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-white text-base rounded-2xl pl-11 pr-4 py-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl font-medium">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed text-white font-extrabold text-base py-4 rounded-2xl shadow-[0_4px_20px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isRegistering ? "Opret Konto" : "Log Ind"}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              {isRegistering ? "Har du allerede en konto? Log ind" : "Ny bruger? Opret en konto"}
            </button>
          </div>
        </div>

        {/* Sikkerheds-badge */}
        <div className="mt-10 flex items-center justify-center gap-2 text-slate-500">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-medium">Sikret og krypteret portefølje-data</span>
        </div>
      </div>
    </div>
  );
}
