import React, { useState, useEffect, useCallback } from 'react';

const API_URL = '/api';

function App() {
  const [health, setHealth] = useState(null);
  const [items, setItems] = useState([]);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error('Health check failed:', err);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/items`);
      const data = await res.json();
      setItems(data.data || []);
      setSource(data.source || '');
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchItems();
    
    // Refresh health every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth, fetchItems]);

  const addItem = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      
      if (res.ok) {
        setName('');
        setDescription('');
        fetchItems();
      }
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  const deleteItem = async (id) => {
    try {
      const res = await fetch(`${API_URL}/items/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        fetchItems();
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🐳 Multi-Service App</h1>
        <p>Docker Optimized Microservices Architecture</p>
      </header>

      <section className="health-status">
        <h2>Service Health Status</h2>
        {health ? (
          <div className="services-grid">
            <div className="service-card">
              <div className={`service-indicator ${health.services?.postgres || 'disconnected'}`}></div>
              <div className="service-info">
                <h3>PostgreSQL</h3>
                <p>{health.services?.postgres || 'checking...'}</p>
              </div>
            </div>
            <div className="service-card">
              <div className={`service-indicator ${health.services?.redis || 'disconnected'}`}></div>
              <div className="service-info">
                <h3>Redis Cache</h3>
                <p>{health.services?.redis || 'checking...'}</p>
              </div>
            </div>
            <div className="service-card">
              <div className="service-indicator connected"></div>
              <div className="service-info">
                <h3>Backend API</h3>
                <p>connected</p>
              </div>
            </div>
            <div className="service-card">
              <div className="service-indicator connected"></div>
              <div className="service-info">
                <h3>Frontend</h3>
                <p>connected</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="loading">Checking services...</p>
        )}
      </section>

      <section className="items-section">
        <h2>
          Items Manager
          {source && <span className={`source-badge ${source}`}>From {source}</span>}
        </h2>
        
        <form className="add-form" onSubmit={addItem}>
          <input
            type="text"
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit">Add Item</button>
        </form>

        {loading ? (
          <p className="loading">Loading items...</p>
        ) : (
          <div className="items-list">
            {items.length === 0 ? (
              <p className="loading">No items yet. Add one above!</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="item-card">
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <p>{item.description || 'No description'}</p>
                  </div>
                  <button className="delete-btn" onClick={() => deleteItem(item.id)}>
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
