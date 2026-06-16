'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import Image from 'next/image';
import { Shield, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  mfaToken: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, clearAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [error, setError] = useState('');

  // Si llegamos a /login sin tokens válidos, limpiamos el estado de auth
  // para evitar el loop: isAuthenticated=true pero sin tokens → API falla → redirect /login
  useEffect(() => {
    const hasToken = !!localStorage.getItem('accessToken');
    if (!hasToken) clearAuth();
  }, [clearAuth]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      const result = await login(data.email, data.password, data.mfaToken);
      if (result?.requiresMfa) {
        setRequiresMfa(true);
        toast('Ingrese su código MFA de 6 dígitos', { icon: '🔐' });
        return;
      }
      toast.success('Sesión iniciada correctamente');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-pharma-950 to-pharma-900 flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-pharma-700/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pharma-900/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pharma-800/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo-polyfarma.jpg"
              alt="Laboratorios PolyFarma"
              width={160}
              height={104}
              className="rounded-xl object-contain shadow-lg"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Laboratorio de Control de Calidad</h1>
          <p className="text-gray-500 text-xs mt-1">By Lic. Oscar Gonzalez</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="px-2.5 py-0.5 bg-green-500/15 text-green-400 text-xs rounded-full border border-green-500/25 font-medium">
              21 CFR Part 11
            </span>
            <span className="px-2.5 py-0.5 bg-pharma-600/15 text-pharma-400 text-xs rounded-full border border-pharma-600/25 font-medium">
              GMP Annex 11
            </span>
          </div>
        </div>

        {/* Card de login */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">
            {requiresMfa ? 'Verificación de Identidad' : 'Iniciar Sesión'}
          </h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-200 rounded-lg p-3 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!requiresMfa ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pharma-500 focus:border-transparent transition"
                    placeholder="usuario@empresa.com"
                  />
                  {errors.email && (
                    <p className="text-red-300 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-lg px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-pharma-500 focus:border-transparent transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-300 text-xs mt-1">{errors.password.message}</p>
                  )}
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Código de Autenticación (MFA)
                </label>
                <input
                  {...register('mfaToken')}
                  type="text"
                  maxLength={6}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-pharma-500 transition"
                  placeholder="000000"
                  autoFocus
                />
                <p className="text-pharma-400 text-xs mt-2 text-center">
                  Ingrese el código de 6 dígitos de su aplicación autenticadora
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-pharma-600 hover:bg-pharma-700 active:bg-pharma-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg px-4 py-3 text-sm transition-all duration-150 flex items-center justify-center gap-2 mt-2 shadow-lg hover:shadow-pharma-900/50 focus:outline-none focus:ring-2 focus:ring-pharma-500 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  {requiresMfa ? 'Verificar Identidad' : 'Iniciar Sesión'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-gray-500 text-xs">
              Sus credenciales están protegidas con cifrado AES-256
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Esta sesión es auditada según 21 CFR Part 11
            </p>
          </div>
        </div>

        {/* Versión */}
        <p className="text-center text-gray-700 text-xs mt-4">
          Lab. Control de Calidad Polyfarma v1.0.0 — By Lic. Oscar Gonzalez | FDA 21 CFR Part 11 | GAMP 5
        </p>
      </div>
    </div>
  );
}
