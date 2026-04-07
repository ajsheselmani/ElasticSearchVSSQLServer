import React, { useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { useField } from 'formik';
import { Iconify } from 'src/components/iconify';

const PasswordInput = ({ label, ...props }) => {
  const [field, meta] = useField(props);
  const [showPassword, setShowPassword] = useState(false);

  const handleToggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <TextField
      {...field}
      {...props}
      type={showPassword ? 'text' : 'password'}
      label={label}
      error={meta.touched && Boolean(meta.error)}
      helperText={meta.touched && meta.error}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={handleToggleVisibility} edge="end">
             <Iconify
                 icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
             />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};

export default PasswordInput;
