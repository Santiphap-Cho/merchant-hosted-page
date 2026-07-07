import { useEffect, useState } from "react";

interface CountdownTimerProps {
  endTime?: Date;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function CountdownTimer({ endTime }: CountdownTimerProps) {
  const target =
    endTime ??
    (() => {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      return d;
    })();

  const [remaining, setRemaining] = useState(getRemaining(target));

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {[
        { label: "HRS", value: remaining.hours },
        { label: "MIN", value: remaining.minutes },
        { label: "SEC", value: remaining.seconds },
      ].map((unit) => (
        <div key={unit.label} className="flex flex-col items-center">
          <span className="bg-white/20 backdrop-blur rounded px-2 py-1 sm:px-3 sm:py-1.5 text-lg sm:text-2xl font-bold tabular-nums min-w-[2.5rem] sm:min-w-[3rem] text-center">
            {pad(unit.value)}
          </span>
          <span className="text-[10px] sm:text-xs mt-0.5 opacity-80">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

function getRemaining(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    hours: Math.floor(diff / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
  };
}
