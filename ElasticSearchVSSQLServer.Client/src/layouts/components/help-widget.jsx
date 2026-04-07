import * as React from 'react';
import { useSnackbar } from 'notistack';
import { useAuthContext } from 'src/auth/hooks';
import { useTranslation } from 'react-i18next';
import {
  Box, SpeedDial, SpeedDialAction, SpeedDialIcon,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, Typography, Alert, Collapse
} from '@mui/material';
import Zoom from '@mui/material/Zoom';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import axiosInstance from 'src/lib/axios';

function useToggle(initial = false) {
  const [open, setOpen] = React.useState(initial);
  return {
    open,
    on: React.useCallback(() => setOpen(true), []),
    off: React.useCallback(() => setOpen(false), []),
  };
}

const richTooltip = (heading, caption) => ({
  tooltip: {
    title: (
      <Stack spacing={0.25}>
        <Typography variant="subtitle2">{heading}</Typography>
        {caption ? <Typography variant="caption" sx={{ opacity: 0.72 }}>{caption}</Typography> : null}
      </Stack>
    ),
    arrow: true,
    placement: 'left',
    enterDelay: 120,
    TransitionComponent: Zoom,
    slotProps: {
      tooltip: {
        sx: (theme) => ({
          bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'common.white',
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.customShadows?.z8 || theme.shadows[8],
          px: 1.25, py: 0.75, borderRadius: 1.25,
        }),
      },
      arrow: {
        sx: (theme) => ({
          color: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.common.white,
        }),
      },
    },
  },
});

export default function HelpWidget({ offset }) {
  const { t } = useTranslation(); 
  const ask = useToggle(false);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext() || {};

  const [question, setQuestion] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [apiError, setApiError] = React.useState(null);

  const limits = { question: 256, name: 60, email: 100 };
  const q = question.trim();
  const isValidQuestion = q.length > 0 && q.length <= limits.question;

  React.useEffect(() => {
    setApiError(null);
  }, [q, ask.open]);

  const extractErrorMessage = (err) => {
    const res = err?.response;
    if (!res) return err?.message || t('FAQsSnackbarDefaultError');

    const { status, data } = res;
    if (data?.errors && typeof data.errors === 'object') {
      const msgs = [];
      for (const v of Object.values(data.errors)) {
        if (Array.isArray(v)) {
          for (const m of v) if (m) msgs.push(String(m));
        } else if (v != null) {
          msgs.push(String(v));
        }
      }
      if (msgs.length) return msgs.join(' ');
    }

    const serverMsg =
      data?.message || data?.error || data?.title || (typeof data === 'string' ? data : null);

    if (status === 404) {
      return `404 Not Found. Check endpoint '/Administration/FAQQuestion'.`;
    }
    if (serverMsg) return serverMsg;
    return `HTTP ${status}`;
  };

  const handleSubmit = React.useCallback(async () => {
    if (submitting || !isValidQuestion) return;

    const first = user?.firstname || '';
    const last = user?.lastname || '';
    const email = user?.email || '';
    const token = user?.accessToken || '';

    if (!first || !last || !email) {
      setApiError(t('FAQsSnackbarMissingIdentity'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        faqcategoryId: null,
        answer: null,
        position: null,
        userName: String(first).slice(0, limits.name),
        userSurname: String(last).slice(0, limits.name),
        email: String(email).slice(0, limits.email),
        question: q,
        visible: true,
      };

      await axiosInstance.post('/Administration/FAQQuestion', payload, {
        withCredentials: true,
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      });

      enqueueSnackbar(t('FAQsSnackbarSuccess'), { variant: 'success', autoHideDuration: 3000 });
      setQuestion('');
      ask.off();
    } catch (err) {
      setApiError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [submitting, isValidQuestion, q, user, enqueueSnackbar, ask, t]);

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <Box
        sx={(theme) => ({
          position: 'fixed',
          zIndex: theme.zIndex.drawer + 2,
          right: { xs: offset?.right ?? 16, sm: offset?.right ?? 24 },
          bottom: { xs: offset?.bottom ?? 16, sm: offset?.bottom ?? 24 },
          pointerEvents: 'none',
        })}
      >
        <Box sx={{ pointerEvents: 'auto' }}>
          <SpeedDial
            ariaLabel={t('FAQsAriaHelp')}
            icon={<SpeedDialIcon openIcon={<HelpOutlineIcon />} />}
            direction="up"
            slotProps={{
              fab: { color: 'primary', sx: { boxShadow: 6, '&:hover': { boxShadow: 10 } } },
            }}
          >
            <SpeedDialAction
              key="ask"
              icon={<QuestionAnswerIcon />}
              onClick={ask.on}
              slotProps={{ ...richTooltip(t('FAQsAskTooltipTitle'), t('FAQsAskTooltipCaption')) }}
            />
          </SpeedDial>
        </Box>
      </Box>

      <Dialog
        open={ask.open}
        onClose={submitting ? undefined : ask.off}
        maxWidth="sm"
        fullWidth
        aria-labelledby="help-widget-title"
        PaperProps={{ sx: { p: 1 } }}
      >
        <DialogTitle id="help-widget-title">{t('FAQsDialogTitle')}</DialogTitle>
        <DialogContent dividers>
          <Collapse in={Boolean(apiError)}>
            <Alert
              severity="error"
              onClose={() => setApiError(null)}
              sx={{ mb: 2 }}
            >
              {t('FAQsSnackbarError', { msg: apiError || t('FAQsSnackbarDefaultError') })}
            </Alert>
          </Collapse>

          <Stack spacing={2} sx={{ mt: 1 }} onKeyDown={onKeyDown}>
            <TextField
              label={t('FAQsQuestionLabel')}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              fullWidth
              required
              multiline
              minRows={4}
              inputProps={{ maxLength: limits.question }}
              helperText={t('FAQsQuestionHelper', { count: q.length, max: limits.question })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={ask.off} disabled={submitting}>
            {t('FAQsCancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isValidQuestion || submitting}
          >
            {submitting ? t('FAQsSending') : t('FAQsSend')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
