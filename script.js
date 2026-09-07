// ================= 1. SECURITY & SYSTEM CORE =================
const SECRET_SALT = "M1lk@D1ary#Pr0_Secure!2026";
let securityData = JSON.parse(localStorage.getItem('milk_security')) || null;
let currentLang = localStorage.getItem('milk_lang') || 'en';
if(currentLang === 'hg') currentLang = 'en'; // Hinglish hata diya gaya hai

let appSettings = JSON.parse(localStorage.getItem('milk_settings')) || { isSetupComplete: false };
let customers = JSON.parse(localStorage.getItem('milk_customers')) || [];
let entries = JSON.parse(localStorage.getItem('milk_entries')) || [];
let transactions = JSON.parse(localStorage.getItem('milk_transactions')) || [];
let expenses = JSON.parse(localStorage.getItem('milk_expenses')) || [];

let currentHistoryCustomerId = null, currentShift = 'Morning', milkChartInstance = null;

function getTodayDate() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().split('T')[0]; }
function getCurrentMonth() { return getTodayDate().slice(0, 7); }
function showToast(msg) { let t = document.getElementById("toast"); t.innerText = msg; t.className = "toast show"; setTimeout(() => { t.className = t.className.replace("show", ""); }, 3000); }

function saveData() {
    localStorage.setItem('milk_settings', JSON.stringify(appSettings)); localStorage.setItem('milk_customers', JSON.stringify(customers));
    localStorage.setItem('milk_entries', JSON.stringify(entries)); localStorage.setItem('milk_transactions', JSON.stringify(transactions));
    localStorage.setItem('milk_expenses', JSON.stringify(expenses)); localStorage.setItem('milk_lang', currentLang);
}

function getHash(str) { let hash = 0, comb = str + SECRET_SALT; for (let i = 0; i < comb.length; i++) { hash = ((hash << 5) - hash) + comb.charCodeAt(i); hash |= 0; } return hash.toString(16); }
function saveSecurity() { securityData.checksum = getHash(securityData.deviceID + securityData.installDate + securityData.expiryDate + securityData.activationCount); localStorage.setItem('milk_security', JSON.stringify(securityData)); }

// ================= 2. i18n (DICTIONARY SYSTEM) =================
const dict = {
    en: { app_lock: "App Lock", enter_pin: "Enter your 4-digit PIN", btn_unlock: "Unlock", phone_reset: "Phone Reset?", btn_restore: "📥 Restore Backup", dash_rates: "Cow: ₹{cow}/L | Buffalo: ₹{buff}/L", dash_total_milk: "Total Milk", dash_est_earning: "Est. Earning", dash_monthly_profit: "Monthly Profit", dash_total_earning: "Total Earning", dash_total_kharcha: "Total Expense", dash_net_profit: "Net Profit:", dash_chart_title: "Milk Collection Trend", cust_add_title: "Add Customer", cust_name_label: "Name", cust_phone_label: "Phone", cust_type_label: "Type", cust_morning: "Morning (L)", cust_evening: "Evening (L)", cust_price_setting: "Price", cust_default: "Default", cust_custom: "Custom", cust_btn_add: "+ Add", cust_list_title: "Customer List", entry_title: "Daily Entry", entry_morning: "☀️ Morning", entry_evening: "🌙 Evening", entry_btn_save: "Save", ledger_title: "Customer Khata", ledger_desc: "Check advances and dues.", exp_title: "Expense Tracker", exp_btn_add: "➖ Add Expense", exp_history: "History", set_pro_title: "App Subscription & Security", set_lock_title: "App Lock (PIN)", set_btn_activate: "Activate Plan", set_dairy_info: "Dairy Info", set_btn_edit: "✏️ Edit", set_backup_title: "Backup", set_btn_export: "📤 Export", set_btn_import: "📥 Import", set_danger: "Danger Zone", set_btn_reset: "🗑️ Erase All", modal_balance: "Current Balance", modal_add_payment: "Add Payment", modal_btn_save_pay: "💰 Save", modal_gen_bill: "Generate Bill", modal_pay_history: "Payment History", nav_home: "Home", nav_clients: "Clients", nav_entry: "Entry", nav_khata: "Khata", nav_expense: "Expense", nav_settings: "Settings" },
    hi: { app_lock: "ऐप लॉक", enter_pin: "अपना 4 अंकों का पिन डालें", btn_unlock: "अनलॉक", phone_reset: "फोन रीसेट हो गया?", btn_restore: "📥 बैकअप डालें", dash_rates: "गाय: ₹{cow}/L | भैंस: ₹{buff}/L", dash_total_milk: "कुल दूध", dash_est_earning: "अनुमानित आय", dash_monthly_profit: "मासिक लाभ", dash_total_earning: "कुल आय", dash_total_kharcha: "कुल खर्च", dash_net_profit: "शुद्ध लाभ:", dash_chart_title: "मासिक दूध का ट्रेंड", cust_add_title: "ग्राहक जोड़ें", cust_name_label: "नाम", cust_phone_label: "फोन", cust_type_label: "प्रकार", cust_morning: "सुबह (L)", cust_evening: "शाम (L)", cust_price_setting: "कीमत", cust_default: "डिफ़ॉल्ट", cust_custom: "कस्टम", cust_btn_add: "+ जोड़ें", cust_list_title: "ग्राहक सूची", entry_title: "दैनिक प्रविष्टि", entry_morning: "☀️ सुबह", entry_evening: "🌙 शाम", entry_btn_save: "सेव", ledger_title: "बहीखाता", ledger_desc: "बकाया और एडवांस देखें।", exp_title: "खर्च (Tracker)", exp_btn_add: "➖ खर्च जोड़ें", exp_history: "खर्च का इतिहास", set_pro_title: "ऐप एक्टिवेशन", set_lock_title: "ऐप लॉक (PIN)", set_btn_activate: "प्लान एक्टिवेट करें", set_dairy_info: "डेयरी जानकारी", set_btn_edit: "✏️ एडिट", set_backup_title: "बैकअप", set_btn_export: "📤 निर्यात", set_btn_import: "📥 आयात", set_danger: "खतरनाक ज़ोन", set_btn_reset: "🗑️ ऐप रीसेट", modal_balance: "वर्तमान शेष", modal_add_payment: "भुगतान जोड़ें", modal_btn_save_pay: "💰 सेव करें", modal_gen_bill: "बिल बनाएं", modal_pay_history: "भुगतान इतिहास", nav_home: "होम", nav_clients: "ग्राहक", nav_entry: "प्रविष्टि", nav_khata: "खाता", nav_expense: "खर्च", nav_settings: "सेटिंग्स" }
};
function changeLanguage() { currentLang = document.getElementById('langSelect').value; saveData(); applyLanguage(); }
function applyLanguage() {
    document.getElementById('langSelect').value = currentLang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        let text = dict[currentLang][el.getAttribute('data-i18n')];
        if(text && el.getAttribute('data-i18n') === 'dash_rates') text = text.replace('{cow}', appSettings.cowPrice).replace('{buff}', appSettings.buffaloPrice);
        if(text) el.innerText = text;
    });
}
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); document.getElementById('darkModeBtn').innerText = document.body.classList.contains('dark-mode') ? "☀️" : "🌙"; }

// ================= 3. SUBSCRIPTION & INIT LOGIC =================
document.addEventListener("DOMContentLoaded", () => {
    let t = getTodayDate();
    
    if(!securityData) { 
        let ed = new Date(t); ed.setDate(ed.getDate()+60);
        securityData = { deviceID: 'MD-'+Math.random().toString(36).substr(2,6).toUpperCase(), installDate: t, lastEntryDate: t, appPIN: null, isLockEnabled: false, expiryDate: ed.toISOString().split('T')[0], activationCount: 0 }; 
        saveSecurity(); 
    }
    if(securityData.activationCount === undefined) {
        securityData.activationCount = 0;
        securityData.expiryDate = securityData.isActivated ? "LIFETIME" : (function(){ let d=new Date(securityData.installDate); d.setDate(d.getDate()+60); return d.toISOString().split('T')[0]; })();
        saveSecurity();
    }
    if(securityData.checksum !== getHash(securityData.deviceID+securityData.installDate+securityData.expiryDate+securityData.activationCount)) { alert("⚠️ Tampering Detected! Trial Reset."); securityData.expiryDate="2000-01-01"; saveSecurity(); }
    if(t < securityData.lastEntryDate) alert("⚠️ Date Manipulation Detected!"); else { securityData.lastEntryDate = t; saveSecurity(); }

    if(!appSettings.isSetupComplete) { document.getElementById('setupScreen').style.display = "flex"; document.getElementById('appHeader').style.display = "none"; }
    else if(securityData.isLockEnabled && securityData.appPIN) { document.getElementById('lockScreen').style.display = "flex"; }
    else { loadApp(); }
});

function verifyAppLock() { if(document.getElementById('pinInput').value === securityData.appPIN) { document.getElementById('lockScreen').style.display = "none"; document.getElementById('pinInput').value = ""; loadApp(); } else { alert("❌ Incorrect PIN"); document.getElementById('pinInput').value = ""; } }
function showForgotPin() { if(!securityData.securityQuestion) return alert("Security question set nahi hai!"); document.getElementById('pinEntryArea').style.display = "none"; document.getElementById('forgotPinArea').style.display = "block"; document.getElementById('displaySecQuestion').innerText = securityData.securityQuestion; }
function cancelForgotPin() { document.getElementById('pinEntryArea').style.display = "block"; document.getElementById('forgotPinArea').style.display = "none"; document.getElementById('secAnswerInput').value = ""; }
function verifySecurityAnswer() { let a = document.getElementById('secAnswerInput').value.trim().toLowerCase(), c = (securityData.securityAnswer||"").trim().toLowerCase(); if(a === c && a) { securityData.isLockEnabled = false; securityData.appPIN = null; saveSecurity(); alert("✅ Correct! App unlocked. Please setup new PIN."); document.getElementById('lockScreen').style.display = "none"; document.getElementById('secAnswerInput').value = ""; cancelForgotPin(); loadApp(); } else alert("❌ Incorrect Answer!"); }

// UPDATED LOADAPP() WITH WARNING LOGIC
function loadApp() {
    document.getElementById('appHeader').style.display = "flex"; document.getElementById('bottomNav').style.display = "flex";
    document.getElementById('displayDairyName').innerText = appSettings.dairyName; document.getElementById('setDairyName').innerText = appSettings.dairyName;
    document.getElementById('dashCowRate').innerText = appSettings.cowPrice; document.getElementById('setCowPrice').innerText = appSettings.cowPrice;
    document.getElementById('dashBuffRate').innerText = appSettings.buffaloPrice; document.getElementById('setBuffPrice').innerText = appSettings.buffaloPrice;
    document.getElementById('dashMonthPicker').value = getCurrentMonth(); document.getElementById('entryDate').value = getTodayDate();
    document.getElementById('paymentDate').value = getTodayDate(); document.getElementById('expenseDate').value = getTodayDate(); document.getElementById('expenseMonthPicker').value = getCurrentMonth();
    document.getElementById('dashMonthPicker').addEventListener('change', updateDashboard); document.getElementById('entryDate').addEventListener('change', renderEntryScreen); document.getElementById('expenseMonthPicker').addEventListener('change', renderExpenses);
    
    applyLanguage(); updateSettingsUI(); 
    
    if (securityData.expiryDate !== "LIFETIME") {
        let diffDays = Math.ceil((new Date(securityData.expiryDate) - new Date(getTodayDate())) / (1000*60*60*24));
        
        if (diffDays < 0) {
            alert("⚠️ Your subscription has expired! Please activate a plan to continue using the app.");
            switchTab('backupScreen', 'Settings', document.querySelectorAll('.nav-item')[5]); 
        } else {
            switchTab('dashboardScreen', 'Dashboard', document.querySelector('.nav-item.active')); 
            if (diffDays <= 5 && diffDays >= 0) {
                document.getElementById('warningDaysLeft').innerText = diffDays;
                document.getElementById('expiryWarningModal').style.display = "flex";
            }
        }
    } else { 
        switchTab('dashboardScreen', 'Dashboard', document.querySelector('.nav-item.active')); 
    }
}
function completeSetup() { let n=document.getElementById('setupDairyName').value, c=document.getElementById('setupCowPrice').value, b=document.getElementById('setupBuffaloPrice').value; if(!n||!c||!b) return alert("Sari details bharein!"); appSettings = { isSetupComplete: true, dairyName: n, cowPrice: parseFloat(c), buffaloPrice: parseFloat(b) }; saveData(); document.getElementById('setupScreen').style.display="none"; loadApp(); }

function switchTab(id, title, el) {
    if (securityData.expiryDate !== "LIFETIME" && getTodayDate() > securityData.expiryDate && id !== 'backupScreen') return alert("⚠️ Plan Expired! Please activate from settings first.");
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    document.getElementById(id).classList.add('active'); el.classList.add('active');
    if(id==='dashboardScreen') { updateDashboard(); updateChart(); } if(id==='customerScreen') { renderCustomers(); updateDefaultPriceLabel('add'); }
    if(id==='entryScreen') renderEntryScreen(); if(id==='ledgerScreen') renderLedgerScreen(); if(id==='expenseScreen') renderExpenses();
}

// ================= 4. DASHBOARD & FEATURES =================
function updateDashboard() { let t=getTodayDate(), m=document.getElementById('dashMonthPicker').value, tM=0, tE=0, mM=0, mE=0, mExp=0; entries.forEach(e => { let q=(parseFloat(e.mQty)||0)+(parseFloat(e.eQty)||0), a=q*(parseFloat(e.price)||0); if(e.date===t){tM+=q; tE+=a;} if(e.date.startsWith(m)){mM+=q; mE+=a;} }); expenses.forEach(e => { if(e.date.startsWith(m)) mExp+=parseFloat(e.amount); }); document.getElementById('dashTodayMilk').innerText = tM; document.getElementById('dashTodayEarning').innerText = tE; document.getElementById('dashMonthEarning').innerText = mE; document.getElementById('dashMonthExpense').innerText = mExp; let np = mE - mExp; document.getElementById('dashNetProfit').innerText = np; document.getElementById('dashNetProfit').style.color = np>=0?"var(--success)":"var(--danger)"; if(document.getElementById('milkChart')) updateChart(); applyLanguage(); }
function updateChart() { const ctx = document.getElementById('milkChart').getContext('2d'); let m=document.getElementById('dashMonthPicker').value, [yr, mo]=m.split('-'), days=new Date(yr,mo,0).getDate(), dates=[], amounts=[]; for(let i=1;i<=days;i++){ dates.push(i); let daily=0, dStr=`${m}-${i<10?'0'+i:i}`; entries.forEach(e=>{if(e.date===dStr)daily+=(parseFloat(e.mQty)||0)+(parseFloat(e.eQty)||0);}); amounts.push(daily); } if(milkChartInstance) milkChartInstance.destroy(); milkChartInstance = new Chart(ctx, { type: 'line', data: { labels: dates, datasets: [{ label: 'Milk (L)', data: amounts, borderColor: '#4F46E5', backgroundColor: 'rgba(79, 70, 229, 0.1)', borderWidth: 2, fill: true, tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } }); }

function addExpense() { let d=document.getElementById('expenseDate').value, c=document.getElementById('expenseCategory').value, n=document.getElementById('expenseNote').value, a=document.getElementById('expenseAmount').value; if(!a||a<=0) return alert("Valid amount enter karein"); expenses.push({ id: Date.now(), date: d, category: c, note: n, amount: parseFloat(a) }); saveData(); document.getElementById('expenseNote').value=''; document.getElementById('expenseAmount').value=''; showToast("Kharcha Added!"); renderExpenses(); updateDashboard(); }
function renderExpenses() { let m=document.getElementById('expenseMonthPicker').value, div=document.getElementById('expenseList'); div.innerHTML=''; let me=expenses.filter(e=>e.date.startsWith(m)).sort((a,b)=>new Date(b.date)-new Date(a.date)); if(!me.length) return div.innerHTML='<p class="text-center text-muted">No expenses.</p>'; me.forEach(e => div.innerHTML += `<div class="list-item"><div><div class="item-title">${e.category} <span style="font-size:11px; font-weight:normal; color:var(--text-muted);">(${e.date})</span></div><div class="item-sub">${e.note||'No details'}</div></div><div class="text-danger" style="font-weight:700;">₹${e.amount}</div></div>`); }

function updateDefaultPriceLabel(m) { if(m==='add') document.getElementById('lblDefaultPrice').innerText = "₹" + (document.getElementById('custMilkType').value==='Cow'?appSettings.cowPrice:appSettings.buffaloPrice); }
function toggleCustomPrice(m) { if(m==='add') document.getElementById('custCustomPrice').style.display = document.querySelector('input[name="priceType"]:checked').value==='custom'?'block':'none'; }
function addCustomer() { let n=document.getElementById('custName').value, p=document.getElementById('custPhone').value, t=document.getElementById('custMilkType').value, mQ=document.getElementById('custMQty').value||0, eQ=document.getElementById('custEQty').value||0, pr = document.querySelector('input[name="priceType"]:checked').value==='custom' ? document.getElementById('custCustomPrice').value : (t==='Cow'?appSettings.cowPrice:appSettings.buffaloPrice); if(!n) return alert("Customer Name zaroori hai!"); customers.push({ id: Date.now(), name: n, phone: p, milkType: t, mQty: parseFloat(mQ), eQty: parseFloat(eQ), price: parseFloat(pr), isActive: true }); saveData(); document.getElementById('custName').value=''; document.getElementById('custPhone').value=''; renderCustomers(); showToast("Added!"); }
function renderCustomers() { let div=document.getElementById('customerList'); div.innerHTML=''; customers.forEach(c => div.innerHTML += `<div class="list-item" style="opacity:${c.isActive===false?'0.5':'1'}; cursor:pointer;" onclick="openEditModal(${c.id})"><div><div class="item-title">${c.name} ${c.isActive===false?'<span class="status-badge badge-due">Inactive</span>':''}</div><div class="item-sub">${c.milkType==='Cow'?'🐄':'🐃'} ${c.milkType} | M: ${c.mQty}L | E: ${c.eQty}L • ₹${c.price}/L</div></div><div style="color:var(--text-muted);">⚙️</div></div>`); }
function openEditModal(id) { currentHistoryCustomerId=id; let c=customers.find(x=>x.id===id); if(c) { document.getElementById('editCustName').value=c.name; document.getElementById('editCustPhone').value=c.phone||''; document.getElementById('editCustMilkType').value=c.milkType; document.getElementById('editCustMQty').value=c.mQty; document.getElementById('editCustEQty').value=c.eQty; document.getElementById('editCustPrice').value=c.price; document.getElementById('editCustStatus').value=c.isActive===false?'inactive':'active'; document.getElementById('editModal').style.display="block"; } }
function closeEditModal() { document.getElementById('editModal').style.display="none"; }
function saveEditCustomer() { let c=customers.find(x=>x.id===currentHistoryCustomerId); if(c) { c.name=document.getElementById('editCustName').value; c.phone=document.getElementById('editCustPhone').value; c.milkType=document.getElementById('editCustMilkType').value; c.mQty=parseFloat(document.getElementById('editCustMQty').value)||0; c.eQty=parseFloat(document.getElementById('editCustEQty').value)||0; c.price=parseFloat(document.getElementById('editCustPrice').value); c.isActive=document.getElementById('editCustStatus').value==='active'; saveData(); closeEditModal(); renderCustomers(); showToast("Updated!"); } }
function deleteCustomer() { if(confirm("Delete forever?")) { customers=customers.filter(c=>c.id!==currentHistoryCustomerId); saveData(); closeEditModal(); renderCustomers(); showToast("Deleted."); } }

function switchShift(s) { currentShift=s; document.querySelectorAll('.shift-tab').forEach(t=>t.classList.remove('active')); document.getElementById(`tab${s}`).classList.add('active'); document.getElementById('btnShiftText').innerText=s; renderEntryScreen(); }
function renderEntryScreen() { let d=document.getElementById('entryDate').value, html=''; customers.filter(c=>c.isActive!==false).forEach(c => { let e = entries.find(x=>x.date===d && x.customerId===c.id), def=currentShift==='Morning'?c.mQty:c.eQty, val=e?(currentShift==='Morning'?e.mQty:e.eQty):def; if(val===""||val==null)val=def; let tick = (e && val>0) ? `<span style="color:var(--success); font-weight:bold; float:right;">✓✓</span>` : ''; html += `<div class="entry-card"><div class="flex-between mb-2"><strong style="font-size:16px;">${c.name} ${c.milkType==='Cow'?'🐄':'🐃'}</strong><span>${tick} <span class="text-success" style="font-weight:700;">₹${c.price}/L</span></span></div><div><label style="font-size:13px; font-weight:600; color:var(--text-muted); margin-bottom:6px; display:block;">${currentShift} (L)</label><input type="number" step="0.25" id="entryInput_${c.id}" value="${val}" style="width:100%; padding:12px; border:1.5px solid var(--border-color); border-radius:10px; font-size:18px; text-align:center; font-weight:600; background:var(--input-bg); color:var(--text-main);"></div></div>`; }); document.getElementById('entryCustomerList').innerHTML=html; }
function saveShiftEntries() { let d=document.getElementById('entryDate').value; customers.forEach(c => { let i=document.getElementById(`entryInput_${c.id}`); if(!i)return; let v=i.value===''?0:parseFloat(i.value), idx=entries.findIndex(x=>x.date===d&&x.customerId===c.id); if(idx>=0){ currentShift==='Morning'?entries[idx].mQty=v:entries[idx].eQty=v; entries[idx].price=c.price; } else if(v>0){ let ne={date:d, customerId:c.id, price:c.price, mQty:0, eQty:0}; currentShift==='Morning'?ne.mQty=v:ne.eQty=v; entries.push(ne); } }); saveData(); updateDashboard(); renderEntryScreen(); showToast("Saved ✓✓"); }

function calcBilled(id) { let t=0; entries.filter(e=>e.customerId===id).forEach(e=>t+=((parseFloat(e.mQty)||0)+(parseFloat(e.eQty)||0))*parseFloat(e.price)); return t; }
function calcPaid(id) { let t=0; transactions.filter(t=>t.customerId===id).forEach(x=>t+=parseFloat(x.amount)); return t; }
function renderLedgerScreen() { let list=document.getElementById('ledgerList'); list.innerHTML=''; customers.forEach(c => { let b=calcBilled(c.id)-calcPaid(c.id), badge=b>0?`<span class="status-badge badge-due">₹${b} Baaki</span>`:b<0?`<span class="status-badge badge-advance">₹${Math.abs(b)} Adv</span>`:`<span class="status-badge badge-neutral">Clear</span>`; list.innerHTML += `<div class="list-item" style="cursor:pointer;" onclick="openLedgerDetail(${c.id})"><div><div class="item-title">${c.name}</div><div class="item-sub">Billed: ₹${calcBilled(c.id)}</div></div><div style="text-align:right;">${badge}</div></div>`; }); }
function openLedgerDetail(id) { currentHistoryCustomerId=id; let c=customers.find(x=>x.id===id); if(!c)return; document.getElementById('ledgerModalName').innerText=c.name; document.getElementById('ledgerBillMonth').value=getCurrentMonth(); let b=calcBilled(id)-calcPaid(id), bel=document.getElementById('ledgerModalBalance'), badge=document.getElementById('ledgerModalBadge'); if(b>0){bel.innerText=`₹${b}`;bel.className="text-danger";badge.className="status-badge badge-due";badge.innerText="DUE";}else if(b<0){bel.innerText=`₹${Math.abs(b)}`;bel.className="text-success";badge.className="status-badge badge-advance";badge.innerText="ADVANCE";}else{bel.innerText=`₹0`;bel.className="text-muted";badge.className="status-badge badge-neutral";badge.innerText="CLEAR";} renderPaymentHistory(id); updateBillPreview(); document.getElementById('ledgerDetailModal').style.display="block"; }
function closeLedgerDetailModal() { document.getElementById('ledgerDetailModal').style.display="none"; }
function savePayment() { let a=document.getElementById('paymentAmount').value, d=document.getElementById('paymentDate').value; if(!a)return; transactions.push({id:Date.now(), customerId:currentHistoryCustomerId, date:d, amount:parseFloat(a)}); saveData(); document.getElementById('paymentAmount').value=''; showToast("Saved!"); openLedgerDetail(currentHistoryCustomerId); renderLedgerScreen(); }
function renderPaymentHistory(id) { let h=''; transactions.filter(t=>t.customerId===id).sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach(t=>h+=`<div class="history-row"><span>${t.date}</span><strong class="text-success">+ ₹${t.amount}</strong></div>`); document.getElementById('paymentHistoryList').innerHTML=h?`<div class="history-container">${h}</div>`:'<p class="text-center text-muted">No payments.</p>'; }
function updateBillPreview() { let m=document.getElementById('ledgerBillMonth').value, tm=0, amt=0; entries.filter(e=>e.customerId===currentHistoryCustomerId&&e.date.startsWith(m)).forEach(e=>{let q=(parseFloat(e.mQty)||0)+(parseFloat(e.eQty)||0); tm+=q; amt+=q*parseFloat(e.price);}); document.getElementById('ledgerBillPreview').innerHTML=tm>0?`Milk: <strong>${tm}L</strong> | Bill: <strong class="text-primary">₹${amt}</strong>`:'No entry.'; }

function openHistoryModal() { closeEditModal(); document.getElementById('historyCustomerName').innerText=customers.find(c=>c.id===currentHistoryCustomerId).name; document.getElementById('historyMonthPicker').value=getCurrentMonth(); document.getElementById('historyModal').style.display="block"; renderCustomerHistory(); }
function closeHistoryModal() { document.getElementById('historyModal').style.display="none"; }
function renderCustomerHistory() { let m=document.getElementById('historyMonthPicker').value, div=document.getElementById('historyDataList'); div.innerHTML=''; let ent=entries.filter(e=>e.customerId===currentHistoryCustomerId&&e.date.startsWith(m)).sort((a,b)=>new Date(a.date)-new Date(b.date)); if(!ent.length)return div.innerHTML='<p class="text-center text-muted">No entries.</p>'; ent.forEach(e=>div.innerHTML+=`<div class="history-row"><span>${e.date.split('-')[2]}</span><span>M: ${e.mQty||'-'}</span><span>E: ${e.eQty||'-'}</span></div>`); }

// ================= PDF & WHATSAPP BILL LOGIC =================
function generatePDFBill() {
    let month = document.getElementById('ledgerBillMonth').value;
    let cust = customers.find(c => c.id === currentHistoryCustomerId);
    let custEntries = entries.filter(e => e.customerId === cust.id && e.date.startsWith(month)).sort((a,b) => new Date(a.date) - new Date(b.date));
    
    if(custEntries.length === 0) { alert("Generate karne ke liye koi data nahi hai!"); return; }

    let totalMilk = 0, monthBill = 0, tableRows = '';
    
    custEntries.forEach(entry => {
        let m = parseFloat(entry.mQty) || 0; let e = parseFloat(entry.eQty) || 0;
        let totalQty = m + e; let dayTotal = totalQty * parseFloat(entry.price);
        totalMilk += totalQty; monthBill += dayTotal;
        let d = entry.date.split('-')[2];
        tableRows += `<tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px;">${d}</td><td style="padding: 8px; text-align:center;">${m > 0 ? m : '-'}</td><td style="padding: 8px; text-align:center;">${e > 0 ? e : '-'}</td><td style="padding: 8px; text-align:center;">${totalQty}</td><td style="padding: 8px; text-align:right;">₹${dayTotal}</td>
        </tr>`;
    });

    let netBalance = calcBilled(cust.id) - calcPaid(cust.id);
    let balText = netBalance > 0 ? `Total Due: ₹${netBalance}` : netBalance < 0 ? `Advance: ₹${Math.abs(netBalance)}` : "Account Clear (₹0)";
    if(currentLang === 'hi') balText = netBalance > 0 ? `कुल बकाया: ₹${netBalance}` : netBalance < 0 ? `एडवांस जमा: ₹${Math.abs(netBalance)}` : "हिसाब क्लियर है (₹0)";
    
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
            <thead><tr style="background:#f9fafb; border-bottom:2px solid #ddd;"><th style="padding:10px; text-align:left;">Date</th><th style="padding:10px; text-align:center;">Morning (L)</th><th style="padding:10px; text-align:center;">Evening (L)</th><th style="padding:10px; text-align:center;">Total (L)</th><th style="padding:10px; text-align:right;">Amount (₹)</th></tr></thead>
            <tbody>${tableRows}</tbody>
        </table>
        <div style="border-top: 2px solid #000; padding-top: 15px; margin-top: 20px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:16px;"><span>Total Milk:</span> <strong>${totalMilk} L</strong></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:16px;"><span>Bill Amount:</span> <strong>₹${monthBill}</strong></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:18px; color:${netBalance > 0 ? '#d93025' : '#188038'};">
                <span>Final Status:</span> <strong>${balText}</strong>
            </div>
        </div>
        <p style="text-align:center; font-size:12px; color:#888; margin-top:30px;">Thanks for purchasing milk from ${appSettings.dairyName}</p>
    `;

    let container = document.getElementById('pdfBillContainer');
    container.innerHTML = pdfHtml; container.parentElement.style.display = 'block'; 

    let opt = { margin: 0.5, filename: `${cust.name.replace(/\s+/g, '_')}_Bill_${monthName}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
    html2pdf().set(opt).from(container).save().then(() => { container.parentElement.style.display = 'none'; showToast("PDF Downloaded!"); });
}

function generateAndShareBill() {
    let month = document.getElementById('ledgerBillMonth').value, cust = customers.find(c => c.id === currentHistoryCustomerId);
    let custEntries = entries.filter(e => e.customerId === cust.id && e.date.startsWith(month));
    let totalMilk = 0, monthBill = 0;
    custEntries.forEach(entry => { let qty = (parseFloat(entry.mQty) || 0) + (parseFloat(entry.eQty) || 0); totalMilk += qty; monthBill += qty * parseFloat(entry.price); });
    
    if(totalMilk === 0) return alert("No bill for this month!");

    let netBalance = calcBilled(cust.id) - calcPaid(cust.id), d = new Date(month + "-01"), monthName = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    let milkIcon = cust.milkType === 'Cow' ? '🐄' : '🐃';
    let m1 = currentLang === 'hi' ? 'का बिल' : 'Bill', m2 = currentLang === 'hi' ? 'कुल दूध' : 'Total Milk', m3 = currentLang === 'hi' ? 'बकाया' : 'Total Due';
    
    let msg = `Hello ${cust.name},\n\n*${appSettings.dairyName}* Milk Bill - *${monthName}*\n\n${milkIcon} ${m2}: *${totalMilk} L*\n💰 Bill Amount: *₹${monthBill}*\n\n`;
    if(netBalance > 0) msg += `🛑 *${m3}: ₹${netBalance}*\n\nPlease clear the dues. Thank you!`;
    else if(netBalance < 0) msg += `✅ *Advance: ₹${Math.abs(netBalance)}*`;
    else msg += `✅ *Account Clear.*`;
    msg += `\n\n_Note: Attached PDF contains full details._`;

    let phone = cust.phone, url = phone && phone.length === 10 ? `https://api.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(msg)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

// ================= 5. SETTINGS, SECURITY UI & BACKUP =================
function updateSettingsUI() {
    let reqCode = securityData.deviceID + "-" + (securityData.activationCount || 0); document.getElementById('displayDeviceID').innerText = reqCode;
    let t = getTodayDate();
    if (securityData.expiryDate === "LIFETIME") { document.getElementById('appStatusText').innerText = "✅ Lifetime Pro Active"; document.getElementById('appStatusText').style.color = "var(--success)"; document.getElementById('activationBox').style.display = "none"; } 
    else { let diffDays = Math.ceil((new Date(securityData.expiryDate) - new Date(t)) / (1000*60*60*24));
        if(diffDays > 0) { document.getElementById('appStatusText').innerText = `⏳ Active (${diffDays} days left)`; document.getElementById('appStatusText').style.color = "var(--warning)"; document.getElementById('activationBox').style.display = "block"; } 
        else { document.getElementById('appStatusText').innerText = `❌ Plan Expired!`; document.getElementById('appStatusText').style.color = "var(--danger)"; document.getElementById('activationBox').style.display = "block"; }
    }
    document.getElementById('toggleAppLock').checked = securityData.isLockEnabled;
    if (securityData.isLockEnabled) { document.getElementById('pinSetupBox').style.display = "none"; document.getElementById('pinEditBox').style.display = "block"; } else { document.getElementById('pinSetupBox').style.display = "none"; document.getElementById('pinEditBox').style.display = "none"; }
}

function activateApp() {
    let key = document.getElementById('activationKeyInput').value.trim(), reqCode = securityData.deviceID + "-" + (securityData.activationCount || 0), t = getTodayDate();
    if (key === getHash(reqCode + "_1M")) { let start = (securityData.expiryDate === "LIFETIME" || securityData.expiryDate < t) ? t : securityData.expiryDate; let d = new Date(start); d.setDate(d.getDate() + 30); securityData.expiryDate = d.toISOString().split('T')[0]; securityData.activationCount++; showToast("1 Month Pro Activated!"); } 
    else if (key === getHash(reqCode + "_1Y")) { let start = (securityData.expiryDate === "LIFETIME" || securityData.expiryDate < t) ? t : securityData.expiryDate; let d = new Date(start); d.setDate(d.getDate() + 365); securityData.expiryDate = d.toISOString().split('T')[0]; securityData.activationCount++; showToast("1 Year Pro Activated!"); } 
    else if (key === getHash(reqCode + "_LT")) { securityData.expiryDate = "LIFETIME"; securityData.activationCount++; showToast("Lifetime Pro Activated!"); } 
    else return alert("❌ Invalid Key! Please check again.");
    saveSecurity(); updateSettingsUI(); document.getElementById('activationKeyInput').value = "";
    if(t <= securityData.expiryDate || securityData.expiryDate === "LIFETIME") location.reload();
}

function toggleLockSetting() { 
    if(document.getElementById('toggleAppLock').checked) { 
        document.getElementById('pinSetupBox').style.display = "block"; document.getElementById('pinEditBox').style.display = "none"; 
    } else { 
        if(securityData.appPIN){ 
            let ep = prompt("Lock disable karne ke liye apna 4-digit PIN dalein:"); 
            if(ep !== securityData.appPIN){ 
                if(ep !== null) alert("❌ Incorrect PIN!"); 
                document.getElementById('toggleAppLock').checked = true; return; 
            } 
        } 
        if(confirm("Disable App Lock?")) { securityData.isLockEnabled = false; saveSecurity(); updateSettingsUI(); showToast("Lock Disabled"); } 
        else { document.getElementById('toggleAppLock').checked = true; } 
    } 
}

function saveNewPin() { let p=document.getElementById('newPinInput').value, q=document.getElementById('secQuestionSelect').value, a=document.getElementById('secAnswerSetup').value; if(p.length!==4) return alert("Enter exactly 4 digits for PIN"); if(!a) return alert("Enter security answer!"); securityData.appPIN=p; securityData.securityQuestion=q; securityData.securityAnswer=a; securityData.isLockEnabled=true; saveSecurity(); updateSettingsUI(); document.getElementById('newPinInput').value=""; document.getElementById('secAnswerSetup').value=""; showToast("Lock Enabled!"); }

function updateExistingPin() { 
    let oldPin = prompt("PIN change karne ke liye apna PURANA (Current) 4-digit PIN dalein:");
    if(oldPin === null) return; 
    if(oldPin !== securityData.appPIN) return alert("❌ Incorrect Current PIN! Update cancelled.");
    
    let np = document.getElementById('editPinInput').value; 
    if(np.length !== 4) return alert("Naye PIN ke liye exactly 4 digits dalein"); 
    
    securityData.appPIN = np; 
    saveSecurity(); 
    document.getElementById('editPinInput').value = ""; 
    showToast("PIN Changed Successfully!"); 
}

function openEditDairyModal() { document.getElementById('editDairyNameInput').value = appSettings.dairyName; document.getElementById('editCowPriceInput').value = appSettings.cowPrice; document.getElementById('editBuffPriceInput').value = appSettings.buffaloPrice; document.getElementById('editDairyModal').style.display="block"; }
function closeEditDairyModal() { document.getElementById('editDairyModal').style.display="none"; }
function saveDairyInfo() { let n=document.getElementById('editDairyNameInput').value, c=document.getElementById('editCowPriceInput').value, b=document.getElementById('editBuffPriceInput').value; if(n&&c&&b) { appSettings.dairyName=n; appSettings.cowPrice=parseFloat(c); appSettings.buffaloPrice=parseFloat(b); saveData(); loadApp(); closeEditDairyModal(); showToast("Saved!"); } }

function exportData() { let b={ milk_settings: appSettings, milk_customers: customers, milk_entries: entries, milk_transactions: transactions, milk_expenses: expenses, milk_security: securityData }; let a=document.createElement('a'); a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(b)); a.download=`Backup_${getTodayDate()}.json`; a.click(); showToast("Exported safely!"); }
function importData(e) {
    let f=e.target.files[0]; if(!f)return; let r=new FileReader();
    r.onload = function(ev) {
        try { let d = JSON.parse(ev.target.result); if(d.milk_security) { if(d.milk_security.checksum !== getHash(d.milk_security.deviceID+d.milk_security.installDate+d.milk_security.expiryDate+d.milk_security.activationCount)) return alert("❌ Backup Corrupted!"); } localStorage.setItem('milk_settings', JSON.stringify(d.milk_settings)); localStorage.setItem('milk_customers', JSON.stringify(d.milk_customers)); localStorage.setItem('milk_entries', JSON.stringify(d.milk_entries)); localStorage.setItem('milk_transactions', JSON.stringify(d.milk_transactions)); localStorage.setItem('milk_expenses', JSON.stringify(d.milk_expenses||[])); if(d.milk_security) localStorage.setItem('milk_security', JSON.stringify(d.milk_security)); alert("Restored Successfully!"); location.reload(); } catch(err) { alert("Invalid File"); }
    }; r.readAsText(f);
}

function resetAppData() { 
    if (securityData && securityData.isLockEnabled && securityData.appPIN) {
        let enteredPin = prompt("App reset karne ke liye apna 4-digit PIN dalein:");
        if (enteredPin === null) return; 
        if (enteredPin !== securityData.appPIN) return alert("❌ Incorrect PIN! Reset cancelled.");
    }
    if(confirm("⚠️ DANGER: Kya aap sach me saara data delete karna chahte hain? Ye wapas nahi aayega!")) { 
        localStorage.clear(); 
        location.reload(); 
    } 
}