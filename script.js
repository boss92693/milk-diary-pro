// ================= DATA STORAGE & INITIALIZATION =================
let appSettings = JSON.parse(localStorage.getItem('milk_settings')) || { isSetupComplete: false };
let customers = JSON.parse(localStorage.getItem('milk_customers')) || [];
let entries = JSON.parse(localStorage.getItem('milk_entries')) || [];
let transactions = JSON.parse(localStorage.getItem('milk_transactions')) || [];
let expenses = JSON.parse(localStorage.getItem('milk_expenses')) || []; // NEW: For Expense Tracker

let currentHistoryCustomerId = null;
let currentShift = 'Morning';
let milkChartInstance = null; // NEW: For Chart.js

function saveData() {
    localStorage.setItem('milk_settings', JSON.stringify(appSettings));
    localStorage.setItem('milk_customers', JSON.stringify(customers));
    localStorage.setItem('milk_entries', JSON.stringify(entries));
    localStorage.setItem('milk_transactions', JSON.stringify(transactions));
    localStorage.setItem('milk_expenses', JSON.stringify(expenses)); // Save expenses
}

function getTodayDate() {
    const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
}
function getCurrentMonth() { return getTodayDate().slice(0, 7); }

function showToast(message) {
    let toast = document.getElementById("toast");
    toast.innerText = message;
    toast.className = "toast show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

// ================= SETUP & LOAD =================
document.addEventListener("DOMContentLoaded", () => {
    if (!appSettings.isSetupComplete) {
        document.getElementById('setupScreen').style.display = "flex";
        document.getElementById('appHeader').style.display = "none";
    } else loadApp();
});

function completeSetup() {
    let name = document.getElementById('setupDairyName').value;
    let cowP = document.getElementById('setupCowPrice').value;
    let buffP = document.getElementById('setupBuffaloPrice').value;
    if(!name || !cowP || !buffP) { alert("Sari details bharein!"); return; }
    appSettings = { isSetupComplete: true, dairyName: name, cowPrice: parseFloat(cowP), buffaloPrice: parseFloat(buffP) };
    saveData(); document.getElementById('setupScreen').style.display = "none"; loadApp();
}

function loadApp() {
    document.getElementById('appHeader').style.display = "block";
    document.getElementById('bottomNav').style.display = "flex";
    
    document.getElementById('displayDairyName').innerText = appSettings.dairyName;
    document.getElementById('dashCowRate').innerText = appSettings.cowPrice;
    document.getElementById('dashBuffRate').innerText = appSettings.buffaloPrice;
    
    document.getElementById('setDairyName').innerText = appSettings.dairyName;
    document.getElementById('setCowPrice').innerText = appSettings.cowPrice;
    document.getElementById('setBuffPrice').innerText = appSettings.buffaloPrice;

    updateDefaultPriceLabel('add');
    
    // Set default dates
    document.getElementById('dashMonthPicker').value = getCurrentMonth();
    document.getElementById('entryDate').value = getTodayDate();
    document.getElementById('paymentDate').value = getTodayDate();
    document.getElementById('expenseDate').value = getTodayDate();
    document.getElementById('expenseMonthPicker').value = getCurrentMonth();
    
    // Event Listeners
    document.getElementById('dashMonthPicker').addEventListener('change', updateDashboard);
    document.getElementById('entryDate').addEventListener('change', renderEntryScreen);
    document.getElementById('expenseMonthPicker').addEventListener('change', renderExpenses);
    
    // Default tab
    switchTab('dashboardScreen', 'Dashboard', document.querySelector('.nav-item.active'));
}

function switchTab(screenId, title, element) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    element.classList.add('active');
    document.getElementById('headerTitle').innerText = title;


    if(screenId === 'dashboardScreen') { updateDashboard(); updateChart(); }
    if(screenId === 'customerScreen') { renderCustomers(); updateDefaultPriceLabel('add'); }
    if(screenId === 'entryScreen') renderEntryScreen();
    if(screenId === 'ledgerScreen') renderLedgerScreen();
    if(screenId === 'expenseScreen') renderExpenses();
}

// ================= DASHBOARD & CHARTS =================
function updateDashboard() {
    let today = getTodayDate();
    let selectedMonth = document.getElementById('dashMonthPicker').value;
    let todayMilk = 0, todayEarning = 0, monthMilk = 0, monthEarning = 0, monthExpense = 0;

    // Calculate Earnings
    entries.forEach(entry => {
        let totalQty = (parseFloat(entry.mQty) || 0) + (parseFloat(entry.eQty) || 0);
        let earning = totalQty * (parseFloat(entry.price) || 0);

        if (entry.date === today) { todayMilk += totalQty; todayEarning += earning; }
        if (entry.date.startsWith(selectedMonth)) { monthMilk += totalQty; monthEarning += earning; }
    });

    // Calculate Expenses
    expenses.forEach(exp => {
        if(exp.date.startsWith(selectedMonth)) { monthExpense += parseFloat(exp.amount); }
    });

    // Update UI
    document.getElementById('dashTodayMilk').innerText = todayMilk;
    document.getElementById('dashTodayEarning').innerText = todayEarning;
    document.getElementById('dashMonthEarning').innerText = monthEarning;
    document.getElementById('dashMonthExpense').innerText = monthExpense;
    
    // Net Profit Calculation
    let netProfit = monthEarning - monthExpense;
    let profitEl = document.getElementById('dashNetProfit');
    profitEl.innerText = netProfit;
    profitEl.style.color = netProfit >= 0 ? "var(--success)" : "var(--danger)";
    
    // Graph ko bhi selected month ke hisaab se update karo
    if(document.getElementById('milkChart')) {
        updateChart();
    }
}

function updateChart() {
    const ctx = document.getElementById('milkChart').getContext('2d');
    let selectedMonth = document.getElementById('dashMonthPicker').value; // e.g. "2026-08"

    // Find how many days in the selected month
    let [year, month] = selectedMonth.split('-');
    let daysInMonth = new Date(year, month, 0).getDate(); 

    let dates = [];
    let amounts = [];

    // 1 tarikh se mahine ke aakhiri din tak ka loop
    for (let i = 1; i <= daysInMonth; i++) {
        let day = i < 10 ? '0' + i : i;
        let dateStr = `${selectedMonth}-${day}`; // "YYYY-MM-DD"

        // Label for graph (e.g., "1 Aug")
        let d = new Date(year, month - 1, i);
        dates.push(i + " " + d.toLocaleString('default', { month: 'short' }));

        let dailyMilk = 0;
        entries.forEach(e => {
            if (e.date === dateStr) dailyMilk += (parseFloat(e.mQty) || 0) + (parseFloat(e.eQty) || 0);
        });
        amounts.push(dailyMilk);
    }

    if (milkChartInstance) milkChartInstance.destroy(); // Clear old chart
    
    // Update graph heading dynamically
    let monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
    let chartTitleEl = document.getElementById('chartTitle');
    if (chartTitleEl) chartTitleEl.innerText = `${monthName} Milk Collection`;

    milkChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Milk Collected (L)',
                data: amounts,
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } }, 
            scales: { 
                x: { ticks: { maxTicksLimit: 10 } }, // Mobile me bheed na ho isliye max 10 dates dikhayega
                y: { beginAtZero: true } 
            } 
        }
    });
}


// ================= EXPENSE TRACKER =================
function addExpense() {
    let date = document.getElementById('expenseDate').value;
    let cat = document.getElementById('expenseCategory').value;
    let note = document.getElementById('expenseNote').value;
    let amt = document.getElementById('expenseAmount').value;
    
    if(!amt || amt <= 0) { alert("Please enter a valid amount!"); return; }
    
    expenses.push({ id: Date.now(), date: date, category: cat, note: note, amount: parseFloat(amt) });
    saveData();
    
    document.getElementById('expenseNote').value = '';
    document.getElementById('expenseAmount').value = '';
    showToast("Kharcha Added!");
    renderExpenses(); updateDashboard();
}

function renderExpenses() {
    let month = document.getElementById('expenseMonthPicker').value;
    let listDiv = document.getElementById('expenseList');
    listDiv.innerHTML = '';
    
    let monthExps = expenses.filter(e => e.date.startsWith(month)).sort((a,b) => new Date(b.date) - new Date(a.date));
    
    if(monthExps.length === 0) { listDiv.innerHTML = '<p style="text-align:center; color:#6B7280;">Is mahine koi kharcha nahi hua.</p>'; return; }
    
    monthExps.forEach(exp => {
        let d = new Date(exp.date).toLocaleDateString('en-IN', {day:'2-digit', month:'short'});
        listDiv.innerHTML += `
            <div class="list-item">
                <div>
                    <div class="item-title">${exp.category} <span style="font-size:11px; font-weight:normal; color:#666;">(${d})</span></div>
                    <div class="item-sub">${exp.note || 'No details'}</div>
                </div>
                <div style="color:var(--danger); font-weight:700;">₹${exp.amount}</div>
            </div>
        `;
    });
}

// ================= CUSTOMERS =================
function updateDefaultPriceLabel(mode) {
    if(mode === 'add') {
        let type = document.getElementById('custMilkType').value;
        let p = type === 'Cow' ? appSettings.cowPrice : appSettings.buffaloPrice;
        document.getElementById('lblDefaultPrice').innerText = "₹" + p;
    }
}
function toggleCustomPrice(mode) {
    if(mode === 'add') {
        let type = document.querySelector('input[name="priceType"]:checked').value;
        document.getElementById('custCustomPrice').style.display = type === 'custom' ? 'block' : 'none';
    }
}
function addCustomer() {
    let name = document.getElementById('custName').value; let phone = document.getElementById('custPhone').value;
    let milkType = document.getElementById('custMilkType').value; let mQty = document.getElementById('custMQty').value || 0; let eQty = document.getElementById('custEQty').value || 0;
    let priceType = document.querySelector('input[name="priceType"]:checked').value;
    let defaultP = milkType === 'Cow' ? appSettings.cowPrice : appSettings.buffaloPrice;
    let price = priceType === 'custom' ? document.getElementById('custCustomPrice').value : defaultP;

    if(!name) { alert("Customer Name zaroori hai!"); return; }
    customers.push({ id: Date.now(), name: name, phone: phone, milkType: milkType, mQty: parseFloat(mQty), eQty: parseFloat(eQty), price: parseFloat(price), isActive: true });
    saveData(); document.getElementById('custName').value = ''; document.getElementById('custPhone').value = ''; document.getElementById('custMQty').value = ''; document.getElementById('custEQty').value = '';
    renderCustomers(); showToast("Customer Added!");
}

function renderCustomers() {
    let listDiv = document.getElementById('customerList'); listDiv.innerHTML = '';
    if (customers.length === 0) { listDiv.innerHTML = '<p style="text-align:center; color:#6B7280;">No customers yet.</p>'; return; }
    customers.forEach(cust => {
        let statusBadge = cust.isActive === false ? '<span style="font-size:10px; background:#FEE2E2; color:#991B1B; padding:2px 5px; border-radius:4px; margin-left:8px;">⏸ Band</span>' : '';
        let milkIcon = cust.milkType === 'Cow' ? '🐄' : '🐃';
        let opacity = cust.isActive === false ? '0.5' : '1';
        listDiv.innerHTML += `
            <div class="list-item" style="opacity:${opacity}; cursor:pointer;" onclick="openEditModal(${cust.id})">
                <div><div class="item-title">${cust.name} ${statusBadge}</div><div class="item-sub">${milkIcon} ${cust.milkType} | M: ${cust.mQty}L | E: ${cust.eQty}L • ₹${cust.price}/L</div></div>
                <div style="color:var(--text-muted);">⚙️</div>
            </div>`;
    });
}

function openEditModal(id) {
    currentHistoryCustomerId = id; let cust = customers.find(c => c.id === id);
    if(cust) {
        document.getElementById('editCustName').value = cust.name; document.getElementById('editCustPhone').value = cust.phone || '';
        document.getElementById('editCustMilkType').value = cust.milkType || 'Buffalo';
        document.getElementById('editCustMQty').value = cust.mQty || 0; document.getElementById('editCustEQty').value = cust.eQty || 0;
        document.getElementById('editCustPrice').value = cust.price; document.getElementById('editCustStatus').value = cust.isActive === false ? 'inactive' : 'active';
        document.getElementById('editModal').style.display = "block";
    }
}
function closeEditModal() { document.getElementById('editModal').style.display = "none"; }
function saveEditCustomer() {
    let cust = customers.find(c => c.id === currentHistoryCustomerId);
    if(cust) {
        cust.name = document.getElementById('editCustName').value; cust.phone = document.getElementById('editCustPhone').value;
        cust.milkType = document.getElementById('editCustMilkType').value; cust.mQty = parseFloat(document.getElementById('editCustMQty').value) || 0; cust.eQty = parseFloat(document.getElementById('editCustEQty').value) || 0;
        cust.price = parseFloat(document.getElementById('editCustPrice').value); cust.isActive = document.getElementById('editCustStatus').value === 'active';
        saveData(); closeEditModal(); renderCustomers(); showToast("Profile Updated!");
    }
}
function deleteCustomer() {
    if(confirm("Delete this customer forever?")) {
        customers = customers.filter(c => c.id !== currentHistoryCustomerId); saveData(); closeEditModal(); renderCustomers(); showToast("Deleted.");
    }
}

// ================= ENTRY SCREEN =================
function switchShift(shift) {
    currentShift = shift;
    document.querySelectorAll('.shift-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab${shift}`).classList.add('active');
    document.getElementById('btnShiftText').innerText = shift; renderEntryScreen();
}

function renderEntryScreen() {
    let entryList = document.getElementById('entryCustomerList'); let selectedDate = document.getElementById('entryDate').value; entryList.innerHTML = '';
    let activeCustomers = customers.filter(c => c.isActive !== false);
    if (activeCustomers.length === 0) { entryList.innerHTML = `<p style="text-align:center; color:#6B7280; margin-top:20px;">No active customers found.</p>`; return; }

    activeCustomers.forEach(cust => {
        let entry = entries.find(e => e.date === selectedDate && e.customerId === cust.id);
        let defaultVal = currentShift === 'Morning' ? cust.mQty : cust.eQty;
        let milkIcon = cust.milkType === 'Cow' ? '🐄' : '🐃';
        let currentVal = entry ? (currentShift === 'Morning' ? entry.mQty : entry.eQty) : defaultVal;
        if(currentVal === "" || currentVal == null) currentVal = defaultVal;

        entryList.innerHTML += `
            <div class="entry-card">
                <div class="flex-between mb-2">
                    <strong style="font-size: 16px;">${cust.name} <span style="font-size:12px; font-weight:normal; color:var(--text-muted);">${milkIcon}</span></strong>
                    <span style="color:var(--success); font-weight:700;">₹${cust.price}/L</span>
                </div>
                <div>
                    <label style="font-size:13px; font-weight:600; color:var(--text-muted); margin-bottom:6px; display:block;">${currentShift} (L)</label>
                    <input type="number" step="0.25" id="entryInput_${cust.id}" value="${currentVal}" style="width: 100%; padding: 12px; border: 1.5px solid var(--border-color); border-radius: 10px; font-size: 18px; text-align: center; font-weight: 600;">
                </div>
            </div>`;
    });
}

function saveShiftEntries() {
    let selectedDate = document.getElementById('entryDate').value;
    customers.forEach(cust => {
        let inputEl = document.getElementById(`entryInput_${cust.id}`); if(!inputEl) return; 
        let enteredQty = inputEl.value === '' ? 0 : parseFloat(inputEl.value);
        let entryIndex = entries.findIndex(e => e.date === selectedDate && e.customerId === cust.id);
        
        if (entryIndex >= 0) {
            if(currentShift === 'Morning') entries[entryIndex].mQty = enteredQty;
            if(currentShift === 'Evening') entries[entryIndex].eQty = enteredQty;
            entries[entryIndex].price = cust.price; 
        } else {
            let newEntry = { date: selectedDate, customerId: cust.id, price: cust.price, mQty: 0, eQty: 0 };
            if(currentShift === 'Morning') newEntry.mQty = enteredQty;
            if(currentShift === 'Evening') newEntry.eQty = enteredQty;
            entries.push(newEntry);
        }
    });
    saveData(); updateDashboard(); showToast(`${currentShift} Entries Saved! ✓`);
}

// ================= KHATA / LEDGER SYSTEM =================
function calculateTotalBilled(custId) {
    let total = 0;
    entries.forEach(e => { if(e.customerId === custId) { total += ((parseFloat(e.mQty) || 0) + (parseFloat(e.eQty) || 0)) * parseFloat(e.price); } });
    return total;
}
function calculateTotalPaid(custId) {
    let total = 0; transactions.forEach(t => { if(t.customerId === custId) total += parseFloat(t.amount); });
    return total;
}

function renderLedgerScreen() {
    let list = document.getElementById('ledgerList'); list.innerHTML = '';
    if(customers.length === 0) { list.innerHTML = '<p style="text-align:center; color:#6B7280;">No customers.</p>'; return; }
    let totalMarketDue = 0;

    customers.forEach(cust => {
        let billed = calculateTotalBilled(cust.id); let paid = calculateTotalPaid(cust.id); let balance = billed - paid;
        let badgeHtml = '';
        if(balance > 0) { badgeHtml = `<span class="status-badge badge-due">₹${balance} Baaki</span>`; totalMarketDue += balance; } 
        else if (balance < 0) { badgeHtml = `<span class="status-badge badge-advance">₹${Math.abs(balance)} Advance</span>`; } 
        else { badgeHtml = `<span class="status-badge badge-neutral">Clear (₹0)</span>`; }

        list.innerHTML += `
            <div class="list-item" style="cursor:pointer;" onclick="openLedgerDetail(${cust.id})">
                <div><div class="item-title">${cust.name}</div><div class="item-sub">Billed: ₹${billed}</div></div>
                <div style="text-align:right;">${badgeHtml}</div>
            </div>`;
    });
    if (totalMarketDue > 0) { list.innerHTML = `<div class="card gradient-card no-print" style="text-align:center; margin-bottom:20px;"><span style="font-size:13px; opacity:0.9;">Market Me Total Baaki</span><br><strong style="font-size:26px;">₹${totalMarketDue}</strong></div>` + list.innerHTML; }
}

function openLedgerDetail(custId) {
    currentHistoryCustomerId = custId; let cust = customers.find(c => c.id === custId); if(!cust) return;
    document.getElementById('ledgerModalName').innerText = cust.name;
    document.getElementById('ledgerBillMonth').value = getCurrentMonth();
    
    let balance = calculateTotalBilled(custId) - calculateTotalPaid(custId);
    let balEl = document.getElementById('ledgerModalBalance'); let badgeEl = document.getElementById('ledgerModalBadge');
    
    if(balance > 0) { balEl.innerText = `₹${balance}`; balEl.style.color = "var(--danger)"; badgeEl.className = "status-badge badge-due"; badgeEl.innerText = "DUE (Baaki)"; } 
    else if (balance < 0) { balEl.innerText = `₹${Math.abs(balance)}`; balEl.style.color = "var(--success)"; badgeEl.className = "status-badge badge-advance"; badgeEl.innerText = "ADVANCE"; } 
    else { balEl.innerText = `₹0`; balEl.style.color = "var(--text-main)"; badgeEl.className = "status-badge badge-neutral"; badgeEl.innerText = "CLEARED"; }

    renderPaymentHistory(custId); updateBillPreview();
    document.getElementById('ledgerBillMonth').addEventListener('change', updateBillPreview);
    document.getElementById('ledgerDetailModal').style.display = "block";
}
function closeLedgerDetailModal() { document.getElementById('ledgerDetailModal').style.display = "none"; }

function savePayment() {
    let amt = document.getElementById('paymentAmount').value; let date = document.getElementById('paymentDate').value;
    if(!amt || amt <= 0) return;
    transactions.push({ id: Date.now(), customerId: currentHistoryCustomerId, date: date, amount: parseFloat(amt) });
    saveData(); document.getElementById('paymentAmount').value = ''; showToast("Payment Added!");
    openLedgerDetail(currentHistoryCustomerId); renderLedgerScreen();
}

function renderPaymentHistory(custId) {
    let listDiv = document.getElementById('paymentHistoryList'); listDiv.innerHTML = '';
    let custTrans = transactions.filter(t => t.customerId === custId).sort((a,b) => new Date(b.date) - new Date(a.date));
    if(custTrans.length === 0) { listDiv.innerHTML = '<p style="text-align:center; font-size:13px; color:var(--text-muted);">No payments yet.</p>'; return; }
    let html = '<div class="history-container">';
    custTrans.forEach(t => { let d = new Date(t.date).toLocaleDateString('en-IN', {day:'2-digit', month:'short'}); html += `<div class="history-row"><span>📅 ${d}</span><strong style="color:var(--success);">+ ₹${t.amount}</strong></div>`; });
    listDiv.innerHTML = html + '</div>';
}

function updateBillPreview() {
    let month = document.getElementById('ledgerBillMonth').value;
    let custEntries = entries.filter(e => e.customerId === currentHistoryCustomerId && e.date.startsWith(month));
    let totalMilk = 0, totalAmount = 0;
    custEntries.forEach(entry => { let qty = (parseFloat(entry.mQty) || 0) + (parseFloat(entry.eQty) || 0); totalMilk += qty; totalAmount += qty * parseFloat(entry.price); });
    
    if(totalMilk > 0) document.getElementById('ledgerBillPreview').innerHTML = `Total Milk: <strong>${totalMilk} L</strong><br>Bill Amount: <strong style="color:var(--primary); font-size:16px;">₹${totalAmount}</strong>`;
    else document.getElementById('ledgerBillPreview').innerHTML = 'Is mahine me koi entry nahi hai.';
}

// ================= PDF GENERATION (NEW) =================
function generatePDFBill() {
    let month = document.getElementById('ledgerBillMonth').value;
    let cust = customers.find(c => c.id === currentHistoryCustomerId);
    let custEntries = entries.filter(e => e.customerId === cust.id && e.date.startsWith(month)).sort((a,b) => new Date(a.date) - new Date(b.date));
    
    if(custEntries.length === 0) { alert("Generate karne ke liye koi data nahi hai!"); return; }

    let totalMilk = 0, monthBill = 0;
    let tableRows = '';
    
    custEntries.forEach(entry => {
        let m = parseFloat(entry.mQty) || 0; let e = parseFloat(entry.eQty) || 0;
        let totalQty = m + e;
        let dayTotal = totalQty * parseFloat(entry.price);
        totalMilk += totalQty; monthBill += dayTotal;
        let d = entry.date.split('-')[2];
        tableRows += `<tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px;">${d}</td>
            <td style="padding: 8px; text-align:center;">${m > 0 ? m : '-'}</td>
            <td style="padding: 8px; text-align:center;">${e > 0 ? e : '-'}</td>
            <td style="padding: 8px; text-align:center;">${totalQty}</td>
            <td style="padding: 8px; text-align:right;">₹${dayTotal}</td>
        </tr>`;
    });

    let netBalance = calculateTotalBilled(cust.id) - calculateTotalPaid(cust.id);
    let balText = netBalance > 0 ? `Total Baaki (Due): ₹${netBalance}` : netBalance < 0 ? `Advance Jama: ₹${Math.abs(netBalance)}` : "Hisaab Clear Hai (₹0)";
    
    let d = new Date(month + "-01");
    let monthName = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    let pdfHtml = `
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="color:#4F46E5; margin:0;">${appSettings.dairyName}</h1>
            <p style="margin:5px 0 0 0; color:#555;">Milk Bill - ${monthName}</p>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
            <div><strong>Customer Name:</strong> ${cust.name}<br><strong>Phone:</strong> ${cust.phone || 'N/A'}</div>
            <div style="text-align:right;"><strong>Milk Type:</strong> ${cust.milkType}</div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size:14px; margin-bottom:20px;">
            <thead>
                <tr style="background:#f9fafb; border-bottom:2px solid #ddd;">
                    <th style="padding:10px; text-align:left;">Date</th>
                    <th style="padding:10px; text-align:center;">Morning (L)</th>
                    <th style="padding:10px; text-align:center;">Evening (L)</th>
                    <th style="padding:10px; text-align:center;">Total (L)</th>
                    <th style="padding:10px; text-align:right;">Amount (₹)</th>
                </tr>
            </thead>
            <tbody>${tableRows}</tbody>
        </table>
        <div style="border-top: 2px solid #000; padding-top: 15px; margin-top: 20px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:16px;"><span>Total Milk:</span> <strong>${totalMilk} L</strong></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:16px;"><span>Is Mahine Ka Bill:</span> <strong>₹${monthBill}</strong></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:18px; color:${netBalance > 0 ? '#d93025' : '#188038'};">
                <span>Final Status:</span> <strong>${balText}</strong>
            </div>
        </div>
        <p style="text-align:center; font-size:12px; color:#888; margin-top:30px;">Thanks for purchasing milk from here, ${appSettings.dairyName}</p>

       
    `;

    let container = document.getElementById('pdfBillContainer');
    container.innerHTML = pdfHtml;
    container.parentElement.style.display = 'block'; // Make visible to html2pdf

    let opt = {
        margin:       0.5,
        filename:     `${cust.name.replace(/\s+/g, '_')}_Bill_${monthName}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(container).save().then(() => {
        container.parentElement.style.display = 'none'; // Hide again
        showToast("PDF Downloaded!");
    });
}

function generateAndShareBill() {
    let month = document.getElementById('ledgerBillMonth').value; let cust = customers.find(c => c.id === currentHistoryCustomerId);
    let custEntries = entries.filter(e => e.customerId === cust.id && e.date.startsWith(month));
    let totalMilk = 0, monthBill = 0;
    custEntries.forEach(entry => { let qty = (parseFloat(entry.mQty) || 0) + (parseFloat(entry.eQty) || 0); totalMilk += qty; monthBill += qty * parseFloat(entry.price); });
    if(totalMilk === 0) { alert("Is mahine ka koi bill nahi hai!"); return; }

    let netBalance = calculateTotalBilled(cust.id) - calculateTotalPaid(cust.id);
    let d = new Date(month + "-01"); let monthName = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    let milkIcon = cust.milkType === 'Cow' ? '🐄' : '🐃';
    
    let msg = `Hello ${cust.name},\n\n*${appSettings.dairyName}* Milk Bill - *${monthName}*\n\n${milkIcon} Is Mahine ka Milk: *${totalMilk} L*\n💰 Is Mahine ka Bill: *₹${monthBill}*\n\n`;
    if(netBalance > 0) msg += `🛑 *total jo apko dena hai : ₹${netBalance} hai.*\n\nPlease clear the dues. Thank you!`;
    else if(netBalance < 0) msg += `✅ *Aapka Total Advance ₹${Math.abs(netBalance)} jama hai.*`;
    else msg += `✅ *Aapka pichla saara hisaab clear hai.*`;
    
    msg += `\n\n_Note: Pura detail dekhne ke liye is message ke saath bheji gayi PDF file check karein._`;

    let phone = cust.phone;
    let url = phone && phone.length === 10 ? `https://api.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(msg)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

// ================= MILK HISTORY (Old modal for Edit Profile) =================
function openHistoryModal() {
    closeEditModal(); document.getElementById('historyCustomerName').innerText = customers.find(c => c.id === currentHistoryCustomerId).name;
    document.getElementById('historyMonthPicker').value = getCurrentMonth(); document.getElementById('historyModal').style.display = "block"; renderCustomerHistory();
}
function closeHistoryModal() { document.getElementById('historyModal').style.display = "none"; }
function renderCustomerHistory() {
    let selectedMonth = document.getElementById('historyMonthPicker').value; let listDiv = document.getElementById('historyDataList'); listDiv.innerHTML = '';
    let customerEntries = entries.filter(e => e.customerId === currentHistoryCustomerId && e.date.startsWith(selectedMonth)).sort((a, b) => new Date(a.date) - new Date(b.date));
    if(customerEntries.length === 0) { listDiv.innerHTML = '<p style="text-align:center; padding:15px; color:#6B7280;">No entries.</p>'; return; }
    let totalM = 0, totalE = 0;
    customerEntries.forEach(entry => {
        let mQty = parseFloat(entry.mQty) || 0; let eQty = parseFloat(entry.eQty) || 0; totalM += mQty; totalE += eQty;
        let day = entry.date.split('-')[2]; listDiv.innerHTML += `<div class="history-row"><span style="font-weight:700; width:30px; color:var(--text-muted);">${day}</span><span style="flex:1; text-align:center;">M: ${mQty > 0 ? mQty : '-'}</span><span style="flex:1; text-align:right;">E: ${eQty > 0 ? eQty : '-'}</span></div>`;
    });
    listDiv.innerHTML += `<div class="history-row" style="border-top: 2px solid #ccc; font-weight:700; margin-top:5px;"><span style="width:30px;">Total</span><span style="flex:1; text-align:center;">M: ${totalM}</span><span style="flex:1; text-align:right;">E: ${totalE}</span></div>`;
}

// ================= BACKUP & SETTINGS =================
function exportData() {
    let dataStr = JSON.stringify({ milk_settings: appSettings, milk_customers: customers, milk_entries: entries, milk_transactions: transactions, milk_expenses: expenses });
    let link = document.createElement('a');
    link.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr));
    link.setAttribute('download', 'DairyBackup_' + getTodayDate() + '.json');
    link.click(); showToast("Backup Saved!");
}

function importData(event) {
    let file = event.target.files[0]; if (!file) return;
    let reader = new FileReader();
    reader.onload = function(e) {
        try {
            let data = JSON.parse(e.target.result);
            if(data.milk_customers) {
                if(confirm("Warning: Purana data delete ho jayega. Continue?")) {
                    appSettings = data.milk_settings || { isSetupComplete: true, dairyName: "My Dairy", cowPrice: 50, buffaloPrice: 65 };
                    customers = data.milk_customers; entries = data.milk_entries; transactions = data.milk_transactions || [];
                    expenses = data.milk_expenses || [];
                    saveData(); loadApp(); showToast("Data Imported!");
                }
            } else alert("Invalid Backup File!");
        } catch (err) { alert("Error reading file."); }
        event.target.value = '';
    };
    reader.readAsText(file);
}

function resetAppData() {
    if (confirm("Kya aap sach me saara data delete karna chahte hain?")) {
        if (confirm("Aakhri warning! Sab kuch delete ho jayega. Continue?")) { localStorage.clear(); location.reload(); }
    }
}

function openEditDairyModal() {
    document.getElementById('editDairyNameInput').value = appSettings.dairyName; document.getElementById('editCowPriceInput').value = appSettings.cowPrice;
    document.getElementById('editBuffPriceInput').value = appSettings.buffaloPrice; document.getElementById('editDairyModal').style.display = "block";
}
function closeEditDairyModal() { document.getElementById('editDairyModal').style.display = "none"; }
function saveDairyInfo() {
    let name = document.getElementById('editDairyNameInput').value; let cowP = document.getElementById('editCowPriceInput').value; let buffP = document.getElementById('editBuffPriceInput').value;
    if(!name || !cowP || !buffP) { alert("Please fill all details!"); return; }
    appSettings.dairyName = name; appSettings.cowPrice = parseFloat(cowP); appSettings.buffaloPrice = parseFloat(buffP);
    saveData(); 
    document.getElementById('displayDairyName').innerText = appSettings.dairyName; document.getElementById('dashCowRate').innerText = appSettings.cowPrice; document.getElementById('dashBuffRate').innerText = appSettings.buffaloPrice;
    document.getElementById('setDairyName').innerText = appSettings.dairyName; document.getElementById('setCowPrice').innerText = appSettings.cowPrice; document.getElementById('setBuffPrice').innerText = appSettings.buffaloPrice;
    closeEditDairyModal(); showToast("Dairy Info Updated!");
}
