'use client';

import { useEffect, useState } from 'react';

type Props = {
  date: Date;
  options?: Intl.DateTimeFormatOptions;
  type?: 'date' | 'time';
};

export default function SafeTime({ date, options, type = 'date' }: Props) {
  const [formatted, setFormatted] = useState('');

  useEffect(() => {
    if (!date || isNaN(new Date(date).getTime())) {
      setFormatted('Invalid date');
      return;
    }

    const formatFn =
      type === 'time'
        ? () => new Date(date).toLocaleTimeString([], options)
        : () => new Date(date).toLocaleDateString([], options);

    setFormatted(formatFn());
  }, [date, options, type]);

  return <>{formatted}</>;
}
