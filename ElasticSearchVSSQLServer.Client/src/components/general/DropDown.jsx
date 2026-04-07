import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { isValidElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@mui/material';

export default function DropDown(props) {
  const [anchorEl, setAnchorEl] = useState(null);
  const { t } = useTranslation();

  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Button
        id="basic-button"
        size="xs"
        type="button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        variant="outlined"
      >
        {props.text ?? t('actions')}
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        className="cursor-pointer"
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {props.items &&
          props.items.length > 0 &&
          props.items?.map((x) => {
            if (isValidElement(x.text)) {
              return <span onClick={() => handleClose()}>{x.text}</span>;
            } else
              return (
                <MenuItem
                  className="cursor-pointer"
                  style={{ minWidth: '150px' }}
                  onClick={() => {
                    handleClose();
                    x.onClick();
                  }}
                >
                  {x.icon} &nbsp; {x.text}
                </MenuItem>
              );
          })}
      </Menu>
    </div>
  );
}
