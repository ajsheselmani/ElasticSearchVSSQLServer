import { saveAs } from 'file-saver';

const JSONExport = (data, fileName) => {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  saveAs(blob, `${fileName}.json`);
};

export default JSONExport;
