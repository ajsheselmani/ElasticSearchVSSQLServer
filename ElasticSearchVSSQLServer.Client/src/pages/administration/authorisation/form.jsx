import { TextField } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Form({ errors, touched, handleChange, handleBlur, values, hasAccess }) {
  const { t } = useTranslation();
  return (
    <div className="my-4 grid grid-cols-1 gap-4 ">
      {hasAccess('nameSq') && (
        <TextField
          label={t('nameSq')}
          required="true"
          variant="outlined"
          name="nameSq"
          fullWidth
          value={values.nameSq}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.nameSq && Boolean(errors.nameSq)}
          helperText={touched.nameSq && errors.nameSq}
        />
      )}{' '}
      {hasAccess('nameEn') && (
        <TextField
          label={t('nameEn')}
          variant="outlined"
          name="nameEn"
          fullWidth
          required="true"
          value={values.nameEn}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.nameEn && Boolean(errors.nameEn)}
          helperText={touched.nameEn && errors.nameEn}
        />
      )}{' '}
      {hasAccess('nameSr') && (
        <TextField
          label={t('nameSr')}
          variant="outlined"
          name="nameSr"
          required="true"
          fullWidth
          value={values.nameSr}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.nameSr && Boolean(errors.nameSr)}
          helperText={touched.nameSr && errors.nameSr}
        />
      )}
    </div>
  );
}
