import React, { useEffect, useRef } from 'react';
import { TextField } from '@mui/material';
import { Maskito } from '@maskito/core';

const digitsOnlyMask = {
  mask: [
    '+',
    '3',
    '8',
    '3',
    ' ',
    '(',
    /\d/,
    /\d/,
    ')',
    ' ',
    /\d/,
    /\d/,
    /\d/,
    '-',
    /\d/,
    /\d/,
    /\d/,
  ],
};
export default function PhoneNumberInput({
  value,
  onChange,
  onBlur,
  error,
  setFieldValue,
  helperText,
  ...props
}) {
  const elemRef = useRef(null);
  useEffect(() => {
    if (elemRef.current) {
      new Maskito(elemRef.current, digitsOnlyMask);
      elemRef.current.oninput = (event) => {
        if (setFieldValue) {
          setFieldValue(props.name, event.currentTarget.value);
        }
      };
    }
  }, [setFieldValue]);

  return (
    <TextField
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      inputRef={elemRef}
      error={error}
      helperText={helperText}
      {...props}
    />
  );
}
