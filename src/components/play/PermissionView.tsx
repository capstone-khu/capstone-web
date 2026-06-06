import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function PermissionView({
  requesting,
  error,
  onStart,
  onBack,
}: {
  requesting: boolean;
  error: string | null;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <h1 className="text-xl font-bold">연주 준비</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                연주를 분석하려면 카메라(자세)와 마이크(음정·박자) 권한이 필요합니다.
              </p>
            </div>

            <div className="space-y-3 rounded-xl bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                <div>
                  <p className="text-sm font-semibold">카메라</p>
                  <p className="text-xs text-muted-foreground">
                    손목·팔꿈치·손가락 커브·어깨·엄지 자세를 분석합니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                <div>
                  <p className="text-sm font-semibold">마이크</p>
                  <p className="text-xs text-muted-foreground">
                    음정 정확도와 박자 타이밍을 실시간으로 측정합니다.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-posture/10 p-4">
                <p className="text-sm font-semibold text-foreground">{error}</p>
              </div>
            )}

            <Button size="lg" className="w-full" onClick={onStart} disabled={requesting}>
              {requesting ? '권한 요청 중…' : error ? '다시 시도' : '카메라 · 마이크 권한 요청'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={onBack}>
              뒤로가기
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
