import { useNavigate } from 'react-router';
import UserNewEditForm from './user-new-edit-form';
import React from 'react';
import { Dialog, DialogContent, DialogTitle, Divider, IconButton } from '@mui/material';
import { GridCloseIcon } from '@mui/x-data-grid';

export default function UserRegisterForm() {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(true);

  const handleClose = () => {
    setOpen(false);
    navigate(-1);
  };

  return (
    <Dialog fullWidth="true" maxWidth="lg" open={open} onClose={handleClose}>
      <DialogTitle>Regjistrimi përdoruesit të ri</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={(theme) => ({
          position: 'absolute',
          right: 16,
          top: 16,
          color: theme.palette.grey[500],
        })}
      >
        <GridCloseIcon />
      </IconButton>
      <Divider />
      <DialogContent className="my-4">
        <UserNewEditForm />
      </DialogContent>
    </Dialog>
  );
}
