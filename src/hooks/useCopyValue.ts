import { useState } from 'react';

import { MODERATE_DEBOUNCE_MS } from '@/constants/debounce';
import { STRING_KEYS } from '@/constants/localization';

import { copyToClipboard } from '@/lib/copy';

import { useStringGetter } from './useStringGetter';

export const useCopyValue = ({ value, onCopy }: { value?: string; onCopy?: () => void }) => {
  const stringGetter = useStringGetter();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!value) return;

    setCopied(true);
    copyToClipboard(value);
    setTimeout(() => setCopied(false), MODERATE_DEBOUNCE_MS);
    onCopy?.();
  };

  const tooltipString = stringGetter({ key: copied ? STRING_KEYS.COPIED : STRING_KEYS.COPY });

  return {
    copied,
    copy,
    tooltipString,
  };
};
