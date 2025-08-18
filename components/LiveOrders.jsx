"use client"

import React, { useState, useEffect } from 'react';
import { ChefHat, ShoppingCart, Bell, User, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const LiveOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [processingPayment, setProcessingPayment] = useState({});
  const [processingOrder, setProcessingOrder] = useState({});

  // Helper function to safely parse the iteminfo
  const parseItemInfo = (iteminfo) => {
    try {
      // First parse to get the JSON string
      const firstParse = iteminfo;
      // If it's still a string, parse again
      if (typeof firstParse === 'string') {
        return JSON.parse(firstParse);
      }
      // If it's already an array/object, return as is
      return firstParse;
    } catch (error) {
      console.error('Error parsing iteminfo:', error);
      return []; // Return empty array as fallback
    }
  };

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch orders and setup real-time subscription
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        const parsedOrders = data.map(order => ({
          id: order.id,
          created_at: order.created_at,
          payment_done: order.payment_done || false,
          order_done: order.order_done || false,
          tableno: order.tableno,
          items: parseItemInfo(order.iteminfo)
        }));

        setOrders(parsedOrders || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };   
    
    fetchOrders();

    // Setup real-time subscription
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          const parseOrder = (order) => ({
            id: order.id,
            created_at: order.created_at,
            payment_done: order.payment_done || false,
            order_done: order.order_done || false,
            tableno: order.tableno,
            items: parseItemInfo(order.iteminfo)
          });

          if (payload.eventType === 'INSERT') {
            setOrders(prev => [...prev, parseOrder(payload.new)]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev =>
              prev.map(order =>
                order.id === payload.new.id ? parseOrder(payload.new) : order
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(order => order.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handlers with loading states
  const handlePaymentDone = async (orderId) => {
    setProcessingPayment(prev => ({ ...prev, [orderId]: true }));
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_done: true })
        .eq('id', orderId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating payment status:', error);
    } finally {
      setProcessingPayment(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleOrderDone = async (orderId) => {
    setProcessingOrder(prev => ({ ...prev, [orderId]: true }));
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_done: true })
        .eq('id', orderId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setProcessingOrder(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const ordersWithTotals = orders.map(order => ({
    ...order,
    total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }));

  // Only show active orders
  const activeOrders = ordersWithTotals.filter(
    order => !(order.payment_done && order.order_done)
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '12px 16px' : '16px 24px',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: isMobile ? '12px' : '0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ChefHat style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <h1 style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: 'bold',
                color: '#f97316',
                margin: 0
              }}>
                RestaurantHub - Live Orders
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
            <div style={{ position: 'relative', display: isMobile ? 'none' : 'block' }}>
          
             
            </div>
            <button style={{
              position: 'relative',
              padding: '8px',
              color: '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px'
            }}>
              <Bell style={{ width: '24px', height: '24px' }} />
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '20px',
                height: '20px',
                backgroundColor: '#ef4444',
                color: 'white',
                fontSize: '12px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {activeOrders.length}
              </span>
            </button>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}>
              <User style={{ width: '24px', height: '24px', color: '#6b7280' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        padding: isMobile ? '16px' : '24px'
      }}>
        <div style={{ padding: '0' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '30px'
          }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: 0
            }}>Live Orders</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: '#10b981', 
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></div>
                <span>{activeOrders.length} Active Orders</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '256px' 
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid #f3f4f6',
                borderTop: '4px solid #f97316',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '24px'
            }}>
              {activeOrders.length > 0 ? (
                activeOrders.map(order => (
                  <div key={order.id} style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      padding: isMobile ? '16px' : '20px',
                      color: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                        <h3 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '600', margin: 0 }}>Order #{order.id}</h3>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '14px', margin: '0 0 4px 0' }}>Table {order.tableno}</p>
                          <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>
                            {new Date(order.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: isMobile ? '16px' : '24px' }}>
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ fontWeight: '500', color: '#374151', marginBottom: '12px' }}>Items Ordered:</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {order.items.map((item, index) => (
                            <div key={index} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: isMobile ? 'flex-start' : 'center',
                              padding: '8px 0',
                              borderBottom: index < order.items.length - 1 ? '1px solid #f3f4f6' : 'none',
                              flexDirection: isMobile ? 'column' : 'row',
                              gap: isMobile ? '4px' : '0'
                            }}>
                              <div>
                                <p style={{ fontWeight: '500', color: '#111827', margin: '0 0 4px 0' }}>
                                  {item.quantity}x {item.name}
                                </p>
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                                  {item.category}
                                </p>
                              </div>
                              <p style={{ fontWeight: '600', color: '#111827', margin: 0 }}>
                                ₹{item.price * item.quantity}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{
                        marginBottom: '20px',
                        padding: '16px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', color: '#374151' }}>Total Amount:</span>
                          <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold', color: '#f97316' }}>
                            ₹{order.total}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          onClick={order.payment_done ? undefined : () => handlePaymentDone(order.id)}
                          disabled={order.payment_done || processingPayment[order.id]}
                          style={{
                            width: '100%',
                            backgroundColor: order.payment_done ? '#6b7280' : '#10b981',
                            color: 'white',
                            padding: '12px 16px',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '500',
                            cursor: order.payment_done ? 'default' : (processingPayment[order.id] ? 'wait' : 'pointer'),
                            transition: 'background-color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            opacity: order.payment_done ? 0.7 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!order.payment_done && !processingPayment[order.id]) {
                              e.target.style.backgroundColor = '#059669';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!order.payment_done) {
                              e.target.style.backgroundColor = '#10b981';
                            }
                          }}
                        >
                          {processingPayment[order.id] && (
                            <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                          )}
                          {order.payment_done ? 'Payment Completed ✓' : 
                           processingPayment[order.id] ? 'Processing...' : 'Mark Payment Done'}
                        </button>

                        <button
                          onClick={order.order_done ? undefined : () => handleOrderDone(order.id)}
                          disabled={order.order_done || processingOrder[order.id]}
                          style={{
                            width: '100%',
                            backgroundColor: order.order_done ? '#6b7280' : '#3b82f6',
                            color: 'white',
                            padding: '12px 16px',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '500',
                            cursor: order.order_done ? 'default' : (processingOrder[order.id] ? 'wait' : 'pointer'),
                            transition: 'background-color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            opacity: order.order_done ? 0.7 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!order.order_done && !processingOrder[order.id]) {
                              e.target.style.backgroundColor = '#2563eb';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!order.order_done) {
                              e.target.style.backgroundColor = '#3b82f6';
                            }
                          }}
                        >
                          {processingOrder[order.id] && (
                            <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                          )}
                          {order.order_done ? 'Order Completed ✓' : 
                           processingOrder[order.id] ? 'Processing...' : 'Mark Order Complete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '64px 0'
                }}>
                  <ShoppingCart style={{ 
                    width: '64px', 
                    height: '64px', 
                    color: '#d1d5db', 
                    margin: '0 auto 16px auto' 
                  }} />
                  <p style={{ color: '#6b7280', fontSize: '18px', margin: '0 0 8px 0' }}>
                    No active orders at the moment
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                    New orders will appear here automatically
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LiveOrders;