import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, KeyRound, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface LoginDialogProps {
  lang: 'th' | 'en';
  onLoginSuccess: (token: string, user: any) => void;
  onCancel?: () => void;
}

export default function LoginDialog({ lang, onLoginSuccess, onCancel }: LoginDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const DEMO_EMAIL = 'naeef.benyakal@gmail.com';
  const DEMO_PASSWORD = 'NFLANDii403190';

  const fillDemoCredentials = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setError(null);
    // Simulate standard Oauth Login success instantly
    setTimeout(() => {
      onLoginSuccess('mock-jwt-token-yala-epidemic-sec', {
        name: 'Naeef Benyakal',
        email: DEMO_EMAIL,
        role: 'official',
        department: 'Yala Public Health Municipality'
      });
      setLoading(false);
    }, 800);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(data.token, data.user);
      } else {
        setError(
          lang === 'th' 
            ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองอีกครั้ง' 
            : data.message || 'Invalid credentials. Please double check.'
        );
      }
    } catch (err) {
      console.error(err);
      setError(
        lang === 'th' 
          ? 'การเชื่อมต่อไปยังเซิร์ฟเวอร์ความปลอดภัยล้มเหลว' 
          : 'Connection to security server failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-full max-w-md mx-auto" id="login_card">
      {/* Visual Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white text-center relative">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Lock size={22} className="text-blue-100" />
        </div>
        <h3 className="text-sm font-extrabold uppercase tracking-wider">
          {lang === 'th' ? 'เข้าสู่ระบบเจ้าหน้าที่สาธารณสุข' : 'Official Portal Access'}
        </h3>
        <p className="text-[10px] text-blue-100 mt-1 uppercase tracking-widest font-bold">
          {lang === 'th' ? 'ฝ่ายควบคุมและป้องกันโรคระบาด เทศบาลนครยะลา' : 'Yala Municipality Epidemic Control Department'}
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* Error notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg flex items-start space-x-2 text-xs">
            <ShieldAlert size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'th' ? 'จีเมลเจ้าหน้าที่ (Gmail)' : 'Official Email Address'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail size={15} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="naeef.benyakal@gmail.com"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'th' ? 'รหัสผ่านเฉพาะ' : 'Access Password'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <KeyRound size={15} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition duration-150 shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            id="login_submit_btn"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>{lang === 'th' ? 'ลงชื่อเข้าใช้ด้วยระบบความปลอดภัย' : 'Sign In Securely'}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Pre-fill Shortcut */}
        <div className="bg-blue-50/40 border border-blue-100 p-3.5 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-blue-800 uppercase tracking-wider">
            <span>{lang === 'th' ? 'ข้อมูลสิทธิ์บัญชีสำหรับผู้ทดสอบ' : 'Reviewer Credentials'}</span>
            <button
              onClick={fillDemoCredentials}
              className="text-blue-600 hover:text-blue-800 underline font-extrabold cursor-pointer"
              type="button"
              id="autofill_credentials_btn"
            >
              {lang === 'th' ? 'กรอกข้อมูลอัตโนมัติ' : 'Auto-fill Fields'}
            </button>
          </div>
          <div className="text-[10px] text-slate-600 font-mono space-y-0.5">
            <div>Email: <span className="text-slate-900 font-bold">{DEMO_EMAIL}</span></div>
            <div>Password: <span className="text-slate-900 font-bold">{DEMO_PASSWORD}</span></div>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-white px-3 text-slate-400">
              {lang === 'th' ? 'หรือยืนยันตัวตนผ่าน' : 'Or Authenticate With'}
            </span>
          </div>
        </div>

        {/* Google SSO Login */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading}
          className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition duration-150 flex items-center justify-center space-x-2.5 shadow-xs bg-white cursor-pointer"
          id="google_oauth_btn"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>{lang === 'th' ? 'ดำเนินการต่อด้วยจีเมล (Google)' : 'Continue with Google Sign-In'}</span>
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            type="button"
            className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 hover:underline pt-2 font-bold uppercase tracking-wider cursor-pointer"
          >
            {lang === 'th' ? 'กลับไปยังโหมดประชาชนทั่วไป' : 'Go Back to Public Mode'}
          </button>
        )}
      </div>
    </div>
  );
}
