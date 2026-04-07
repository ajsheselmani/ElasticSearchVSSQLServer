import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, TextField, useTheme } from '@mui/material';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import axiosInstance from 'src/lib/axios';
import { GridCloseIcon } from '@mui/x-data-grid';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';

const capturedConsole = [];
const capturedNetwork = [];

function formatArgs(args) {
    if (args.length === 0) return "";

    return args.map(arg => {
        if (arg instanceof Error) {
            return arg.stack || arg.toString();
        }

        if (typeof arg === "string") {
            return arg;
        }

        try {
            return JSON.stringify(arg, null, 2);
        } catch {
            return String(arg);
        }
    }).join(" ");
}

["log", "warn", "error"].forEach(level => {
    const original = console[level];
    console[level] = (...args) => {
        const formatted = formatArgs(args);
        capturedConsole.push(`[${level.toUpperCase()}] ${formatted}`);
        original.apply(console, args);
    };
});

const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const url = args[0];
    try {
        const response = await originalFetch(...args);
        capturedNetwork.push(`FETCH: ${url} - ${response.status}`);
        return response;
    } catch (err) {
        capturedNetwork.push(`FETCH FAILED: ${url} - ${err}`);
        throw err;
    }
};

const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.addEventListener("loadend", function () {
        capturedNetwork.push(`XHR: ${method} ${url} - ${this.status}`);
    });
    return originalOpen.call(this, method, url, ...rest);
};

export function getCapturedConsole() {
    return capturedConsole.join("\n");
}

export function getCapturedNetwork() {
    return capturedNetwork.join("\n");
}


const ReportErrorDialog = ({ open, onClose, url, pdfFile }) => {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme();

    const initialValues = {
        Description: '',
    };

    const validationSchema = Yup.object().shape({
        Description: Yup.string().nullable(),
    });

    const buttonStyles = {
        width: '100px',
        p: 1,
        borderRadius: 1,
        boxShadow: 2,
        fontWeight: 500,
        textTransform: 'none',
    };
    const consoleLogs = getCapturedConsole();
    const networkLogs = getCapturedNetwork();

    return (
        <>
            <Formik
                initialValues={initialValues}
                enableReinitialize="true"
                validationSchema={validationSchema}
                onSubmit={async (values, { setSubmitting }) => {
                    try {
                        const formData = new FormData();
                        if (pdfFile) {
                            formData.append("Screenshot", pdfFile);
                        }
                        formData.append("Url", url);
                        formData.append("Description", values.Description || "");
                        formData.append("AdditionalInfo", `Console Logs:\n${consoleLogs}\n\nNetwork Logs:\n${networkLogs}`);

                        const response = await axiosInstance.post('/Administration/ReportingErrors', formData);
                        if (response.status === 200) {
                            enqueueSnackbar(t('dataSavedSuccessfully'), {
                                variant: 'success',
                            });
                            onClose();
                        } else {
                            var message = response?.response?.data?.title ?? t('errorOccurred');
                            enqueueSnackbar(message, {
                                variant: 'error',
                            });
                        }
                    } catch (err) {
                        enqueueSnackbar(err, {
                            variant: 'error',
                        });
                    } finally {
                        setSubmitting(false);
                    }
                }}
            >
                {({ errors, touched, handleChange, values, submitForm }) => (
                    <Dialog fullWidth="true" maxWidth="sm" open={open} onClose={onClose}>
                        <DialogTitle>
                            {t('reportError')}
                            <IconButton
                                aria-label="close"
                                onClick={onClose}
                                sx={{
                                    position: 'absolute',
                                    right: 8,
                                    top: 8,
                                    color: theme?.palette.grey[500],
                                }}
                            >
                                <GridCloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <Divider />
                        <DialogContent>
                            <div className='m-2'>
                                <Alert severity="warning">{t('reportErrorDescription')}</Alert>
                                <div className="mt-4">
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={3}
                                        maxRows={10}
                                        label={t('description')}
                                        name="Description"
                                        value={values.Description}
                                        onChange={handleChange}
                                        error={Boolean(touched.Description && errors.Description)}
                                        helperText={touched.Description && errors.Description}
                                    />
                                </div>
                            </div>
                        </DialogContent>
                        <Divider />
                        <DialogActions>
                            <div className="flex justify-between w-full">
                                <Button variant="outlined" color="warning" onClick={onClose} sx={buttonStyles}>
                                    {t('close')}
                                </Button>
                                <Button variant="contained" color="primary" onClick={submitForm} sx={buttonStyles}>
                                    {t('save')}
                                </Button>
                            </div>
                        </DialogActions>
                    </Dialog>
                )}
            </Formik>
        </>
    )
}
export default ReportErrorDialog;