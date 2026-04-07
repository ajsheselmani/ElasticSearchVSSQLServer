import React, { useState } from 'react';
import Profile from './profile/Profile';
import ChangePassword from './changePassword/changePassword';
import { Tabs, Tab, SvgIcon } from '@mui/material';
import { Route, Routes, useNavigate } from 'react-router';
import { settingIcons } from 'src/components/settings/drawer/icons';
import { useTranslation } from 'react-i18next';
import TwoFA from './TwoFA/TwoFA';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { Iconify } from 'src/components/iconify';
import UserLogsProfile from './user-logs-profile';

export default function Index() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(() => {
    const path = location.pathname.split('/').pop();
    if (['profile', 'password', 'twoFA', 'logs'].includes(path)) {
      return path;
    }
    return 'profile';
  });

  const onChange = (event, newValue) => {
    setTabValue(newValue);
    navigate(newValue);
  };

  return (
    <>
      <div className=" mx-[6%]">
        <CustomBreadcrumbs
          heading={t('profile')}
          links={[{ name: t('homepage'), href: paths.dashboard.root }, { name: t('profile') }]}
          sx={{ mb: { xs: 1, md: 1 } }}
        />
        <div className=" overflow-hidden my-[2%] flex flex-col">
          <Tabs value={tabValue} onChange={onChange}>
            <Tab
              icon={<SvgIcon>{settingIcons.profile}</SvgIcon>}
              label={t('profile')}
              value="profile"
            />
            <Tab
              icon={<SvgIcon>{settingIcons.password}</SvgIcon>}
              label={t('password')}
              value="password"
            />
            <Tab
              icon={<SvgIcon>{settingIcons.usersheid}</SvgIcon>}
              label={t('twoFA')}
              value="twoFA"
            />
            <Tab icon={<Iconify icon="ion:finger-print" />} label="Gjurmët" value="logs" />
          </Tabs>
        </div>
      </div>

      <Routes>
        <Route path="/profile" element={<Profile />} />
        <Route path="/twoFA" element={<TwoFA />} />
        <Route path="/password" element={<ChangePassword />} />
        <Route path="/logs" element={<UserLogsProfile />} />
      </Routes>
    </>
  );
}
