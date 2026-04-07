import { Box, Card } from '@mui/material';
import React from 'react';
import UserLogs from '../administration/user/account/user-logs';
import { useAuthContext } from 'src/auth/hooks';

export default function UserLogsProfile() {
  const { user } = useAuthContext();

  return (
    <Box sx={{ marginX: '6%' }}>
      <Card>
        <UserLogs userId={user.id} />
      </Card>
    </Box>
  );
}
