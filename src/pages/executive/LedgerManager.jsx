import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { useDialog } from '../../context/DialogContext';

export default function LedgerManager() {
  const navigate = useNavigate();
  const { alert } = useDialog();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Ledger state
  const [rawTransactions, setRawTransactions] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Filters & Sorting state
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [chartTimeframe, setChartTimeframe] = useState('all');
  
  const [newTx, setNewTx] = useState({
    date: new Date().toISOString().split('T')[0],
    method: 'E-Transfer',
    details: '',
    reference: '',
    sender: '',
    recipient: '',
    deposit: '',
    withdrawal: ''
  });

  // Google Drive & CSV Export states
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('google_client_id') || ''
  );
  const [exportScope, setExportScope] = useState('filtered');
  const [convertToSheet, setConvertToSheet] = useState(true);
  const [driveLoading, setDriveLoading] = useState(false);

  // Load Google Identity Services SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // CSV Generator Utility
  const convertToCSV = (transactions) => {
    const headers = ['Date', 'Method', 'Details/Description', 'Sender', 'Recipient', 'Withdrawal ($)', 'Deposit ($)', 'Balance ($)', 'Reference'];
    const rows = transactions.map(t => [
      t.date || '',
      t.method || '',
      t.details || t.description || '',
      t.sender || '',
      t.recipient || '',
      t.withdrawal ? t.withdrawal.toFixed(2) : '',
      t.deposit ? t.deposit.toFixed(2) : '',
      t.balance ? t.balance.toFixed(2) : '',
      t.reference || ''
    ]);
    
    const formatCell = cell => {
      const str = String(cell);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    return [
      headers.map(formatCell).join(','),
      ...rows.map(row => row.map(formatCell).join(','))
    ].join('\r\n');
  };

  const handleExportCSV = () => {
    try {
      const csvData = convertToCSV(filteredAndSortedTransactions);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `UCDS_Financial_Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export CSV: " + err.message);
    }
  };

  const handleExecuteGoogleDriveExport = async () => {
    if (!googleClientId.trim()) {
      alert("Please enter a valid Google OAuth Client ID");
      return;
    }

    localStorage.setItem('google_client_id', googleClientId.trim());

    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      alert("Google Identity Services SDK has not loaded yet. Please wait a moment and try again.");
      return;
    }

    setDriveLoading(true);

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId.trim(),
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setDriveLoading(false);
            alert("Google Authentication failed: " + (tokenResponse.error_description || tokenResponse.error));
            return;
          }

          const accessToken = tokenResponse.access_token;
          await uploadToGoogleDrive(accessToken);
        }
      });

      client.requestAccessToken();
    } catch (err) {
      setDriveLoading(false);
      alert("Error initializing Google auth client: " + err.message);
    }
  };

  const uploadToGoogleDrive = async (accessToken) => {
    try {
      const dataToExport = exportScope === 'filtered' ? filteredAndSortedTransactions : rawTransactions;
      const csvContent = convertToCSV(dataToExport);

      const fileName = `UCDS Financial Ledger - ${new Date().toISOString().split('T')[0]}`;
      const mimeType = convertToSheet ? 'application/vnd.google-apps.spreadsheet' : 'text/csv';

      const metadata = {
        name: fileName,
        mimeType: mimeType
      };

      const boundary = 'ucds_ledger_multipart_boundary';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/csv\r\n\r\n' +
        csvContent +
        closeDelimiter;

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Google API returned status ${response.status}: ${errText}`);
      }

      const resData = await response.json();
      alert(`Successfully exported ledger to Google Drive!\nFile ID: ${resData.id}\nFile Name: ${resData.name}`);
      setIsDriveModalOpen(false);
    } catch (err) {
      console.error("Failed to upload to Google Drive", err);
      alert("Failed to export to Google Drive: " + err.message);
    } finally {
      setDriveLoading(false);
    }
  };

  // -------------------------------------------------------------
  // AUTH TRACKER
  // -------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setAuthInitialized(true);
      if (authInitialized && !user) {
        navigate('/executive');
      }
    });
    return () => unsubscribe();
  }, [navigate, authInitialized]);

  // -------------------------------------------------------------
  // FETCH LEDGER
  // -------------------------------------------------------------
  const fetchLedger = async () => {
    setLedgerLoading(true);
    try {
      const q = query(collection(db, 'ledger'));
      const snapshot = await getDocs(q);
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort chronologically (oldest first) based on date first, then index, then createdAt
      const sortedTxs = [...txs].sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        if (a.index !== undefined && b.index !== undefined) {
          return a.index - b.index;
        }
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });

      setRawTransactions(sortedTxs);
    } catch (err) {
      console.error("Error fetching ledger", err);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchLedger();
    }
  }, [isLoggedIn]);

  // -------------------------------------------------------------
  // MUTATIONS
  // -------------------------------------------------------------
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!newTx.details.trim()) {
      alert("Please fill in details");
      return;
    }

    const depVal = parseFloat(newTx.deposit);
    const withVal = parseFloat(newTx.withdrawal);
    const dep = (!isNaN(depVal) && depVal > 0) ? depVal : 0;
    const wth = (!isNaN(withVal) && withVal > 0) ? withVal : 0;

    if (dep === 0 && wth === 0) {
      alert("Please enter either a deposit or withdrawal amount");
      return;
    }

    try {
      const ledgerCol = collection(db, 'ledger');
      
      // Get latest transaction from raw list (oldest-to-newest sorted)
      const latestTx = rawTransactions.length > 0 ? rawTransactions[rawTransactions.length - 1] : null;
      const prevBalance = latestTx ? latestTx.balance || 0 : 0;
      const nextIndex = latestTx ? (latestTx.index || rawTransactions.length) + 1 : 1;

      const calculatedBalance = prevBalance + dep - wth;

      const payload = {
        date: newTx.date,
        method: newTx.method,
        details: newTx.details.trim(),
        description: newTx.details.trim(), // backward compatibility
        reference: newTx.reference.trim(),
        sender: newTx.sender.trim(),
        recipient: newTx.recipient.trim(),
        deposit: dep > 0 ? dep : null,
        withdrawal: wth > 0 ? wth : null,
        balance: calculatedBalance,
        index: nextIndex,
        createdAt: new Date().toISOString()
      };

      await addDoc(ledgerCol, payload);
      
      setNewTx({
        date: new Date().toISOString().split('T')[0],
        method: 'E-Transfer',
        details: '',
        reference: '',
        sender: '',
        recipient: '',
        deposit: '',
        withdrawal: ''
      });

      alert("Transaction successfully recorded!");
      fetchLedger();
    } catch (err) {
      console.error(err);
      alert("Failed to write to database: " + err.message);
    }
  };

  // -------------------------------------------------------------
  // DEREVIED DATA: FILTERS & SORTING
  // -------------------------------------------------------------
  const uniqueYears = useMemo(() => {
    const years = rawTransactions.map(t => t.date.split('-')[0]);
    return Array.from(new Set(years)).sort().reverse();
  }, [rawTransactions]);

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...rawTransactions];

    // 1. Filter by Year
    if (filterYear !== 'all') {
      result = result.filter(t => t.date.split('-')[0] === filterYear);
    }

    // 2. Filter by Month
    if (filterMonth !== 'all') {
      result = result.filter(t => t.date.split('-')[1] === filterMonth);
    }

    // 3. Filter by Type
    if (filterType === 'deposit') {
      result = result.filter(t => t.deposit !== null && t.deposit !== undefined && t.deposit > 0);
    } else if (filterType === 'withdrawal') {
      result = result.filter(t => t.withdrawal !== null && t.withdrawal !== undefined && t.withdrawal > 0);
    }

    // 4. Filter by Method
    if (filterMethod !== 'all') {
      result = result.filter(t => t.method === filterMethod);
    }

    // 5. Apply Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else if (sortField === 'month') {
        const monthA = a.date.split('-')[1] || '';
        const monthB = b.date.split('-')[1] || '';
        comparison = monthA.localeCompare(monthB);
      } else if (sortField === 'year') {
        const yearA = a.date.split('-')[0] || '';
        const yearB = b.date.split('-')[0] || '';
        comparison = yearA.localeCompare(yearB);
      } else if (sortField === 'withdrawal') {
        const wA = a.withdrawal || 0;
        const wB = b.withdrawal || 0;
        comparison = wA - wB;
      } else if (sortField === 'deposit') {
        const dA = a.deposit || 0;
        const dB = b.deposit || 0;
        comparison = dA - dB;
      } else if (sortField === 'method') {
        const methA = a.method || '';
        const methB = b.method || '';
        comparison = methA.localeCompare(methB);
      }

      // Stable fallback: sort chronologically if values are identical
      if (comparison === 0) {
        comparison = a.date.localeCompare(b.date);
        if (comparison === 0) {
          comparison = (a.index || 0) - (b.index || 0);
        }
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [rawTransactions, filterYear, filterMonth, filterType, filterMethod, sortField, sortOrder]);

  // Overall actual net balance of the society
  const actualNetBalance = useMemo(() => {
    if (rawTransactions.length > 0) {
      return rawTransactions[rawTransactions.length - 1].balance || 0;
    }
    return 0;
  }, [rawTransactions]);

  // Dynamic timeframe filter for chart trend visualization
  const chartFilteredTransactions = useMemo(() => {
    let result = [...filteredAndSortedTransactions];
    if (chartTimeframe === 'all') return result;

    let refDate = new Date();
    if (result.length > 0) {
      const dates = result.map(t => new Date(t.date).getTime());
      const maxDateVal = Math.max(...dates);
      if (!isNaN(maxDateVal)) {
        const maxDate = new Date(maxDateVal);
        if (maxDate < refDate) {
          refDate = maxDate;
        }
      }
    }

    const thresholdDate = new Date(refDate);
    if (chartTimeframe === 'week') {
      thresholdDate.setDate(refDate.getDate() - 7);
    } else if (chartTimeframe === 'month') {
      thresholdDate.setDate(refDate.getDate() - 30);
    } else if (chartTimeframe === 'year') {
      thresholdDate.setDate(refDate.getDate() - 365);
    }

    const thresholdStr = thresholdDate.toISOString().split('T')[0];
    return result.filter(t => t.date >= thresholdStr);
  }, [filteredAndSortedTransactions, chartTimeframe]);

  // Graph data based on raw (unfiltered) transactions to preserve full continuity, 
  // or filteredTransactions if they want to zoom in. We use rawTransactions to show the true trend,
  // but let's check: if year/month filter is applied, showing the filtered trend makes sense.
  // We will build chartData from chartFilteredTransactions, but we MUST sort it oldest-to-newest for chart plotting!
  const chartData = [...chartFilteredTransactions]
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.index !== undefined && b.index !== undefined) return a.index - b.index;
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    })
    .map(t => ({
      date: t.date,
      balance: t.balance || 0,
      details: t.details || t.description || 'Transaction',
      change: t.deposit ? `+$${t.deposit.toFixed(2)}` : t.withdrawal ? `-$${t.withdrawal.toFixed(2)}` : 'No change'
    }));

  if (!authInitialized || !isLoggedIn) {
    return (
      <main>
        <section className="section" style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>Redirecting to portal...</p>
        </section>
      </main>
    );
  }

  // Render SVG Graph if we have points
  let graphContent = null;
  if (chartData.length > 0) {
    const balances = chartData.map(d => d.balance);
    const maxVal = Math.max(...balances);
    const minVal = Math.min(...balances);
    const valRange = maxVal - minVal;
    
    // Y padding (10%)
    const yMin = valRange === 0 ? minVal - 10 : minVal - valRange * 0.1;
    const yMax = valRange === 0 ? maxVal + 10 : maxVal + valRange * 0.1;
    
    const paddingLeft = 75;
    const paddingRight = 30;
    const paddingTop = 20;
    const paddingBottom = 40;
    const chartWidth = 900;
    const chartHeight = 240;
    
    // Build path coordinates
    let pathD = "";
    chartData.forEach((pt, i) => {
      const x = paddingLeft + (i * (chartWidth - paddingLeft - paddingRight) / (chartData.length - 1));
      const y = chartHeight - paddingBottom - ((pt.balance - yMin) * (chartHeight - paddingTop - paddingBottom) / (yMax - yMin));
      if (i === 0) {
        pathD += `M ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
      }
    });
    
    const firstX = paddingLeft;
    const lastX = chartWidth - paddingRight;
    const bottomY = chartHeight - paddingBottom;
    const areaD = chartData.length > 1 ? `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z` : "";
    
    // Grid lines
    const gridLines = [];
    const gridCount = 4;
    for (let i = 0; i < gridCount; i++) {
      const val = yMin + (i * (yMax - yMin) / (gridCount - 1));
      const y = chartHeight - paddingBottom - ((val - yMin) * (chartHeight - paddingTop - paddingBottom) / (yMax - yMin));
      gridLines.push({ val, y });
    }
    
    // Select 5 key dates to show on X-axis
    const labelIndexes = [];
    if (chartData.length > 1) {
      const step = (chartData.length - 1) / 4;
      for (let i = 0; i <= 4; i++) {
        labelIndexes.push(Math.round(i * step));
      }
    } else {
      labelIndexes.push(0);
    }
    
    let hoveredX = 0;
    let hoveredY = 0;
    if (hoveredIndex !== null && hoveredIndex < chartData.length) {
      hoveredX = paddingLeft + (hoveredIndex * (chartWidth - paddingLeft - paddingRight) / (chartData.length - 1));
      hoveredY = chartHeight - paddingBottom - ((chartData[hoveredIndex].balance - yMin) * (chartHeight - paddingTop - paddingBottom) / (yMax - yMin));
    }
    
    graphContent = (
      <div style={{ position: 'relative', width: '100%', minHeight: '240px', background: 'rgba(5, 12, 28, 0.45)', borderRadius: '12px', padding: '15px 0', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '2.5rem' }}>
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="chart-line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Horizontal Grid lines and labels */}
          {gridLines.map((gl, i) => (
            <g key={i}>
              <line x1={paddingLeft} y1={gl.y} x2={chartWidth - paddingRight} y2={gl.y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <text x={paddingLeft - 12} y={gl.y + 4} fill="#94a3b8" fontSize="10" textAnchor="end">
                ${gl.val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </text>
            </g>
          ))}
          
          {/* Area fill */}
          {areaD && <path d={areaD} fill="url(#chart-area-grad)" pointerEvents="none" />}
          
          {/* Line plot */}
          {pathD && <path d={pathD} fill="none" stroke="url(#chart-line-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />}
          
          {/* X Axis line */}
          <line x1={paddingLeft} y1={chartHeight - paddingBottom} x2={chartWidth - paddingRight} y2={chartHeight - paddingBottom} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          
          {/* X Axis date labels */}
          {labelIndexes.map(idx => {
            const pt = chartData[idx];
            if (!pt) return null;
            const x = paddingLeft + (idx * (chartWidth - paddingLeft - paddingRight) / (chartData.length - 1));
            return (
              <text key={idx} x={x} y={chartHeight - paddingBottom + 18} fill="#94a3b8" fontSize="10" textAnchor="middle">
                {pt.date}
              </text>
            );
          })}
          
          {/* Hover state details */}
          {hoveredIndex !== null && (
            <g pointerEvents="none">
              <line x1={hoveredX} y1={paddingTop} x2={hoveredX} y2={chartHeight - paddingBottom} stroke="rgba(147, 197, 253, 0.35)" strokeWidth="1.25" strokeDasharray="3 3" />
              <circle cx={hoveredX} cy={hoveredY} r="5.5" fill="#a855f7" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}
          
          {/* Hover hit rects */}
          {chartData.length > 1 && chartData.map((pt, i) => {
            const sliceWidth = (chartWidth - paddingLeft - paddingRight) / (chartData.length - 1);
            const x = paddingLeft + (i * (chartWidth - paddingLeft - paddingRight) / (chartData.length - 1)) - sliceWidth / 2;
            return (
              <rect
                key={i}
                x={x}
                y={paddingTop}
                width={sliceWidth}
                height={chartHeight - paddingTop - paddingBottom}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
        </svg>
        
        {/* Tooltip Overlay */}
        {hoveredIndex !== null && chartData[hoveredIndex] && (
          <div style={{
            position: 'absolute',
            left: `${Math.min(
              chartWidth - 210,
              Math.max(20, (hoveredIndex * (chartWidth - paddingLeft - paddingRight) / (chartData.length - 1)) + paddingLeft - 85)
            ) * 100 / chartWidth}%`,
            bottom: '55px',
            background: 'rgba(9, 18, 41, 0.95)',
            border: '1px solid rgba(147, 197, 253, 0.3)',
            borderRadius: '8px',
            padding: '10px 12px',
            color: '#ffffff',
            fontSize: '0.78rem',
            lineHeight: '1.45',
            pointerEvents: 'none',
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            zIndex: 10,
            width: '180px',
            textAlign: 'left'
          }}>
            <div style={{ fontWeight: 'bold', color: '#93c5fd', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '6px' }}>
              📅 {chartData[hoveredIndex].date}
            </div>
            <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#e2e8f0', marginBottom: '4px' }} title={chartData[hoveredIndex].details}>
              {chartData[hoveredIndex].details}
            </div>
            <div style={{ color: chartData[hoveredIndex].change.startsWith('+') ? '#22c55e' : '#f87171', fontWeight: 'bold', fontSize: '0.85rem' }}>
              Amount: {chartData[hoveredIndex].change}
            </div>
            <div style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '4px', fontWeight: 'bold', color: '#a855f7' }}>
              Balance: ${chartData[hoveredIndex].balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        )}
      </div>
    );
  } else {
    graphContent = (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', background: 'rgba(5, 12, 28, 0.45)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#94a3b8', marginBottom: '2.5rem' }}>
        No transactions match filters for trend visualization.
      </div>
    );
  }

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="exec-card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '1.25rem', padding: '3rem 2.5rem', color: '#ffffff', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)', maxWidth: '1280px', margin: '4rem auto', textAlign: 'left' }}>
            
            {/* Header banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2.25rem', color: '#ffffff', margin: '0 0 0.25rem', fontWeight: 800 }}>Society Financial Ledger</h1>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>View, search, and update UCDS financial records directly.</p>
              </div>
              <Link to="/executive" className="exec-btn exec-btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.6rem 1.5rem', fontSize: '0.9rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', cursor: 'pointer' }}>
                Back to Dashboard
              </Link>
            </div>

            {/* Visualisations Title & Timeframe Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.4rem', color: '#93c5fd', margin: 0, fontWeight: 700 }}>Account Balance Trend</h3>
              <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(5, 12, 28, 0.45)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {['week', 'month', 'year', 'all'].map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setChartTimeframe(tf)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: 'none',
                      background: chartTimeframe === tf ? '#2563eb' : 'transparent',
                      color: chartTimeframe === tf ? '#ffffff' : '#94a3b8',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textTransform: 'capitalize'
                    }}
                  >
                    {tf === 'all' ? 'All Time' : tf}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Chart Container */}
            {graphContent}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: '2rem', marginTop: '1.5rem' }}>
              {/* Left Side: Record form */}
              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.5rem', height: 'fit-content' }}>
                <h4 style={{ margin: '0 0 1.25rem', color: '#93c5fd', fontSize: '1.15rem', fontWeight: 700 }}>Record Transaction</h4>
                <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Date</label>
                    <input 
                      type="date" 
                      value={newTx.date} 
                      onChange={(e) => setNewTx({...newTx, date: e.target.value})} 
                      className="text-input" 
                      placeholder={new Date().toISOString().split('T')[0]}
                      style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.95rem', outline: 'none' }} 
                      required 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Sender</label>
                    <input 
                      type="text" 
                      value={newTx.sender} 
                      onChange={(e) => setNewTx({...newTx, sender: e.target.value})} 
                      className="text-input" 
                      placeholder="e.g. Payee name or UCDS" 
                      style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.95rem', outline: 'none' }} 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Recipient</label>
                    <input 
                      type="text" 
                      value={newTx.recipient} 
                      onChange={(e) => setNewTx({...newTx, recipient: e.target.value})} 
                      className="text-input" 
                      placeholder="e.g. UCDS or Receiver name" 
                      style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.95rem', outline: 'none' }} 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Deposit ($)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={newTx.deposit} 
                        onChange={(e) => setNewTx({...newTx, deposit: e.target.value})} 
                        className="text-input" 
                        placeholder="0.00" 
                        style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.95rem', outline: 'none' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Withdrawal ($)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={newTx.withdrawal} 
                        onChange={(e) => setNewTx({...newTx, withdrawal: e.target.value})} 
                        className="text-input" 
                        placeholder="0.00" 
                        style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.95rem', outline: 'none' }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Details / Description</label>
                    <input 
                      type="text" 
                      value={newTx.details} 
                      onChange={(e) => setNewTx({...newTx, details: e.target.value})} 
                      className="text-input" 
                      placeholder="e.g. Membership fee" 
                      style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.95rem', outline: 'none' }} 
                      required 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Method</label>
                    <select 
                      value={newTx.method} 
                      onChange={(e) => setNewTx({...newTx, method: e.target.value})} 
                      className="select-input" 
                      style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.95rem', outline: 'none' }}
                    >
                      <option value="E-Transfer">E-Transfer</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Fee">Fee</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Reference (Ref / Trans ID)</label>
                    <input 
                      type="text" 
                      value={newTx.reference} 
                      onChange={(e) => setNewTx({...newTx, reference: e.target.value})} 
                      className="text-input" 
                      placeholder="e.g. C1AxJf... (Optional)" 
                      style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.95rem', outline: 'none' }} 
                    />
                  </div>

                  <button type="submit" className="exec-btn exec-btn-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '10px', borderRadius: '999px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>Submit Entry</button>
                </form>
              </div>

              {/* Right Side: Ledger Transactions Table */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1rem', color: '#cbd5e1' }}>Account Position Summary</span>
                  <strong style={{ fontSize: '1.75rem', color: actualNetBalance >= 0 ? '#22c55e' : '#f87171' }}>
                    {actualNetBalance >= 0 ? '' : '-'}${Math.abs(actualNetBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD
                  </strong>
                </div>

                {/* Export controls row */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '1.25rem', justifyContent: 'flex-end' }}>
                  <button onClick={handleExportCSV} className="exec-btn exec-btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#ffffff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    📥 Download CSV
                  </button>
                  <button onClick={() => setIsDriveModalOpen(true)} className="exec-btn exec-btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#ffffff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    ▲ Export to Google Drive
                  </button>
                </div>

                {/* Filter and Sort Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: '8px', background: 'rgba(5, 12, 28, 0.45)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Filter Year</label>
                    <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '5px', borderRadius: '4px', fontSize: '0.75rem', outline: 'none' }}>
                      <option value="all">All Years</option>
                      {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Filter Month</label>
                    <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '5px', borderRadius: '4px', fontSize: '0.75rem', outline: 'none' }}>
                      <option value="all">All Months</option>
                      <option value="01">January</option>
                      <option value="02">February</option>
                      <option value="03">March</option>
                      <option value="04">April</option>
                      <option value="05">May</option>
                      <option value="06">June</option>
                      <option value="07">July</option>
                      <option value="08">August</option>
                      <option value="09">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Filter Type</label>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '5px', borderRadius: '4px', fontSize: '0.75rem', outline: 'none' }}>
                      <option value="all">All Types</option>
                      <option value="deposit">Deposits</option>
                      <option value="withdrawal">Withdrawals</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Filter Method</label>
                    <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '5px', borderRadius: '4px', fontSize: '0.75rem', outline: 'none' }}>
                      <option value="all">All Methods</option>
                      <option value="E-Transfer">E-Transfer</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Fee">Fee</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Sort By</label>
                    <select value={sortField} onChange={(e) => setSortField(e.target.value)} style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '5px', borderRadius: '4px', fontSize: '0.75rem', outline: 'none' }}>
                      <option value="date">Date</option>
                      <option value="month">Month</option>
                      <option value="year">Year</option>
                      <option value="withdrawal">Withdrawal</option>
                      <option value="deposit">Deposit</option>
                      <option value="method">Method</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Sort Order</label>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '5px', borderRadius: '4px', fontSize: '0.75rem', outline: 'none' }}>
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>

                <div style={{ maxHeight: '680px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                  {ledgerLoading ? (
                    <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading ledger...</p>
                  ) : filteredAndSortedTransactions.length === 0 ? (
                    <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No transactions found matching active filters.</p>
                  ) : (
                    <table className="exec-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', color: '#ffffff' }}>
                      <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.45)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ padding: '12px 10px' }}>Date</th>
                          <th style={{ padding: '12px 10px' }}>Details / Method</th>
                          <th style={{ padding: '12px 10px' }}>Sender</th>
                          <th style={{ padding: '12px 10px' }}>Recipient</th>
                          <th style={{ padding: '12px 10px', textAlign: 'right' }}>Withdrawal</th>
                          <th style={{ padding: '12px 10px', textAlign: 'right' }}>Deposit</th>
                          <th style={{ padding: '12px 10px', textAlign: 'right' }}>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedTransactions.map(t => (
                          <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <td style={{ padding: '10px', whiteSpace: 'nowrap', color: '#cbd5e1' }}>{t.date}</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{ 
                                background: t.method === 'Fee' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)', 
                                border: t.method === 'Fee' ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(59, 130, 246, 0.25)', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                fontSize: '0.75em', 
                                marginRight: '6px', 
                                color: t.method === 'Fee' ? '#f87171' : '#60a5fa' 
                              }}>{t.method}</span>
                              {t.details || t.description}
                            </td>
                            <td style={{ padding: '10px', color: '#cbd5e1' }}>{t.sender || '-'}</td>
                            <td style={{ padding: '10px', color: '#cbd5e1' }}>{t.recipient || '-'}</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#f87171' }}>
                              {t.withdrawal ? `-$${t.withdrawal.toFixed(2)}` : '-'}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#22c55e' }}>
                              {t.deposit ? `+$${t.deposit.toFixed(2)}` : '-'}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                              ${t.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Links Group */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '2.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '2rem', flexWrap: 'wrap' }}>
              <a 
                href="https://dashboard.stripe.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="exec-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.8rem 2.25rem',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #635bff 0%, #4338ca 100%)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 15px rgba(99, 91, 255, 0.25)',
                  transition: 'all 0.25s ease',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 91, 255, 0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(99, 91, 255, 0.25)'; }}
              >
                {/* Stripe S Icon */}
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '18px', height: '18px' }}>
                  <path d="M13.93 10.09c0-.68-.53-.94-1.42-.94-1.25 0-2.83.35-3.83.89L8 6.47c1.17-.55 2.92-.88 4.63-.88 3.51 0 5.67 1.72 5.67 4.7 0 3.73-3.13 4.96-5.26 5.56-.84.24-1.39.46-1.39.95 0 .62.62.91 1.48.91 1.4 0 3.1-.48 4.22-1.12l.68 3.59c-1.3.62-3.26.97-4.9.97-3.71 0-5.91-1.74-5.91-4.73 0-3.69 3.06-4.95 5.25-5.57.85-.24 1.39-.46 1.39-.93z"/>
                </svg>
                <span>Stripe Dashboard</span>
              </a>

              <a 
                href="https://easyweb.td.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="exec-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.8rem 2.25rem',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #008a00 0%, #005a00 100%)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 15px rgba(0, 138, 0, 0.25)',
                  transition: 'all 0.25s ease',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 138, 0, 0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 138, 0, 0.25)'; }}
              >
                {/* TD Bank Icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                </svg>
                <span>TD EasyWeb Login</span>
              </a>
            </div>

          </div>
        </div>
        {/* Google Drive Export Configuration Modal */}
        {isDriveModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(5, 12, 28, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div className="exec-card" style={{
              background: '#0e2246',
              border: '1px solid rgba(147, 197, 253, 0.25)',
              borderRadius: '16px',
              padding: '2.5rem 2rem',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              color: '#ffffff',
              textAlign: 'left'
            }}>
              <h3 style={{ margin: '0 0 0.5rem', color: '#93c5fd', fontSize: '1.4rem', fontWeight: 700 }}>
                Export to Google Drive
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 1.5rem' }}>
                Save the ledger directly to your Google Drive account. You can save it as a raw CSV file or automatically convert it into a fully editable Google Sheets spreadsheet.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                {/* Client ID field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Google OAuth Client ID</label>
                  <input
                    type="text"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    placeholder="Enter your client ID (e.g. 12345-abc.apps.googleusercontent.com)"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.15)',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: '1.4' }}>
                    To obtain a Client ID, create an OAuth 2.0 Client Credentials configuration in the <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Google Cloud Console</a> with the Web application type, and add <code>http://localhost:5174</code> (or your deployment origin) to authorized Javascript origins.
                  </span>
                </div>

                {/* Scope selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Export Data Range</label>
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '4px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="exportScope"
                        checked={exportScope === 'filtered'}
                        onChange={() => setExportScope('filtered')}
                        style={{ cursor: 'pointer' }}
                      />
                      Filtered Transactions ({filteredAndSortedTransactions.length})
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="exportScope"
                        checked={exportScope === 'all'}
                        onChange={() => setExportScope('all')}
                        style={{ cursor: 'pointer' }}
                      />
                      All Transactions ({rawTransactions.length})
                    </label>
                  </div>
                </div>

                {/* Format selection */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="convertToSheet"
                    checked={convertToSheet}
                    onChange={(e) => setConvertToSheet(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="convertToSheet" style={{ cursor: 'pointer' }}>
                    Convert file to Google Sheets spreadsheet format
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsDriveModalOpen(false)}
                  className="exec-btn exec-btn-secondary"
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.88rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                  disabled={driveLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteGoogleDriveExport}
                  className="exec-btn exec-btn-primary"
                  style={{
                    padding: '8px 24px',
                    fontSize: '0.88rem',
                    borderRadius: '999px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  disabled={driveLoading}
                >
                  {driveLoading ? 'Exporting...' : 'Authenticate & Export'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
