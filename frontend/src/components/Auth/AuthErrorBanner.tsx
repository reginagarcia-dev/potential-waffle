export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger ring-1 ring-danger/20">
      {message}
    </div>
  );
}
