import { Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Iconify } from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

export default function RecoveryCodes({ recoveryCodes }) {
  const { t } = useTranslation();
  const settings = useSettingsContext();
  const isDarkMode = settings.state.colorScheme === 'dark';

  const downloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([recoveryCodes.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${t('recoveryCodes')}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <>
      <div
        className={`my-6 mx-[6%] p-6 border-l-4 rounded-xl s ${isDarkMode ? '' : '!bg-yellow-50 border-yellow-400'
          }`}
      >
        <h2 className="text-xl font-bold mb-4">{t('recoveryCodes')}</h2>
        <p className="flex items-center">
          <strong>{t('putTheseCodesInSafePlace')}</strong>
        </p>
        <p>{t('ifYouLoseYourDevice')}</p>
        <p>{t('generatingNewRecoveryCodes')}</p>

        <div className="m-3">
          <ul>
            {recoveryCodes.map((code, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="font-medium">{index + 1}.</span>
                <span>{code}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4">
          <Button
            onClick={downloadCode}
            variant="contained"
            startIcon={<Iconify icon="mingcute:download-2-line" />}
          >
            {t('download')}
          </Button>{' '}
        </div>
      </div>
    </>
  );
}
