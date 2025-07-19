import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState({});
  const [view, setView] = useState('products');

  // Инициализация Telegram WebApp
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      
      tg.MainButton.setText("Корзина");
      tg.MainButton.onClick(() => setView('cart'));
      tg.MainButton.show();
    }

    return () => {
      if (tg) {
        tg.MainButton.offClick();
        tg.MainButton.hide();
      }
    };
  }, []);

  // Загрузка товаров через безопасный прокси
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          'https://telegram-shop-proxy.vercel.app/api/products?sheetId=1_Z3ZpyJcLDnjx6aUaRuD6w-b0iBgtOuDCXfU_wYCRh8&sheetName=Магазин%20май%202023'
        );
        setProducts(response.data);
      } catch (err) {
        setError('Ошибка загрузки товаров. Попробуйте позже.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Обновление кнопки корзины
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);
      tg.MainButton.setText(itemCount ? `Корзина (${itemCount})` : "Корзина");
    }
  }, [cart]);

  const addToCart = (id) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id) => {
    if (!cart[id]) return;
    
    if (cart[id] === 1) {
      const newCart = { ...cart };
      delete newCart[id];
      setCart(newCart);
    } else {
      setCart(prev => ({ ...prev, [id]: prev[id] - 1 }));
    }
  };

  const checkout = () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.sendData(JSON.stringify({
        cart,
        total: Object.entries(cart).reduce((sum, [id, qty]) => {
          const product = products.find(p => p.id === id);
          return sum + (product.price * qty);
        }, 0)
      }));
    } else {
      alert('Тестовый режим: Заказ оформлен!');
    }
  };

  if (loading) return <div className="loading">Загрузка товаров...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="app">
      {view === 'products' ? (
        <>
          <h1>🏀 Магазин Барсы</h1>
          <div className="products">
            {products.map(product => (
              <div key={product.id} className="product-card">
                {product.image && (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="product-image"
                  />
                )}
                <h3>{product.name}</h3>
                <p>Цена: {product.price} ₸</p>
                <div className="cart-controls">
                  <button 
                    onClick={() => removeFromCart(product.id)}
                    disabled={!cart[product.id]}
                  >
                    -
                  </button>
                  <span>{cart[product.id] || 0}</span>
                  <button onClick={() => addToCart(product.id)}>+</button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="cart-view">
          <h2>🛒 Ваша корзина</h2>
          {Object.keys(cart).length === 0 ? (
            <p>Корзина пуста</p>
          ) : (
            <>
              {Object.entries(cart).map(([id, quantity]) => {
                const product = products.find(p => p.id === id);
                return product ? (
                  <div key={id} className="cart-item">
                    <h4>{product.name}</h4>
                    <p>
                      {quantity} × {product.price} ₸ = {quantity * product.price} ₸
                      <button 
                        className="remove-btn"
                        onClick={() => removeFromCart(id)}
                      >
                        ❌
                      </button>
                    </p>
                  </div>
                ) : null;
              })}
              <div className="cart-total">
                <strong>Итого: {
                  Object.entries(cart).reduce((sum, [id, qty]) => {
                    const product = products.find(p => p.id === id);
                    return sum + (product ? product.price * qty : 0);
                  }, 0)
                } ₸</strong>
              </div>
              <button 
                className="checkout-btn"
                onClick={checkout}
              >
                ✅ Оформить заказ
              </button>
            </>
          )}
          <button 
            className="back-btn"
            onClick={() => setView('products')}
          >
            ← Вернуться к товарам
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
