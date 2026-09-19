import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { format } from 'date-fns';
import { Bell, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function Notifications() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications,
  } = useAuth();
  const [clearing, setClearing] = useState(false);

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    if (!confirm('Clear all notifications? This cannot be undone.')) return;
    setClearing(true);
    try {
      await clearAllNotifications();
    } finally {
      setClearing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-gray-400 text-sm mt-1">
            {notifications.filter((n) => !n.read).length} unread · {notifications.length} total
          </p>
        </div>
        <div className="flex gap-2">
          {notifications.some((n) => !n.read) && (
            <Button variant="ghost" size="sm" onClick={markAllNotificationsRead}>
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll} loading={clearing}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="text-center py-12">
          <Bell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No notifications yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`transition-colors ${!n.read ? 'border-blue-500/30 bg-blue-600/5' : ''}`}
              onClick={() => markNotificationRead(n.id)}
            >
              <div className="flex gap-3 items-start">
                {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />}
                <div className={`flex-1 min-w-0 ${!n.read ? '' : 'pl-5'}`}>
                  <p className="font-medium text-white text-sm">{n.title}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {format(new Date(n.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, n.id)}
                  className="shrink-0 p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  aria-label="Delete notification"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
