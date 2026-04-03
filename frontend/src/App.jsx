import React, { useState, useEffect } from 'react';

function App() {
  const [page, setPage] = useState('home');
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ total: 0 });
  const [health, setHealth] = useState('Đang kiểm tra...');
  const [aboutInfo, setAboutInfo] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    checkHealth();
    fetchProducts();
    fetchStats();
    fetchAboutInfo();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const checkHealth = () => {
    fetch(`http://localhost:5000/health?t=${new Date().getTime()}`)
      .then(res => {
        if (!res.ok) throw new Error("Offline");
        return res.json();
      })
      .then(data => setHealth('🟢 Status: ' + (data.status || 'OK')))
      .catch(() => {
        setHealth('🔴 Mất Kết Nối');
        setProducts([]);
        setStats({ total: 0 });
        setAboutInfo(null);
      });
  };

  const toggleServerHealth = () => {
    fetch('http://localhost:5000/api/toggle-health', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.isHealthy) {
          setHealth('🟢 Hệ Thống Ổn Định');
          showToast("Đã khôi phục máy chủ! Đang đồng bộ dữ liệu...", "success");
          setTimeout(() => { fetchProducts(); fetchStats(); fetchAboutInfo(); }, 300);
        } else {
          setHealth('🔴 Mất Kết Nối');
          setProducts([]);
          setStats({ total: 0 });
          setAboutInfo(null);
          showToast("Đã ngắt kết nối Server (Chaos Mode)!", "error");
        }
      })
      .catch(err => {
        console.error(err);
        showToast("Lỗi khi thao tác kết nối!", "error");
      });
  };

  const fetchStats = () => {
    fetch('http://localhost:5000/api/stats')
      .then(res => {
        if (!res.ok) throw new Error("Offline");
        return res.json();
      })
      .then(data => {
        const totalCount = Array.isArray(data) ? data[0]?.total : data?.total;
        setStats({ total: totalCount || 0 });
      }).catch(err => console.error(err));
  };

  const fetchProducts = (search = '') => {
    fetch(`http://localhost:5000/api/products?search=${search}`)
      .then(res => {
        if (!res.ok) throw new Error("Offline");
        return res.json();
      })
      .then(data => {
        setProducts(data);
        if (search === '') setStats({ total: data.length });
      }).catch(err => console.error(err));
  };

  const fetchAboutInfo = () => {
    fetch('http://localhost:5000/api/about')
      .then(res => {
        if (!res.ok) throw new Error("Offline");
        return res.json();
      })
      .then(data => setAboutInfo(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: inputValue })
    }).then(res => {
      if (!res.ok) { showToast("Server Offline! Không thể thêm.", "error"); throw new Error("Offline"); }
      return res.json();
    }).then(newItem => {
        setProducts([newItem, ...products]); 
        setInputValue('');
        fetchStats();
        showToast("Thêm thành công!");
    }).catch(()=>{});
  };

  const handleDelete = (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa dữ liệu này?")) return;
    fetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) { showToast("Server Offline! Không thể xóa.", "error"); throw new Error("Offline"); }
        setProducts(products.filter(p => p.id !== id));
        fetchStats();
        showToast("Đã xóa sản phẩm!", "success");
      }).catch(()=>{});
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditValue(product.name);
  };

  const handleSaveEdit = (id) => {
    if (!editValue.trim()) return;
    fetch(`http://localhost:5000/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editValue })
    }).then(res => {
        if (!res.ok) { showToast("Server Offline! Không thể sửa.", "error"); throw new Error("Offline"); }
        setProducts(products.map(p => p.id === id ? { ...p, name: editValue } : p));
        setEditingId(null);
        showToast("Cập nhật thành công!");
    }).catch(()=>{});
  };

  return (
    <div style={{ fontFamily: '"Inter", system-ui, sans-serif', backgroundColor: '#f4f5f9', minHeight: '100vh', width: '100%', margin: 0, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; height: 100%; overflow-x: hidden; display: flex; flex-direction: column; }
        
        @keyframes popUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        @keyframes pulseGlow { 0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(79, 70, 229, 0); } 100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); } }
        @keyframes slideInRightData { from { opacity: 0; transform: translateX(-15px); } to { opacity: 1; transform: translateX(0); } }

        .navbar { display: flex; gap: 8px; padding: 15px 40px; background: #0f172a; border-bottom: 1px solid #1e293b; box-shadow: 0 4px 20px rgba(0,0,0,0.1); animation: slideDown 0.4s ease-out; position: sticky; top: 0; z-index: 100; width: 100%; justify-content: center; }
        .nav-item { cursor: pointer; padding: 10px 24px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 8px; font-weight: 600; font-size: 15px; color: #94a3b8; position: relative; }
        .nav-item:hover { color: #f8fafc; background: rgba(255,255,255,0.05); }
        .nav-active { background-color: #4f46e5 !important; color: #ffffff !important; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4); }

        .full-page-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 40px 20px; animation: fadeIn 0.4s ease-out; width: 100%; }
        
        .card-mega { background: #ffffff; padding: 35px 45px; border-radius: 20px; box-shadow: 0 10px 30px -10px rgba(79, 70, 229, 0.1); width: 100%; max-width: 1200px; min-height: 40vh; animation: popUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; display: flex; flex-direction: column; border: 1px solid #e2e8f0; }
        .card-mega-centered { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
        
        .stat-card { background: #ffffff; padding: 25px 30px; border-radius: 20px; box-shadow: 0 10px 30px -10px rgba(79, 70, 229, 0.1); flex: 1; animation: popUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards; transition: all 0.3s ease; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e2e8f0; }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px -10px rgba(79, 70, 229, 0.15); border-color: #c7d2fe; }
        
        .btn { padding: 12px 20px; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: inline-flex; align-items: center; justify-content: center; gap: 8px; letter-spacing: 0.3px; }
        .btn:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.12); filter: brightness(1.1); }
        .btn:active { transform: translateY(0); box-shadow: none; }
        .btn-green { background: linear-gradient(135deg, #10b981, #059669); color: white; }
        .btn-blue { background: linear-gradient(135deg, #4f46e5, #3730a3); color: white; }
        .btn-red { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
        .btn-orange { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
        .btn-gray { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
        .btn-gray:hover { background: #e2e8f0; color: #0f172a; }
        .btn-outline { background: transparent; color: #4f46e5; border: 2px solid #4f46e5; }
        .btn-outline:hover { background: #eef2ff; }

        .input-modern { padding: 12px 18px; border: 2px solid #e2e8f0; border-radius: 10px; outline: none; transition: all 0.3s ease; font-size: 15px; background: #f8fafc; color: #0f172a; }
        .input-modern:focus { border-color: #4f46e5; background: #ffffff; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
        .input-modern::placeholder { color: #94a3b8; }

        .search-box { display: flex; align-items: center; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 10px; padding: 0 16px; transition: all 0.3s ease; width: 350px; }
        .search-box:focus-within { border-color: #4f46e5; background: #ffffff; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
        .search-input { border: none; background: transparent; width: 100%; padding: 12px 10px; outline: none; font-size: 15px; color: #0f172a; }
        .search-input::placeholder { color: #94a3b8; }

        .table-container { border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; }
        .data-table th { padding: 20px 24px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-weight: 800; }
        .table-row { transition: all 0.2s ease; border-bottom: 1px solid #f1f5f9; animation: fadeIn 0.4s backwards; }
        .table-row:last-child { border-bottom: none; }
        .table-row:hover { background-color: #f8fafc; transform: scale(1.002); }
        .table-cell { padding: 20px 24px; vertical-align: middle; }

        .info-row { display: flex; justify-content: space-between; padding: 16px 20px; border-radius: 12px; margin-bottom: 8px; transition: all 0.2s ease; border: 1px solid transparent; opacity: 0; animation: slideInRightData 0.4s forwards ease-out; }
        .info-row:hover { background: #ffffff; border-color: #e2e8f0; box-shadow: 0 4px 10px rgba(0,0,0,0.02); transform: translateX(5px); }
        .info-row:nth-child(1) { animation-delay: 0.1s; }
        .info-row:nth-child(2) { animation-delay: 0.15s; }
        .info-row:nth-child(3) { animation-delay: 0.2s; }
        .info-row:nth-child(4) { animation-delay: 0.25s; }
        .info-row:nth-child(5) { animation-delay: 0.3s; }
      `}</style>

      <nav className="navbar">
        <div className={`nav-item ${page === 'home' ? 'nav-active' : ''}`} onClick={() => setPage('home')}>Quản lý dữ liệu</div>
        <div className={`nav-item ${page === 'about' ? 'nav-active' : ''}`} onClick={() => setPage('about')}>Thông tin sinh viên</div>
        <div className={`nav-item ${page === 'health' ? 'nav-active' : ''}`} onClick={() => { setPage('health'); checkHealth(); }}>Tình trạng máy chủ</div>
      </nav>

      {toast.show && (
        <div style={{ position: 'fixed', top: '25px', right: '25px', padding: '16px 24px', backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981', color: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 1000, animation: 'popUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.message}
        </div>
      )}

      <div className="full-page-wrapper">
        
        {page === 'about' && (
          <div className="card-mega card-mega-centered" style={{ maxWidth: '750px', minHeight: 'auto', padding: '50px' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#eef2ff', color: '#4f46e5', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', marginBottom: '20px', animation: 'pulseGlow 2s infinite' }}>🎓</div>
            <h1 style={{ fontSize: '24px', color: '#0f172a', margin: '0 0 35px 0', fontWeight: '800' }}>Hồ Sơ Sinh Viên</h1>
            
            {health.includes('Mất Kết Nối') ? (
               <div style={{ padding: '20px', color: '#ef4444', fontWeight: '600', fontSize: '15px', background: '#fef2f2', borderRadius: '12px', width: '100%', border: '1px solid #fecaca' }}>
                 Không thể tải dữ liệu từ Backend.
               </div>
            ) : aboutInfo ? (
              <div style={{ fontSize: '16px', lineHeight: '1.5', width: '100%', background: '#f8fafc', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div className="info-row"><span style={{ color: '#64748b', fontWeight: '600' }}>Họ và tên</span> <strong style={{ color: '#0f172a' }}>{aboutInfo.fullname}</strong></div>
                <div className="info-row"><span style={{ color: '#64748b', fontWeight: '600' }}>Lớp học</span> <strong style={{ color: '#0f172a' }}>{aboutInfo.class_name}</strong></div>
                <div className="info-row"><span style={{ color: '#64748b', fontWeight: '600' }}>Mã số sinh viên</span> <strong style={{ color: '#0f172a' }}>{aboutInfo.student_id}</strong></div>
                <div className="info-row"><span style={{ color: '#64748b', fontWeight: '600' }}>Tên dự án</span> <strong style={{ color: '#4f46e5' }}>{aboutInfo.project_name}</strong></div>
                <div className="info-row"><span style={{ color: '#64748b', fontWeight: '600' }}>Môn học phụ trách</span> <strong style={{ color: '#0f172a' }}>{aboutInfo.subject_name}</strong></div>
              </div>
            ) : (
              <div style={{ padding: '30px', color: '#94a3b8', fontSize: '15px' }}>Đang kết nối cơ sở dữ liệu...</div>
            )}
            
            <button className="btn btn-gray" style={{ marginTop: '40px', width: '100%', padding: '16px' }} onClick={() => { fetchAboutInfo(); showToast("Đã cập nhật dữ liệu!", "success"); }}>Cập nhật lại thông tin</button>
          </div>
        )}

        {page === 'health' && (
          <div className="card-mega card-mega-centered" style={{ maxWidth: '700px', minHeight: 'auto', padding: '50px' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: health.includes('🟢') ? '#dcfce7' : '#fee2e2', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', marginBottom: '20px', transition: 'all 0.3s', boxShadow: `0 4px 15px ${health.includes('🟢') ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
              {health.includes('🟢') ? '⚡' : '🔌'}
            </div>
            <h1 style={{ fontSize: '24px', color: '#0f172a', margin: '0 0 10px 0', fontWeight: '800' }}>Kết Nối Máy Chủ</h1>
            <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '40px' }}>Quản lý và kiểm tra trạng thái hoạt động của Backend API</p>
            
            <div style={{ fontSize: '20px', fontWeight: '800', padding: '20px 40px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: health.includes('🟢') ? '#f0fdf4' : '#fef2f2', color: health.includes('🟢') ? '#15803d' : '#b91c1c', border: `2px solid ${health.includes('🟢') ? '#bbf7d0' : '#fecaca'}`, width: '100%', marginBottom: '40px' }}>
              {health}
            </div>
            
            <div style={{ display: 'flex', gap: '15px', width: '100%', flexWrap: 'wrap' }}>
              <button className="btn btn-gray" style={{ flex: 1, minWidth: '150px' }} onClick={checkHealth}>Kiểm tra lại</button>
              <button className={`btn ${health.includes('🟢') ? 'btn-red' : 'btn-green'}`} style={{ flex: 1, minWidth: '150px' }} onClick={toggleServerHealth}>
                {health.includes('🟢') ? 'Ngắt kết nối' : 'Khôi phục máy chủ'}
              </button>
              <a href="http://localhost:5000/health" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', flex: '1 1 100%' }}>
                <button className="btn btn-outline" style={{ width: '100%' }}>🌐 Xem API gốc</button>
              </a>
            </div>
          </div>
        )}

        {page === 'home' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '1200px' }}>
            
            <div style={{ display: 'flex', gap: '25px', width: '100%', marginBottom: '25px' }}>
              <div className="stat-card" style={{ animationDelay: '0.1s' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tổng số sản phẩm</h3>
                  <span style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>{stats.total}</span>
                </div>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.1)' }}>📦</div>
              </div>
              
              <div className="stat-card" style={{ animationDelay: '0.15s' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Trạng thái API</h3>
                  <span style={{ fontSize: '22px', fontWeight: '800', color: health.includes('🟢') ? '#10b981' : '#ef4444', display: 'block', marginTop: '6px' }}>{health.replace('🟢 ', '').replace('🔴 ', '')}</span>
                </div>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: health.includes('🟢') ? '#dcfce7' : '#fee2e2', color: health.includes('🟢') ? '#166534' : '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: `0 4px 10px ${health.includes('🟢') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}` }}>
                  {health.includes('🟢') ? '✓' : '✗'}
                </div>
              </div>
            </div>

            <div className="card-mega" style={{ padding: '30px', minHeight: 'auto', marginBottom: '25px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '15px', flex: 1 }}>
                <input className="input-modern" placeholder="Nhập tên sản phẩm mới..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} style={{ width: '100%', maxWidth: '380px' }} disabled={health.includes('Mất Kết Nối')} />
                <button className="btn btn-blue" onClick={handleAdd} disabled={health.includes('Mất Kết Nối')}>Thêm dữ liệu</button>
              </div>
              
              <div className="search-box">
                <span style={{ fontSize: '18px', color: '#94a3b8' }}>🔍</span>
                <input className="search-input" placeholder="Tìm kiếm nhanh..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={health.includes('Mất Kết Nối')} />
              </div>
            </div>

            <div className="card-mega" style={{ padding: '0', minHeight: '50vh', border: 'none' }}>
              {health.includes('Mất Kết Nối') ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', color: '#ef4444' }}>
                  <div style={{ width: '80px', height: '80px', backgroundColor: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '20px' }}>⚠️</div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Không thể tải dữ liệu</h3>
                  <p style={{ color: '#64748b', fontSize: '15px', marginTop: '10px' }}>Vui lòng kiểm tra lại kết nối máy chủ.</p>
                </div>
              ) : products.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', color: '#94a3b8' }}>
                  <div style={{ width: '80px', height: '80px', backgroundColor: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '20px' }}>📭</div>
                  <p style={{ fontSize: '16px', margin: 0, fontWeight: '500' }}>
                    {searchTerm ? `Không có kết quả nào khớp với "${searchTerm}"` : 'Danh sách sản phẩm đang trống.'}
                  </p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '15%' }}>ID Sản Phẩm</th>
                        <th style={{ width: '55%' }}>Tên Hàng Hóa</th>
                        <th style={{ textAlign: 'right', width: '30%' }}>Hành Động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product, index) => (
                        <tr key={product.id} className="table-row" style={{ animationDelay: `${index * 0.05}s` }}>
                          <td className="table-cell" style={{ fontWeight: '700', color: '#64748b', fontSize: '15px' }}>#{product.id}</td>
                          <td className="table-cell">
                            {editingId === product.id ? (
                              <input className="input-modern" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(product.id)} autoFocus style={{ width: '100%', maxWidth: '400px', padding: '10px 14px' }} />
                            ) : (
                              <span style={{ fontSize: '16px', color: '#0f172a', fontWeight: '600' }}>{product.name}</span>
                            )}
                          </td>
                          <td className="table-cell" style={{ textAlign: 'right' }}>
                            {editingId === product.id ? (
                              <button className="btn btn-green" onClick={() => handleSaveEdit(product.id)} style={{ marginRight: '10px' }}>Lưu thay đổi</button>
                            ) : (
                              <button className="btn btn-orange" onClick={() => startEdit(product)} style={{ marginRight: '10px' }}>Chỉnh sửa</button>
                            )}
                            <button className="btn btn-red" onClick={() => handleDelete(product.id)}>Xóa bỏ</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}

export default App;