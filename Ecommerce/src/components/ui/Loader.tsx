import logo from '../../assets/logo.png';

function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  };
  return (
    <div
      className={`${s[size]} rounded-full border-black/10 border-t-[#030213] animate-spin`}
    />
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-white">
      <img src={logo} alt="Nexa" className="h-10 opacity-75" />
      <Spinner size="lg" />
    </div>
  );
}

export function SectionLoader({ label }: { label?: string } = {}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3">
      <Spinner size="md" />
      {label && <p className="text-sm text-[#717182]">{label}</p>}
    </div>
  );
}

export { Spinner };
