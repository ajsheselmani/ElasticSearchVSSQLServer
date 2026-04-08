import { useState } from "react";

export function useNotifications() {
  const [notifications] = useState([]);

  return notifications;
}
