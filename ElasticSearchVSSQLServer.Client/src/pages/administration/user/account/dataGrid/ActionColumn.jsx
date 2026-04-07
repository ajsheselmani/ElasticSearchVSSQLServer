import { Icon } from '@iconify/react';
import { Button } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

export default function ActionColumn({ row }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <Button
      startIcon={<Icon icon="eva:search-fill" width="20" height="20" />}
      onClick={() => navigate(`${row.id}`, { state: { background: location } })}
    >
      {t('details')}
    </Button>
  );
}
