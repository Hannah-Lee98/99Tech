import { useEffect, useState } from "react";

export const useDebounce = <T>(input: T, time?: number) => {
  const [value, setValue] = useState<T>();

  useEffect(() => {
    const fn = setTimeout(() => {
      setValue(input);
    }, time || 300);

    return () => {
      clearTimeout(fn);
    };
  }, [input, time]);

  return value;
};
