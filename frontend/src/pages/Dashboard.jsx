import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getDishes, toggleDish } from '../api/dishApi';
import DishCard from '../components/DishCard';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const Dashboard = () => {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const socketRef = useRef(null);
  const isInitialConnectRef = useRef(true);

  const loadData = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }
      setError(null);
      const data = await getDishes();
      setDishes(data);
    } catch (err) {
      if (showSpinner) {
        setError(err.message || 'Failed to fetch dishes.');
      } else {
        console.error('Failed to sync dishes after socket reconnect:', err);
      }
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Socket connection and listener management
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket.IO connection established. ID:', socket.id);
      setIsConnected(true);
      setIsReconnecting(false);
      
      if (isInitialConnectRef.current) {
        isInitialConnectRef.current = false;
      } else {
        console.log('Socket reconnected. Fetching latest database state...');
        loadData(false); // recover state silently without spinner
      }
    });

    socket.on('disconnect', (reason) => {
      console.warn('Socket.IO connection lost. Reason:', reason);
      setIsConnected(false);
      setIsReconnecting(true);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err);
      setIsConnected(false);
      setIsReconnecting(true);
    });

    // Real-time listener for database modifications via Mongoose Change Streams
    socket.on('dish_update', (payload) => {
      console.log('Real-time dish update received:', payload);
      const { action, data, id } = payload;

      setDishes((prevDishes) => {
        if (action === 'insert') {
          // Check if it already exists
          if (prevDishes.some((item) => item.dishId === data.dishId)) {
            return prevDishes;
          }
          return [...prevDishes, data].sort((a, b) => a.dishId.localeCompare(b.dishId));
        }

        if (action === 'update' || action === 'replace') {
          return prevDishes.map((item) =>
            item.dishId === data.dishId ? data : item
          );
        }

        if (action === 'delete') {
          const stringId = id ? id.toString() : '';
          return prevDishes.filter((item) => item._id?.toString() !== stringId);
        }

        return prevDishes;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Optimistic UI updates
  const handleTogglePublish = async (dishId) => {
    const original = dishes.find((d) => d.dishId === dishId);
    if (!original) return;

    const previousState = original.isPublished;

    // 1. Apply UI changes immediately
    setDishes((prev) =>
      prev.map((d) => (d.dishId === dishId ? { ...d, isPublished: !previousState } : d))
    );

    // 2. Perform background API call
    try {
      const serverUpdated = await toggleDish(dishId);

      // 3. Keep the latest server state in sync
      setDishes((prev) =>
        prev.map((d) => (d.dishId === dishId ? serverUpdated : d))
      );
    } catch (err) {
      console.error(`Error toggling dish:`, err);

      // 4. Revert UI on failure
      setDishes((prev) =>
        prev.map((d) => (d.dishId === dishId ? { ...d, isPublished: previousState } : d))
      );

      alert(`Could not update "${original.dishName}". Reverted status.`);
    }
  };

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading fresh dishes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2 className="error-title">Failed to Load Dashboard</h2>
        <p className="error-message">{error}</p>
        <button onClick={loadData} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Dashboard Top Header */}
      <header className="header">
        <div className="logo-section">
          <h1>Kitchen Dashboard</h1>
          <p>Real-time menu and publishing control center</p>
        </div>

        {/* Real-time Socket Connection Status */}
        <div className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="dot"></span>
          <span>{isConnected ? 'Realtime Connected' : 'Connecting...'}</span>
        </div>
      </header>

      {/* Grid of dishes */}
      {dishes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          No dishes available. Run the seeding script to populate the database.
        </div>
      ) : (
        <div className="grid">
          {dishes.map((dish) => (
            <DishCard
              key={dish.dishId}
              dish={dish}
              onToggle={handleTogglePublish}
            />
          ))}
        </div>
      )}

      {/* Reconnection status banner */}
      {isReconnecting && (
        <div className="notification-banner reconnecting">
          <span>⚠️ Connection interrupted. Reconnecting for real-time sync...</span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
