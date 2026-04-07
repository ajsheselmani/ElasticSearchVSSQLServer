import { sq } from './sq';
import { sr } from './sr';

export const getDataGridLocale = (lang) => {
  switch (lang) {
    case 'sq':
      return sq;
    case 'sr':
      return sr;
    case 'en':
      return undefined;
    default:
      return 'sq';
  }
};
