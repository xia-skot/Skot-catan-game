import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, User, Lock, ArrowRight, Loader2, Database } from 'lucide-react';
import { socketService } from '../socketService';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  const [isForgotPassword, setIsForgotPassword] = useState(false);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    fetch('/api/db-status')
      .then(res => res.json())
      .then(data => setDbStatus(data.connected ? 'connected' : 'disconnected'))
      .catch(() => setDbStatus('disconnected'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        const res = await fetch('/api/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, newPassword: password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '重置失败');
        
        setSuccessText(data.message);
        setTimeout(() => setIsForgotPassword(false), 2000);
        return;
      }

      const endpoint = isRegistering ? '/api/register' : '/api/login';
      const body = isRegistering 
        ? { email, password, username, code }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '请求失败');
      }

      localStorage.setItem('catan_auth_token', data.token);
      localStorage.setItem('catan_player_name', data.user.username);
      socketService.playerId = data.user.id; // Switch the socket ID to their database ID
      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorText(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      setErrorText('请输入有效的邮箱地址');
      return;
    }
    setErrorText('');
    setSuccessText('');
    setCodeSending(true);

    try {
      const res = await fetch('/api/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '发送失败');
      
      setSuccessText(data.message);
      setCountdown(60);
    } catch (err: any) {
      setErrorText(err.message);
    } finally {
      setCodeSending(false);
    }
  };

  const handleGuestLogin = async () => {
    setErrorText('');
    setLoading(true);
    try {
      const gUsername = prompt("请输入游客昵称 (如果不填将随机生成):");
      const existingGuestId = localStorage.getItem('catan_guest_id');
      
      const res = await fetch('/api/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: gUsername, guestId: existingGuestId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '游客登录失败');
      
      localStorage.setItem('catan_guest_id', data.user.id);
      localStorage.setItem('catan_auth_token', data.token);
      localStorage.setItem('catan_player_name', data.user.username);
      socketService.playerId = data.user.id;
      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorText(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-50 font-sans items-center justify-center p-4 relative selection:bg-indigo-600 selection:text-white overflow-hidden">
      
      {/* 数据库状态指示器 */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {dbStatus === 'checking' && (
          <span className="flex items-center gap-1 text-xs text-slate-500 bg-white/80 px-2 py-1 rounded-md border border-slate-200">
            <Loader2 className="w-3 h-3 animate-spin" /> 检测数据库...
          </span>
        )}
        {dbStatus === 'connected' && (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-green-200 bg-green-50 text-green-600 font-medium">
            <Database className="w-3 h-3" /> 数据库已连接
          </span>
        )}
        {dbStatus === 'disconnected' && (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-red-200 bg-red-50 text-red-600 font-medium">
            <Database className="w-3 h-3" /> 数据库未连接 (请配置 MONGODB_URI)
          </span>
        )}
      </div>

      {/* Decorative background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-200 rounded-full blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] bg-emerald-100 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl shadow-indigo-100 border border-slate-200 max-w-md w-full relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner border border-slate-100">
            <img src="https://fastly.jsdelivr.net/gh/xia-skot/Catan_Pics/img/catan_logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-serif font-black italic mb-1 text-slate-800 tracking-tight">CATAN</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] opacity-40 font-black text-indigo-900">Professional Online Edition</p>
        </div>

        {errorText && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium text-center">
            {errorText}
          </div>
        )}
        {successText && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100 font-medium text-center">
            {successText}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="group">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block group-focus-within:text-indigo-500 transition-colors">
              邮箱地址
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@qq.com"
                className="w-full bg-slate-50 border border-slate-100 pl-10 pr-3 py-3 rounded-xl outline-none font-medium transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-sm"
              />
            </div>
          </div>

          <div className="group">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block group-focus-within:text-indigo-500 transition-colors">
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-100 pl-10 pr-3 py-3 rounded-xl outline-none font-medium transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-sm"
              />
            </div>
          </div>

          <AnimatePresence>
            {(isRegistering || isForgotPassword) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="group overflow-hidden"
              >
                {!isForgotPassword && (
                  <>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block group-focus-within:text-indigo-500 transition-colors mt-1">
                      游戏昵称
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
                      <input 
                        type="text" 
                        required={isRegistering && !isForgotPassword}
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="输入你的勇士之名"
                        className="w-full bg-slate-50 border border-slate-100 pl-10 pr-3 py-3 rounded-xl outline-none font-medium transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-sm"
                      />
                    </div>
                  </>
                )}

                <div className="mt-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block group-focus-within:text-indigo-500 transition-colors">
                    邮箱验证码
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      required={isRegistering || isForgotPassword}
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      placeholder="6位验证码"
                      maxLength={6}
                      className="flex-grow bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl outline-none font-medium transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-sm"
                    />
                    <button
                      type="button"
                      disabled={codeSending || countdown > 0}
                      onClick={handleSendCode}
                      className="whitespace-nowrap px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-50 font-medium rounded-xl transition-colors text-sm"
                    >
                      {codeSending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                        countdown > 0 ? `${countdown}s 后重试` : '发送验证码'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isForgotPassword && !isRegistering && (
             <div className="flex justify-end">
               <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[11px] text-indigo-500 font-bold hover:underline transition-all">
                 忘记密码？
               </button>
             </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isForgotPassword ? '重置密码' : (isRegistering ? '注册并登录' : '邮箱登录'))}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-4 text-center">
          {!isForgotPassword ? (
            <>
              <button 
                type="button" 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                {isRegistering ? '已有账号？返回登录' : '没有账号？点击注册'}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase tracking-widest">OR</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button 
                type="button" 
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group"
              >
                游客免注册登录
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          ) : (
             <button 
                type="button" 
                onClick={() => setIsForgotPassword(false)}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                返回登录
              </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
