// // "use client";

// // import React, { useState, useRef, useEffect } from "react";
// // import { jsPDF } from "jspdf";
// // import {
// //   ShoppingBagIcon,
// //   ClockIcon,
// //   CheckCircleIcon,
// //   PlusIcon,
// //   CircleStackIcon,
// //   XMarkIcon,
// //   CheckIcon,
// //   ArrowDownTrayIcon,
// // } from "@heroicons/react/24/outline";
// // import { useSystemActivity } from "@/hooks/useSystemActivity";
// // import './page.css';
// // import { useQuotationPage } from "@/hooks/useQuotationPage";

// // interface QuotationData {
// //   id?: string;
// //   quotation_id?: string;
// //   product?: string;
// //   product_name?: string;
// //   type?: string;
// //   product_type?: string;
// //   date?: string;
// //   created_at?: string;
// //   status: string;
// //   budget: string;
// //   proposals?: any[];
// //   description?: string;
// // }

// // export default function QuotationsPage() {
// //   const {
// //     quotations,
// //     products,
// //     loading,
// //     error,
// //     activeTab,
// //     selectedOrder,
// //     productType,
// //     formData,
// //     cart, // Added cart
// //     currentPage,
//     totalPages,
//     totalProducts,
//     setActiveTab,
//     setProductType,
//     setFormData,
//     handleOpenModal,
//     handleCloseModal,
//     handleInputChange,
//     handleAddToCart, // Added handleAddToCart
//     removeFromCart,  // Added removeFromCart
//     handleSubmit,
//     setSelectedOrder,
//     fetchProducts,
//     handleUpdateProposal
//   } = useQuotationPage();

//   const { trackPageOpen } = useSystemActivity();

//   useEffect(() => {
//     trackPageOpen("Quotation");
//   }, [trackPageOpen]);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [page, setPage] = useState(1);
//   const [showProductList, setShowProductList] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (productType === "existing") {
//       const delayDebounceFn = setTimeout(() => {
//         fetchProducts(searchTerm, page);
//       }, 300);
//       return () => clearTimeout(delayDebounceFn);
//     }
//   }, [searchTerm, page, productType, fetchProducts]);

//   useEffect(() => {
//     setPage(1);
//   }, [searchTerm]);

//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setShowProductList(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <div className="quotation-page-container">
//       <div className="quotation-content-area">

//         {/* --- HEADER SECTION --- */}
//         <div className="quotation-header-row">
//           <div>
//             <h1 className="quotation-header-title">Quotation Management</h1>
//             <p className="quotation-header-sub">Track proposals and manage outgoing requests.</p>
//           </div>

//           <button onClick={handleOpenModal} className="quotation-btn-primary">
//             <PlusIcon style={{ height: 20, width: 20 }} />
//             <span>New Quotation</span>
//           </button>
//         </div>

//         {/* --- KPI CARDS --- */}
//         <div className="quotation-kpi-grid">
//           <KpiCard
//             title="Total Quotations"
//             value={quotations.length}
//             icon={<ShoppingBagIcon style={{ height: 24, width: 24, color: '#0A96D4' }} />}
//             bg="#eff6ff"
//           />
//           <KpiCard
//             title="Pending Review"
//             value={quotations.filter((q: any) => q.status === 'Pending').length}
//             icon={<ClockIcon style={{ height: 24, width: 24, color: '#f59e0b' }} />}
//             bg="#fffbeb"
//           />
//           <KpiCard
//             title="Approved Deals"
//             value={quotations.filter((q: any) => q.status === 'Approved').length}
//             icon={<CheckCircleIcon style={{ height: 24, width: 24, color: '#10b981' }} />}
//             bg="#ecfdf5"
//           />
//         </div>

//         {/* --- TABS & TABLE --- */}
//         <div className="quotation-main-section">
//           <div className="quotation-tabs-container">
//             <div className="quotation-tabs-pill">
//               <button
//                 onClick={() => setActiveTab("proposals")}
//                 className={`quotation-tab-btn ${activeTab === "proposals" ? "active" : ""}`}
//               >
//                 Requests Overview
//               </button>
//               <button
//                 onClick={() => setActiveTab("quotations")}
//                 className={`quotation-tab-btn ${activeTab === "quotations" ? "active" : ""}`}
//               >
//                 Proposals Received
//               </button>
//             </div>
//           </div>

//           <div className="quotation-table-card">
//             <div style={{ overflowX: 'auto' }}>
//               {activeTab === "proposals" ? (
//                 <QuotationsTable data={quotations} onSelect={setSelectedOrder} />
//               ) : (
//                 <ProposalsTable data={quotations} onAction={handleUpdateProposal} />
//               )}
//             </div>
//           </div>
//         </div>

//       </div>

//       {/* --- MODERN CART MODAL --- */}
//       {selectedOrder && !selectedOrder.quotation_id && (
//         <div className="quotation-modal-overlay" onClick={handleCloseModal}>
//           <div className="quotation-modal-content" onClick={(e) => e.stopPropagation()}>
//             <div className="quotation-modal-header">
//               <h3>Request Quotations</h3>
//               <button onClick={handleCloseModal} className="quotation-close-btn">&times;</button>
//             </div>

//             <div className="quotation-modal-body">
//               {/* Step 1: Product Entry */}
//               <div className="quotation-form-section">
//                 <label className="quotation-form-label">Product Category</label>
//                 <div className="quotation-category-split">
//                   <button
//                     type="button"
//                     onClick={() => { setProductType("new"); setFormData({ productName: "" }); }}
//                     className={`quotation-category-btn ${productType === "new" ? 'active' : ''}`}
//                   >
//                     <PlusIcon style={{ width: 24, height: 24 }} />
//                     <span>New Product</span>
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => setProductType("existing")}
//                     className={`quotation-category-btn ${productType === "existing" ? 'active' : ''}`}
//                   >
//                     <CircleStackIcon style={{ width: 24, height: 24 }} />
//                     <span>Existing</span>
//                   </button>
//                 </div>

//                 {productType && (
//                   <div className="quotation-animate-entry">
//                     <div className="quotation-form-group" style={{ position: 'relative' }} ref={dropdownRef}>
//                       <label className="quotation-form-label">{productType === "new" ? "What do you need?" : "Search Existing Products"}</label>
//                       <input
//                         type="text"
//                         name="productName"
//                         value={formData.productName}
//                         onFocus={() => productType === "existing" && setShowProductList(true)}
//                         onChange={(e) => {
//                           handleInputChange(e);
//                           if (productType === "existing") {
//                             setSearchTerm(e.target.value);
//                             setShowProductList(true);
//                           }
//                         }}
//                         autoComplete="off"
//                         className="quotation-form-input"
//                         placeholder={productType === "new" ? "e.g. Dental Laser System" : "Select or search..."}
//                       />
//                       {productType === "existing" && showProductList && (
//                         <div className="quotation-search-results">
//                           {products.length > 0 ? (
//                             <>
//                               {products.map((p: any) => (
//                                 <div key={p.id} className="quotation-result-item" onClick={() => {
//                                   setFormData({ productName: p.title });
//                                   setShowProductList(false);
//                                   setSearchTerm(p.title);
//                                 }}>
//                                   <div className="quotation-result-info">
//                                     <strong>{p.title}</strong>
//                                     <small>{p.brand} {p.sku ? `• ${p.sku}` : ''}</small>
//                                   </div>
//                                   <button className="quotation-result-select-btn">Select</button>
//                                 </div>
//                               ))}

//                               {totalPages > 1 && (
//                                 <div className="quotation-mini-pagination">
//                                   <button
//                                     type="button"
//                                     disabled={page === 1}
//                                     onClick={(e) => { e.stopPropagation(); setPage(page - 1); }}
//                                     className="quotation-mini-page-btn"
//                                   >
//                                     Previous
//                                   </button>
//                                   <span className="quotation-mini-page-info">
//                                     {currentPage} / {totalPages}
//                                   </span>
//                                   <button
//                                     type="button"
//                                     disabled={page === totalPages}
//                                     onClick={(e) => { e.stopPropagation(); setPage(page + 1); }}
//                                     className="quotation-mini-page-btn"
//                                   >
//                                     Next
//                                   </button>
//                                 </div>
//                               )}
//                             </>
//                           ) : (
//                             <div className="quotation-no-results">No products found</div>
//                           )}
//                         </div>
//                       )}
//                     </div>

//                     <div className="quotation-form-grid">
//                       <div className="quotation-form-group">
//                         <label className="quotation-form-label">Quantity</label>
//                         <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} className="quotation-form-input" min="1" />
//                       </div>
//                       <div className="quotation-form-group">
//                         <label className="quotation-form-label">Budget</label>
//                         <input type="text" name="budget" value={formData.budget} onChange={handleInputChange} className="quotation-form-input" placeholder="$0.00" />
//                       </div>
//                     </div>

//                     <div className="quotation-form-group" style={{ marginTop: '1rem' }}>
//                       <label className="quotation-form-label">Description</label>
//                       <textarea
//                         name="description"
//                         value={formData.description}
//                         onChange={handleInputChange}
//                         className="quotation-form-input"
//                         placeholder="Add specific details or instructions..."
//                         rows={3}
//                         style={{ resize: 'none' }}
//                       />
//                     </div>

//                     <button
//                       type="button"
//                       onClick={handleAddToCart}
//                       className="quotation-btn-primary"
//                       style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
//                     >
//                       + Add to List
//                     </button>
//                   </div>
//                 )}
//               </div>

//               {/* Step 2: Request List */}
//               <div className="quotation-cart-section">
//                 <div className="quotation-cart-header">
//                   <span className="quotation-cart-title">Items to Request ({cart.length})</span>
//                 </div>

//                 {cart.length === 0 ? (
//                   <div className="quotation-cart-empty">
//                     <ShoppingBagIcon style={{ width: 40, height: 40, margin: '0 auto 1rem', opacity: 0.2 }} />
//                     <p>Your request list is empty.</p>
//                   </div>
//                 ) : (
//                   <div className="quotation-cart-list">
//                     {cart.map((item: any) => (
//                       <div key={item.id} className="quotation-cart-item">
//                         <div className="quotation-cart-item-info">
//                           <strong>{item.productName}</strong>
//                           <small>{item.productType} • Qty: {item.quantity} • {item.budget}</small>
//                           {item.description && (
//                             <p className="quotation-cart-description">
//                               {item.description}
//                             </p>
//                           )}
//                         </div>
//                         <button onClick={() => removeFromCart(item.id)} className="quotation-remove-item-btn">&times;</button>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="quotation-modal-footer">
//               <button
//                 onClick={(e: any) => handleSubmit(e)}
//                 disabled={cart.length === 0}
//                 className="quotation-btn-primary quotation-btn-large"
//               >
//                 Send {cart.length} Request{cart.length !== 1 ? 's' : ''}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* --- QUOTATION DETAIL MODAL --- */}
//       {selectedOrder && selectedOrder.quotation_id && (
//         <QuotationDetailModal
//           order={selectedOrder}
//           onClose={handleCloseModal}
//         />
//       )}
//     </div>
//   );
// }

// // --- NEW COMPONENT FOR DETAIL MODAL ---
// function QuotationDetailModal({ order, onClose }: { order: any, onClose: () => void }) {
//   const handleDownloadPDF = () => {
//     const doc = new jsPDF();
//     const primaryColor = [10, 150, 212];
//     const secondaryColor = [30, 41, 59];
//     const lightSlate = [100, 116, 139];

//     doc.setDrawColor(241, 245, 249);
//     doc.rect(5, 5, 200, 287);
//     doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
//     doc.rect(0, 0, 7, 297, 'F');

//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(10);
//     doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
//     doc.text("DENTISTRY99 IMS", 25, 20);

//     doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
//     doc.setFontSize(28);
//     doc.text("Quotation Request", 25, 35);

//     doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
//     doc.setLineWidth(1.5);
//     doc.line(25, 42, 60, 42);

//     doc.setFontSize(9);
//     doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);
//     doc.setFont("helvetica", "normal");
//     doc.text(`REQUEST ID: ${order.quotation_id}`, 190, 20, { align: 'right' });
//     doc.text(`DATE GENERATED: ${new Date().toLocaleDateString()}`, 190, 26, { align: 'right' });

//     let y = 65;
//     doc.setFillColor(248, 250, 252);
//     doc.rect(25, y - 5, 170, 10, 'F');
//     doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
//     doc.setFontSize(12);
//     doc.setFont("helvetica", "bold");
//     doc.text("I. BASIC SPECIFICATIONS", 30, y + 2);

//     y += 20;
//     const details = [
//       ["Product Item", order.product || order.product_name],
//       ["Category Type", order.type || order.product_type],
//       ["Requested Qty", order.quantity || "1"],
//       ["Expected Date", order.date || new Date(order.created_at).toLocaleDateString()],
//       ["Budget Estimate", order.budget],
//       ["Current Status", order.status]
//     ];

//     details.forEach(([label, value]) => {
//       doc.setFontSize(10);
//       doc.setFont("helvetica", "bold");
//       doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);
//       doc.text(label, 30, y);
//       doc.setFont("helvetica", "bold");
//       doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
//       doc.text(String(value), 80, y);
//       doc.setDrawColor(241, 245, 249);
//       doc.setLineWidth(0.1);
//       doc.line(30, y + 3, 190, y + 3);
//       y += 12;
//     });

//     if (order.description) {
//       y += 10;
//       doc.setFillColor(248, 250, 252);
//       doc.rect(25, y - 5, 170, 10, 'F');
//       doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
//       doc.setFontSize(12);
//       doc.setFont("helvetica", "bold");
//       doc.text("II. ADDITIONAL REQUIREMENTS", 30, y + 2);
//       y += 12;
//       doc.setFontSize(10);
//       doc.setFont("helvetica", "normal");
//       doc.setTextColor(30, 41, 59);
//       const splitDesc = doc.splitTextToSize(order.description, 150);
//       doc.text(splitDesc, 30, y);
//       y += (splitDesc.length * 6) + 10;
//     }

//     if (order.proposals && order.proposals.length > 0) {
//       if (y > 230) { doc.addPage(); y = 30; }
//       doc.setFillColor(248, 250, 252);
//       doc.rect(25, y - 5, 170, 10, 'F');
//       doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
//       doc.setFontSize(12);
//       doc.setFont("helvetica", "bold");
//       doc.text("III. VENDOR PROPOSALS", 30, y + 2);
//       y += 15;
//       order.proposals.forEach((p: any) => {
//         doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
//         doc.setLineWidth(0.5);
//         doc.line(30, y - 4, 30, y + 10);
//         doc.setFontSize(10);
//         doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
//         doc.setFont("helvetica", "bold");
//         doc.text(p.title, 35, y);
//         doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
//         doc.text(p.amount, 190, y, { align: 'right' });
//         doc.setFontSize(9);
//         doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);
//         doc.setFont("helvetica", "normal");
//         doc.text(`Status: ${p.status}`, 35, y + 6);
//         y += 18;
//       });
//     }

//     doc.setDrawColor(226, 232, 240);
//     doc.line(25, 275, 190, 275);
//     doc.setFontSize(8);
//     doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);
//     doc.text("This is an official procurement document generated by Dentistry99 IMS.", 105, 282, { align: "center" });
//     doc.text("www.dentistry99.com", 105, 287, { align: "center" });
//     doc.save(`Quotation_${order.quotation_id}.pdf`);
//   };

//   return (
//     <div className="quotation-modal-overlay" onClick={onClose}>
//       <div className="quotation-modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
//         <div className="quotation-modal-header">
//           <div style={{ display: 'flex', flexDirection: 'column' }}>
//             <h3 className="font-bold">Quotation Details</h3>
//             <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ID: {order.quotation_id}</span>
//           </div>
//           <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
//             <button onClick={handleDownloadPDF} className="quotation-btn-download" title="Download PDF">
//               <ArrowDownTrayIcon style={{ height: 16, width: 16 }} />
//               <span>Download PDF</span>
//             </button>
//             <button onClick={onClose} className="quotation-close-btn">&times;</button>
//           </div>
//         </div>

//         <div className="quotation-modal-body">
//           <div className="quotation-detail-section">
//             <div className="quotation-detail-row">
//               <span className="quotation-detail-label">Product Name</span>
//               <span className="quotation-detail-value">{order.product || order.product_name}</span>
//             </div>
//             <div className="quotation-detail-row">
//               <span className="quotation-detail-label">Request Type</span>
//               <span className="quotation-detail-value">{order.type || order.product_type}</span>
//             </div>
//             <div className="quotation-detail-row">
//               <span className="quotation-detail-label">Request Date</span>
//               <span className="quotation-detail-value">{order.date || new Date(order.created_at).toLocaleDateString()}</span>
//             </div>
//             <div className="quotation-detail-row">
//               <span className="quotation-detail-label">Status</span>
//               <span className="quotation-detail-value">
//                 <StatusBadge status={order.status} />
//               </span>
//             </div>
//           </div>

//           <div className="quotation-detail-section">
//             <div className="quotation-detail-row" style={{ border: 'none' }}>
//               <span className="quotation-detail-label">Budget Range</span>
//               <span className="quotation-detail-value" style={{ color: '#0A96D4', fontWeight: 800, fontSize: '1.125rem' }}>
//                 {order.budget}
//               </span>
//             </div>
//           </div>

//           {order.description && (
//             <div className="quotation-detail-section">
//               <label className="quotation-detail-label" style={{ marginBottom: '8px', display: 'block' }}>Specifications / Notes</label>
//               <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
//                 {order.description}
//               </p>
//             </div>
//           )}

//           {order.proposals && order.proposals.length > 0 && (
//             <div style={{ marginTop: '0.5rem' }}>
//               <label className="quotation-detail-label" style={{ marginBottom: '12px', display: 'block' }}>Received Proposals ({order.proposals.length})</label>
//               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
//                 {order.proposals.map((prop: any) => (
//                   <div key={prop.proposal_id} className="quotation-proposal-item">
//                     <div>
//                       <div className="quotation-proposal-title">{prop.title}</div>
//                       <div className="quotation-proposal-amount">{prop.amount}</div>
//                     </div>
//                     <StatusBadge status={prop.status} />
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="quotation-modal-footer" style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
//           <button
//             onClick={onClose}
//             className="quotation-btn-primary"
//             style={{ width: '100%', justifyContent: 'center', background: '#0f172a' }}
//           >
//             Close View
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // --- SUB COMPONENTS ---
// function KpiCard({ title, value, icon, bg }: any) {
//   return (
//     <div className="quotation-kpi-card">
//       <div className="quotation-kpi-icon-wrapper" style={{ backgroundColor: bg }}>
//         {icon}
//       </div>
//       <div style={{ marginTop: '1rem' }}>
//         <h2 className="quotation-kpi-value">{value}</h2>
//         <p className="quotation-kpi-label">{title}</p>
//       </div>
//     </div>
//   );
// }

// function QuotationsTable({ data, onSelect }: any) {
//   if (data.length === 0) return <div className="quotation-empty-message">No requests sent yet.</div>;
//   return (
//     <table className="quotation-responsive-table">
//       <thead>
//         <tr>
//           <th>Product</th>
//           <th>Type</th>
//           <th>Date</th>
//           <th className="text-right">Budget</th>
//           <th className="text-center">Status</th>
//         </tr>
//       </thead>
//       <tbody>
//         {data.map((item: any) => (
//           <tr key={item.id} onClick={() => onSelect(item)}>
//             <td className="quotation-product-cell">{item.product}</td>
//             <td>
//               <span className={`quotation-type-badge ${item.type === 'New' ? 'type-new' : 'type-existing'}`}>
//                 {item.type}
//               </span>
//             </td>
//             <td>{item.date}</td>
//             <td className="quotation-budget-cell text-right">{item.budget}</td>
//             <td className="text-center"><StatusBadge status={item.status} /></td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// }

// function ProposalsTable({ data, onAction }: any) {
//   const allProposals = data.flatMap((q: any) =>
//     (q.proposals || []).map((p: any) => ({ ...p, parentQuote: q }))
//   ).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

//   if (allProposals.length === 0) return <div className="quotation-empty-message">No proposals received yet.</div>;
//   return (
//     <table className="quotation-responsive-table">
//       <thead>
//         <tr>
//           <th>Title</th>
//           <th>For Request</th>
//           <th>Amount</th>
//           <th className="text-center">Status</th>
//           <th className="text-right">Actions</th>
//         </tr>
//       </thead>
//       <tbody>
//         {allProposals.map((proposal: any) => (
//           <tr key={proposal.proposal_id}>
//             <td>
//               <span className="quotation-proposal-main-title">{proposal.title}</span>
//               <span className="quotation-proposal-sub">{proposal.description}</span>
//             </td>
//             <td>
//               <span className="quotation-parent-link">{proposal.parentQuote.product}</span>
//             </td>
//             <td className="quotation-proposal-amount-cell">{proposal.amount}</td>
//             <td className="text-center"><StatusBadge status={proposal.status} /></td>
//             <td className="text-right">
//               {proposal.status === 'Pending' ? (
//                 <div className="quotation-proposal-actions">
//                   <button onClick={() => onAction(proposal.quotation_id, proposal.proposal_id, 'Rejected')} className="quotation-action-btn-reject">
//                     <XMarkIcon style={{ height: 20, width: 20 }} />
//                   </button>
//                   <button onClick={() => onAction(proposal.quotation_id, proposal.proposal_id, 'Approved')} className="quotation-action-btn-approve">
//                     <CheckIcon style={{ height: 20, width: 20 }} />
//                   </button>
//                 </div>
//               ) : (
//                 <span className="quotation-decision-made">Decision made</span>
//               )}
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// }

// function StatusBadge({ status }: { status: string }) {
//   const statusClass = status.toLowerCase();
//   return (
//     <span className={`quotation-status-badge ${statusClass}`}>
//       {status}
//     </span>
//   );
// }

export default function QuotationsPage() {
  return null;
}
