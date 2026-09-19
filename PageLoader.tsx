import { WestbridgeLogo } from './WestbridgeLogo';

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function PageLoader({
  message,
  fullScreen = true,
}: PageLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center w-14 h-14">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/25 border-t-blue-500 animate-spin" />
        <WestbridgeLogo showWordmark={false} size={26} />
      </div>
      {message ? <p className="text-sm text-gray-400">{message}</p> : null}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[100dvh] bg-navy-950 flex items-center justify-center p-6">
        {content}
      </div>
    );
  }
  return <div className="py-16 flex items-center justify-center">{content}</div>;
}
