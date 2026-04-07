import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { useTranslation } from 'react-i18next';

// ----------------------------------------------------------------------

export function SignUpTerms({ sx, ...other }) {
  const { t } = useTranslation();
  return (
    <Box
      component="span"
      sx={[
        () => ({
          mt: 3,
          display: 'block',
          textAlign: 'center',
          typography: 'caption',
          color: 'text.secondary',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {t('bySigningIAgree')}{' '}
      <Link underline="always" color="text.primary">
        {t('termOfService')}{' '}
      </Link>
      {t('and')}{' '}
      <Link underline="always" color="text.primary">
        {t('privacyPolicy')}
      </Link>
      .
    </Box>
  );
}
