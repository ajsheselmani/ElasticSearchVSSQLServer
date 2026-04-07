import { useState } from "react";
// import NotificationService from '../../services/notificationService';

export function useNotifications() {
  const [notifications] = useState([]);

  // const addNotification = useCallback((notification) => {
  //   const now = Date.now();
  //   const key = `${notification.type}-${notification.message}`;
  //   const lastSeen = recentMessages.current[key];

  //   if (!lastSeen || now - lastSeen > 5000) {
  //     recentMessages.current[key] = now;
  //     setNotifications((prev) => [notification, ...prev]);
  //   }

  //   setTimeout(() => {
  //     setNotifications((prevNotifications) =>
  //       prevNotifications.filter((n) => n !== notification),
  //     );
  //   }, 5000);
  // }, []);

  // useEffect(() => {
  //   NotificationService.start();

  //   const handleMessage = (notification) => {
  //     addNotification(notification);
  //   };

  //   NotificationService.connection.on("ReceiveNotification", handleMessage);

  //   return () => {
  //     NotificationService.connection.off("ReceiveNotification", handleMessage);
  //   };
  // }, [addNotification]);

  return notifications;
}
