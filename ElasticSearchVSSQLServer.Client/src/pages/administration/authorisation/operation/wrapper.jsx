import React, { lazy } from 'react';

const ModuleOperationMenuPage = lazy(
  () => import('src/pages/administration/authorisation/operation/menu/menuIndex')
);

const ModuleOperationApiPage = lazy(
  () => import('src/pages/administration/authorisation/operation/api/apiIndex')
);

export default function Wrapper() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4">
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4"
        style={{ height: 'fit-content' }}
      >
        <ModuleOperationMenuPage />
      </div>
      <div className="lg:col-span-2">
        <ModuleOperationApiPage />
      </div>
    </div>
  );
}
