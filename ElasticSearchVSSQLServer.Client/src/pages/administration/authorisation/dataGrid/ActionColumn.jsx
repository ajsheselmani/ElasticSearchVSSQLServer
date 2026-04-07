import { Icon } from '@iconify/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import DropDown from 'src/components/general/DropDown';

export default function ActionColumn({ row }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <DropDown
      items={[
        {
          text: t('edit'),
          icon: <Icon icon="solar:pen-2-bold" width="24" height="24" />,
          onClick: () => {
            navigate(`${row.moduleId}`, { state: { background: location } });
          },
        },
        {
                text: t('moduleOperation'),
          icon: <Icon icon="nimbus:list" width="24" height="24" />,
          onClick: () => {
            navigate(`operation/${row.moduleId}`);
          },
        },
      ]}
        text={t('actions')}
    />
  );
}
