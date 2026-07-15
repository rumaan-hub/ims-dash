"use client";

import { useState } from 'react';
import './page.css'; // Link to the CSS file

export default function Dentistry99Page() {
  // --- STATE ---
  const [sidebarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isRejected, setIsRejected] = useState(false); // New state for rejection
  const [comment, setComment] = useState("");
  const [saveFuture, setSaveFuture] = useState(false);
  
  // Card Input State
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  // Initial Mock Orders
  const [orders, setOrders] = useState([
    { id: 'ORD-2025-1001', items: 3, total: 83, status: 'DELIVERED' }
  ]);

  // --- HANDLERS ---
  const handlePay = () => {
    const btn = document.getElementById('payButton') as HTMLButtonElement;
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Processing...';
    }

    setIsProcessing(true);

    // Simulate Payment API Call
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
      
      if (btn) {
        btn.innerText = 'Paid Successfully';
        btn.style.backgroundColor = '#10b981'; // Green
      }

      // Add new order to list
      const newOrder = {
        id: `ORD-2025-${Math.floor(Math.random() * 10000)}`,
        items: 3,
        total: 83,
        status: 'PROCESSING'
      };
      setOrders([newOrder, ...orders]);

      let msg = "Payment Successful!\n\nOrder Placed: $83\nProducts added to your inventory.";
      if (saveFuture) msg += "\n\nCard details saved for quick reorder!";
      alert(msg);
    }, 2000);
  };

  const handleReject = () => {
    if (confirm("Are you sure you want to reject this proposal?")) {
      // 1. Mark as rejected so proposal card hides
      setIsRejected(true);
      
      // 2. Clears comment (specific to this proposal)
      setComment("");

      // 3. Check "Save for future" setting
      if (saveFuture) {
        // If checked, DO NOT clear card inputs (Data saved)
        alert("Proposal rejected.\nHowever, your card details are saved for future use.");
      } else {
        // If unchecked, CLEAR card inputs
        setCardNumber("");
        setExpiry("");
        setCvc("");
        alert("Proposal rejected.\nDetails cleared.");
      }
    }
  };

  // Format Card Number (add spaces)
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Format Expiry (add slash)
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <>
      {/* --- HEADER --- */}
      {/* <header className="header">
        <div className="logo">Dentistry99</div>
        <div className="user-info">Dr. Sarah Johnson</div>
        <button className="menu-btn" onClick={toggleSidebar}>☰</button>
      </header> */}

      {/* --- SIDEBAR --- */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="navitem">Dashboard</div>
        <div className="navitem active">Proposals & Orders</div>
        <div className="navitem">Inventory</div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="main">
        <h1 className="page-title">Product Proposals & Orders</h1>

        {/* --- CLIENT VIEW --- */}
        <div id="clientView">
          
          {/* --- PROPOSAL CARD (Conditional Render) --- */}
          {/* Only show if NOT Paid and NOT Rejected */}
          {!isPaid && !isRejected && (
            <div className="card">
              <h2>New Proposal from Dentistry99</h2>
                
              <div className="proposal-card recommended">
                <div className="badge recommended">RECOMMENDED</div>
                <h3>Monthly Restorative Package</h3>
                <p style={{color:'var(--gray)', margin:'16px 0'}}>
                  Save $16 with our expert recommendation
                </p>

                <div className="products-grid">
                  <div className="product-option recommended">
                    <h4>Composite Resin A2</h4>
                    <p>3M Filtek Supreme</p>
                    <div className="price">$35</div>
                    <div className="old-price">$41</div>
                  </div>
                  <div className="product-option recommended">
                    <h4>Bonding Agent</h4>
                    <p>Kuraray Clearfil</p>
                    <div className="price">$40</div>
                    <div className="old-price">$47</div>
                  </div>
                  <div className="product-option recommended">
                    <h4>Etchant Gel 37%</h4>
                    <p>Ultradent</p>
                    <div className="price">$8</div>
                    <div className="old-price">$11</div>
                  </div>
                </div>

                <div style={{textAlign:'center', padding:'20px', background:'#ecfdf5', borderRadius:'12px', fontSize:'22px', fontWeight:'800', color:'var(--success)'}}>
                  Total Amount: $83.00
                </div>

                <textarea 
                  placeholder="Add comment (optional)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>

                {/* --- CARD OPTION --- */}
                <div className="payment-wrapper">
                  <label className="payment-label">Pay with Card</label>
                  
                  <input 
                    type="text" 
                    className="payment-input"
                    placeholder="Card Number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                  
                  <div className="payment-row">
                    <input 
                      type="text" 
                      className="payment-input"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                    />
                    <input 
                      type="text" 
                      className="payment-input"
                      placeholder="CVC"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                      maxLength={3}
                    />
                  </div>
                </div>

                <div style={{display:'flex', gap:'16px', flexWrap:'wrap', alignItems:'center'}}>
                  <button 
                    id="payButton"
                    className="btn btn-success" 
                    onClick={handlePay}
                    disabled={isProcessing || isPaid}
                  >
                    {isPaid ? 'Paid Successfully' : 'Pay $83 & Place Order'}
                  </button>
                  <button className="btn btn-danger" onClick={handleReject}>
                    Reject
                  </button>
                  <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
                    <input 
                      type="checkbox" 
                      checked={saveFuture}
                      onChange={(e) => setSaveFuture(e.target.checked)}
                    />
                    <span>Save for future quick orders</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* --- STATUS MESSAGES --- */}
          {isPaid && (
            <div className="card" style={{textAlign:'center', padding:'50px', background:'#f0fdf4', border:'2px solid #10b981'}}>
              <h2 style={{color:'#10b981', marginBottom:'10px'}}>Proposal Paid Successfully!</h2>
              <p>Your order has been placed and added to your history.</p>
            </div>
          )}

          {isRejected && (
            <div className="card" style={{textAlign:'center', padding:'50px', background:'#fee2e2', border:'2px solid #ef4444'}}>
              <h2 style={{color:'#ef4444', marginBottom:'10px'}}>Proposal Rejected</h2>
              <p>This proposal has been removed from your active list.</p>
              {saveFuture && (
                <p style={{marginTop:'10px', fontSize:'14px', color:'#64748b'}}>
                  ℹ️ Your card details are saved for future use as per your selection.
                </p>
              )}
            </div>
          )}

          {/* --- ORDERS LIST --- */}
          <div className="card">
            <h3>Your Orders</h3>
            {orders.map(order => (
              <div key={order.id} className="order-item">
                <div>
                  <strong>Order #{order.id}</strong><br/>
                  <small>{order.items} items • ${order.total}</small>
                </div>
                <span className={`status ${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}