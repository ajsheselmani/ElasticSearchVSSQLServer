import {
  Box,
  CircularProgress,
  Fade,
  IconButton,
  LinearProgress,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Iconify } from 'src/components/iconify';
import axiosInstance from 'src/lib/axios';

const QueueWork = () => {
  const { reportQueue } = useSelector((store) => store.theme);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reportQueue.some((x) => x.progress < 100)) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [reportQueue]);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const downloadReport = async (reportId) => {
    try {
      const response = await axiosInstance.get('/Administration/User/DownloadUserActionReport', {
        params: { reportId: reportId },
        responseType: 'blob',
      });
      if (!response.status === 200) {
        throw new Error('File not found');
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement('a');
      link.href = url;
      link.download = 'UserActionReport.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (reportQueue.length == 0) return <></>;

  return (
    <div>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <IconButton
          id="fade-button"
          aria-controls={open ? 'fade-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
        >
          <Iconify icon="octicon:gear-24" />
        </IconButton>
        {loading && (
          <CircularProgress
            size={36}
            sx={{
              position: 'absolute',
              top: '67%',
              left: '66%',
              marginTop: '-24px',
              marginLeft: '-24px',
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>
      <Menu
        id="fade-menu"
        slotProps={{
          list: {
            'aria-labelledby': 'fade-button',
          },
        }}
        slots={{ transition: Fade }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { minWidth: 280, maxHeight: 400 },
        }}
      >
        <div>
          <h4 className="mt-1 mx-1">Raporet e gjeneruara</h4>
          {reportQueue.toReversed().map((report, index) => (
            <MenuItem key={index} onClick={handleClose} sx={{ py: 1.5 }}>
              <Box sx={{ width: '100%' }}>
                <div className="flex gap-4 items-center">
                  <div>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="text.secondary">
                          {report.queueProcessName}
                        </Typography>
                      }
                      secondary={`${report.progress}%`}
                      secondaryTypographyProps={{ component: 'span' }}
                    />

                    <Box sx={{ mt: 0.5, mb: 0.5 }}>
                      <LinearProgress
                        variant="determinate"
                        anuma
                        value={report.progress}
                        color={report.progress === 100 ? 'success' : 'primary'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </div>
                  {report.progress == 100 && (
                    <Tooltip title="Shkarko">
                      <IconButton
                        disabled={report.progress != 100}
                        onClick={() => downloadReport(report.queueId)}
                      >
                        <Iconify icon="material-symbols:download" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {report.progress != 100 && <CircularProgress size={22} />}
                </div>
              </Box>
            </MenuItem>
          ))}
        </div>
      </Menu>
    </div>
  );
};

export default QueueWork;
