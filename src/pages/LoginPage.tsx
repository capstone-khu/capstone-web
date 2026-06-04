import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuthStore';
import { login } from '@/api/auth';

const schema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', password: '' },
  });

  const setAuth = useAuthStore((state) => state.setAuth);

  const onSubmit = async (a: FormValues) => {
    try {
      // api로 데이터 받아오기 
      const result = await login(a);
      const { user, access_token } = result.data;
      // JWT 토큰을 localStorage에 저장
      localStorage.setItem('access_token', access_token);

      // useAuthStore 업데이트
      setAuth(user, access_token);

      navigate('/', {
        replace: true,
      });
    } catch (error) {
      console.error(error);

      alert('로그인 실패');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">CAPSTONE DESIGN</h1>
          <p className="text-sm text-muted-foreground">로그인하고 연주를 시작하세요</p>
        </header>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Field label="이름" error={errors.name?.message}>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="이름을 입력하세요"
                  className={inputCls(!!errors.name)}
                  {...register('name')}
                />
              </Field>

              <Field label="비밀번호" error={errors.password?.message}>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요"
                  className={inputCls(!!errors.password)}
                  {...register('password')}
                />
              </Field>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                로그인
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function inputCls(hasError: boolean): string {
  const base =
    'block w-full rounded-xl border bg-card px-4 py-3 text-sm font-medium shadow-soft placeholder:text-muted-foreground focus-visible:outline-none';
  return hasError
    ? `${base} border-destructive focus-visible:border-destructive`
    : `${base} border-input focus-visible:border-foreground`;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold">{label}</label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
