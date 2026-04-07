import { Icon } from "@iconify/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import DropDown from "src/components/general/DropDown";
import { Iconify } from "src/components/iconify";

export default function ActionColumn({ row }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const now = new Date();
  const lockoutEndDate = row.lockoutEnd ? new Date(row.lockoutEnd) : null;
  const isLocked = lockoutEndDate && lockoutEndDate > now;
  return (
    <DropDown
      items={[
        {
          text: t("Account"),
          icon: <Icon icon="solar:pen-2-bold" width="24" height="24" />,
          onClick: () => {
            navigate(`${row.id}/account`);
          },
        },
        {
          text: isLocked ? t("unlocked") : t("locked"),
          icon: isLocked ? (
            <Iconify
              icon="fluent-mdl2:unlock-solid"
              width={24}
              height={24}
              style={{ color: "#B71D18" }}
            />
          ) : (
            <Iconify
              icon="subway:lock-1"
              width={24}
              height={24}
              style={{ color: "#118D57" }}
            />
          ),
          onClick: () => {
            navigate(`setLockState/${row.id}/${isLocked ? "unlock" : "lock"}`);
          },
        },
      ]}
      text={t("actions")}
    />
  );
}
