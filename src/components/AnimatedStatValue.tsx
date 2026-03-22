import CountUp from '@/components/reactbits/CountUp';

interface AnimatedStatValueProps {
  value: string;
  className?: string;
}

export default function AnimatedStatValue({ value, className = '' }: AnimatedStatValueProps) {
  const normalized = value.replace(/,/g, '').trim();
  const isNumeric = normalized !== '' && /^-?\d+(\.\d+)?$/.test(normalized);

  if (!isNumeric) {
    return <span className={className}>{value}</span>;
  }

  return <CountUp to={Number(normalized)} duration={1.6} delay={0.05} separator="," className={className} />;
}
