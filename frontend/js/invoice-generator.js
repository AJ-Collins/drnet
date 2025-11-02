let invoiceData = null;
let currentSMSContent = '';
let payslipData = null;

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const toggleSidebar = document.getElementById('toggleSidebar');
  const closeSidebar = document.getElementById('closeSidebar');

  toggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
  });

  closeSidebar.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
  });

  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !toggleSidebar.contains(e.target) && !sidebar.classList.contains('-translate-x-full')) {
      sidebar.classList.add('-translate-x-full');
    }
  });

  // Initialize tab navigation
  setupTabNavigation();
  
  // Set current month for bulk payslips
  const currentMonth = new Date().toISOString().slice(0, 7);
  document.getElementById('bulkMonth').value = currentMonth;

  // Setup pay period change handler
  document.getElementById('payPeriod').addEventListener('change', handlePayPeriodChange);
});

// Initialization function
async function initReportsPage() {
  console.log('Initializing Finance and Reports page...');
  
  // Load data first
  await fetchData();
  console.log('Staff data loaded:', staff);
  
  // Check for auto-reset of sales data
  checkSalesReset();
  
  // Initialize with invoices tab active
  showTab('invoices');
}

// Tab Navigation Functions
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('[onclick^="showTab"]');
  tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = button.onclick.toString().match(/showTab\('(.+?)'\)/)[1];
      showTab(tabName);
    });
  });
}

function showTab(tabName) {
  // Hide all sections
  document.getElementById('invoicesSection').classList.add('hidden');
  document.getElementById('receiptsSection').classList.add('hidden');
  document.getElementById('payslipsSection').classList.add('hidden');
  document.getElementById('reportsSection').classList.add('hidden');
  document.getElementById('expensesSection').classList.add('hidden');
  document.getElementById('salesSection').classList.add('hidden');

  // Remove active class from all tabs
  document.querySelectorAll('[onclick^="showTab"]').forEach(tab => {
    tab.classList.remove('bg-gradient-to-r', 'from-indigo-600', 'to-purple-600', 'text-white');
    tab.classList.add('bg-white/80', 'text-gray-700');
  });

  // Show selected section
  document.getElementById(tabName + 'Section').classList.remove('hidden');

  // Add active class to selected tab
  const activeTab = document.querySelector(`[onclick="showTab('${tabName}')"]`);
  if (activeTab) {
    activeTab.classList.remove('bg-white/80', 'text-gray-700');
    activeTab.classList.add('bg-gradient-to-r', 'from-indigo-600', 'to-purple-600', 'text-white');
  }

  // Load data for the selected tab
  if (tabName === 'invoices') {
    renderInvoiceGenerator();
  } else if (tabName === 'receipts') {
    renderReceiptsSection();
  } else if (tabName === 'payslips') {
    renderPayslipGenerator();
  } else if (tabName === 'reports') {
    renderReportsSection();
  } else if (tabName === 'expenses') {
    renderExpensesSection();
  } else if (tabName === 'sales') {
    renderSalesSection();
  }
}

function handlePayPeriodChange() {
  const payPeriod = document.getElementById('payPeriod').value;
  const customDateRange = document.getElementById('customDateRange');
  
  if (payPeriod === 'custom') {
    customDateRange.classList.remove('hidden');
  } else {
    customDateRange.classList.add('hidden');
  }
}

async function renderInvoiceGenerator() {
  const invoiceUserSelect = document.getElementById('invoiceUser');
  const invoicePreview = document.getElementById('invoicePreview');
  const smsPreview = document.getElementById('smsPreview');

  invoiceUserSelect.innerHTML = '<option value="">Loading clients...</option>';
  if (invoicePreview) invoicePreview.classList.add('hidden');
  if (smsPreview) smsPreview.classList.add('hidden');

  try {
    await fetchData();
    const activeUsers = users.filter(u => u.is_deleted !== 1);

    // Populate User Select
    invoiceUserSelect.innerHTML = `
      <option value="">Choose a client...</option>
      ${activeUsers.map(user => `
        <option value="${user.id}">${user.name} - ${user.location}</option>
      `).join('')}
    `;
  } catch (err) {
    console.error('Error loading users:', err);
    invoiceUserSelect.innerHTML = '<option value="">Error loading clients</option>';
  }
}

async function renderPayslipGenerator() {
  console.log('Rendering payslip generator...');
  const payslipStaffSelect = document.getElementById('payslipStaff');
  const payslipPreview = document.getElementById('payslipPreview');

  payslipStaffSelect.innerHTML = '<option value="">Loading staff...</option>';
  if (payslipPreview) payslipPreview.classList.add('hidden');

  try {
    await fetchData();
    console.log('Staff data in payslip generator:', staff);
    const activeStaff = staff.filter(s => s.status === 'active');
    console.log('Active staff:', activeStaff);

    // Populate Staff Select
    payslipStaffSelect.innerHTML = `
      <option value="">Choose a staff member...</option>
      ${activeStaff.map(staffMember => `
        <option value="${staffMember.id}">${staffMember.name} - ${staffMember.role} (${staffMember.department})</option>
      `).join('')}
    `;
    console.log('Staff dropdown populated with', activeStaff.length, 'members');
  } catch (err) {
    console.error('Error loading staff:', err);
    payslipStaffSelect.innerHTML = '<option value="">Error loading staff</option>';
  }
}

function renderReportsSection() {
  // Initialize analytics section
  const analyticsPreview = document.getElementById('analyticsPreview');
  if (analyticsPreview) {
    analyticsPreview.classList.add('hidden');
  }
}

function generateInvoice() {
  const userId = document.getElementById('invoiceUser').value;
  if (!userId) {
    Swal.fire({
      title: 'Error',
      text: 'Please select a user first',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  const user = users.find(u => u.id == userId);
  if (!user) {
    Swal.fire({
      title: 'Error',
      text: 'User not found',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  const invoice = {
    id: 'INV-' + Date.now(),
    userId: user.id,
    userName: user.name,
    userPhone: user.phone,
    userLocation: user.location,
    amount: Number(user.subscription_amount),
    invoiceNumber: 'INV-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    issueDate: dayjs().format('YYYY-MM-DD'),
    dueDate: dayjs().add(7, 'days').format('YYYY-MM-DD'),
    status: 'pending'
  };

  generateInvoicePDF(invoice);
  invoiceData = invoice;

  const invoicePreview = document.getElementById('invoicePreview');
  invoicePreview.classList.remove('hidden');
  invoicePreview.innerHTML = `
    <h5 class="font-semibold text-gray-800 mb-4">Invoice Preview</h5>
    <div class="border rounded-lg p-4 bg-white">
      <div class="flex justify-between mb-4">
        <div>
          <h6 class="font-bold text-lg text-pink-600">DR.NET TECHNOLOGY LABS</h6>
          <p class="text-sm text-gray-600">Internet Service Provider</p>
        </div>
        <div class="text-right">
          <h6 class="font-bold">INVOICE</h6>
          <p class="text-sm">#${invoice.invoiceNumber}</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p class="font-semibold">Bill To:</p>
          <p>${invoice.userName}</p>
          <p>${invoice.userPhone}</p>
          <p>${invoice.userLocation}</p>
        </div>
        <div class="text-right">
          <p><strong>Issue Date:</strong> ${dayjs(invoice.issueDate).format('MMM D, YYYY')}</p>
          <p><strong>Due Date:</strong> ${dayjs(invoice.dueDate).format('MMM D, YYYY')}</p>
          <p><strong>Amount:</strong> KSH ${invoice.amount.toLocaleString()}</p>
        </div>
      </div>
      <div class="border-t pt-4">
        <h6 class="font-semibold mb-2">Payment Instructions:</h6>
        <ul class="text-sm text-gray-700 space-y-1">
          <li>• M-PESA: Lipa na M-Pesa Buy Goods</li>
          <li>• Till Number: 5626320</li>
          <li>• Name: DR.NET TECHNOLOGY LABS</li>
          <li>• Reference: ${invoice.invoiceNumber}</li>
        </ul>
      </div>
    </div>
  `;
}

function generateInvoicePDF(invoice) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  // Company branding
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(220, 38, 127);
  pdf.text('DR.NET INNOVATIONS', 20, 25);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('INNOVATIVE CONNECTIONS WITH DOCTORS PRECISION', 20, 33);
  pdf.text('Email: dr.netinnovations@gmail.com | Website: https://drnet.co.ke/', 20, 40);
  pdf.text('P.O. Box 105876 - 00100 NAIROBI', 20, 47);
  pdf.text('Phone: +254111357066', 20, 54);

  // Invoice header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('INVOICE', 150, 25);

  // Invoice details box
  pdf.setDrawColor(220, 38, 127);
  pdf.setLineWidth(0.5);
  pdf.rect(120, 35, 70, 25);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Invoice #: ${invoice.invoiceNumber}`, 125, 42);
  pdf.text(`Issue Date: ${dayjs(invoice.issueDate).format('MMM D, YYYY')}`, 125, 48);
  pdf.text(`Due Date: ${dayjs(invoice.dueDate).format('MMM D, YYYY')}`, 125, 54);

  // Client information
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BILL TO:', 20, 80);

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.userName, 20, 90);
  pdf.text(`Phone: ${invoice.userPhone}`, 20, 98);
  pdf.text(`Location: ${invoice.userLocation}`, 20, 106);

  // Service details table
  const startY = 130;

  // Table header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(20, startY, 170, 10, 'F');

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DESCRIPTION', 25, startY + 7);
  pdf.text('PERIOD', 100, startY + 7);
  pdf.text('AMOUNT (KSH)', 140, startY + 7);

  // Table content
  pdf.setFont('helvetica', 'normal');
  const contentY = startY + 20;
  pdf.text('Internet Subscription Service', 25, contentY);
  pdf.text('Monthly Service', 100, contentY);
  pdf.text(invoice.amount.toLocaleString(), 145, contentY);

  // Subtotal and total
  const totalY = contentY + 30;
  pdf.setDrawColor(0, 0, 0);
  pdf.line(120, totalY - 5, 190, totalY - 5);

  pdf.setFont('helvetica', 'bold');
  pdf.text('SUBTOTAL:', 120, totalY);
  pdf.text(`KSH ${invoice.amount.toLocaleString()}`, 160, totalY);

  pdf.text('TOTAL DUE:', 120, totalY + 10);
  pdf.setFontSize(12);
  pdf.setTextColor(220, 38, 127);
  pdf.text(`KSH ${invoice.amount.toLocaleString()}`, 160, totalY + 10);

  // Payment instructions
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text('PAYMENT INSTRUCTIONS:', 20, totalY + 30);
  pdf.text('• M-PESA: Lipa na M-Pesa Buy Goods', 20, totalY + 38);
  pdf.text('• Till Number: 5626320', 20, totalY + 45);
  pdf.text('• Name: DR.NET TECHNOLOGY LABS', 20, totalY + 52);
  pdf.text(`• Reference: ${invoice.invoiceNumber}`, 20, totalY + 59);
  pdf.text('• Payment due within 7 days of invoice date', 20, totalY + 66);
  pdf.text('• For assistance call: 0701782354', 20, totalY + 73);

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Thank you for choosing DR.NET TECHNOLOGY LABS!', 20, 270);
  pdf.text('For support: dr.netinnovations@gmail.com or 0701782354', 20, 277);

  pdf.save(`DR-NET-Invoice-${invoice.invoiceNumber}.pdf`);
  Swal.fire({
    title: 'Success',
    text: 'Invoice PDF generated successfully!',
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  });
}

function generateSMSTemplate(type) {
  const userId = document.getElementById('invoiceUser').value;
  if (!userId) {
    Swal.fire({
      title: 'Error',
      text: 'Please select a user first',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  const user = users.find(u => u.id == userId);
  if (!user) {
    Swal.fire({
      title: 'Error',
      text: 'User not found',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  const invoiceNumber = 'INV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const dueDate = dayjs().add(7, 'days').format('MMM D, YYYY');
  let smsContent = '';

  switch (type) {
    case 'invoice':
      smsContent = `Dear ${user.name},

      Your DR.NET internet subscription has expired.

      Invoice #${invoiceNumber}
      Amount Due: KSH ${Number(user.subscription_amount).toLocaleString()}
      Due Date: ${dueDate}

      Please renew to continue enjoying our high-speed internet service.

      Payment via M-PESA:
      • Lipa na M-Pesa Buy Goods
      • Till Number: 5626320
      • Name: DR.NET TECHNOLOGY LABS
      • Reference: ${invoiceNumber}

      Contact us: 0701782354
      DR.NET TECHNOLOGY LABS`;
            break;
          case 'reminder':
            smsContent = `REMINDER: ${user.name}

      Your DR.NET subscription payment is overdue.

      Invoice #${invoiceNumber}
      Amount: KSH ${Number(user.subscription_amount).toLocaleString()}

      Please pay immediately to avoid service suspension.

      Pay via M-PESA:
      • Lipa na M-Pesa Buy Goods
      • Till Number: 5626320
      • Reference: ${invoiceNumber}

      DR.NET TECHNOLOGY LABS`;
            break;
          case 'confirmation':
            smsContent = `Payment Confirmed!

      Thank you ${user.name}!

      Invoice #${invoiceNumber} - PAID
      Amount: KSH ${Number(user.subscription_amount).toLocaleString()}

      Your DR.NET internet service has been renewed for 30 days.

      Questions? Call 0701782354
      DR.NET TECHNOLOGY LABS`;
      break;
  }

  currentSMSContent = smsContent;
  const smsPreview = document.getElementById('smsPreview');
  smsPreview.classList.remove('hidden');
  smsPreview.innerHTML = `
    <h5 class="font-semibold text-gray-800 mb-4">SMS Preview</h5>
    <div class="bg-white p-4 rounded-lg border font-mono text-sm whitespace-pre-wrap">
      ${smsContent}
    </div>
    <button onclick="copySMSToClipboard()" class="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition transform hover:-translate-y-1">
      📋 Copy to Clipboard
    </button>
  `;
}

function copySMSToClipboard() {
  navigator.clipboard.writeText(currentSMSContent).then(() => {
    Swal.fire({
      title: 'Copied!',
      text: 'SMS content copied to clipboard',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
  });
}

// Payslip Generation Functions
function generatePayslip() {
  const staffId = document.getElementById('payslipStaff').value;
  const payPeriod = document.getElementById('payPeriod').value;
  
  if (!staffId) {
    Swal.fire({
      title: 'Error',
      text: 'Please select a staff member first',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  if (!payPeriod) {
    Swal.fire({
      title: 'Error',
      text: 'Please select a pay period',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  const staffMember = staff.find(s => s.id == staffId);
  if (!staffMember) {
    Swal.fire({
      title: 'Error',
      text: 'Staff member not found',
      icon: 'error',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    });
    return;
  }

  let payPeriodDates = getPayPeriodDates(payPeriod);
  
  const payslip = {
    id: 'PAY-' + Date.now(),
    staffId: staffMember.id,
    staffName: staffMember.name,
    staffRole: staffMember.role,
    staffDepartment: staffMember.department,
    staffPhone: staffMember.phone,
    staffIdNumber: staffMember.idNumber,
    payslipNumber: 'PAY-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    payPeriodFrom: payPeriodDates.from,
    payPeriodTo: payPeriodDates.to,
    generateDate: dayjs().format('YYYY-MM-DD'),
    basicSalary: calculateBasicSalary(staffMember),
    allowances: calculateAllowances(staffMember),
    deductions: calculateDeductions(staffMember),
    netSalary: 0
  };

  payslip.netSalary = payslip.basicSalary + payslip.allowances.total - payslip.deductions.total;
  
  generatePayslipPDF(payslip);
  payslipData = payslip;

  showPayslipPreview(payslip);
}

function getPayPeriodDates(payPeriod) {
  let fromDate, toDate;
  
  switch (payPeriod) {
    case 'current':
      fromDate = dayjs().startOf('month').format('YYYY-MM-DD');
      toDate = dayjs().endOf('month').format('YYYY-MM-DD');
      break;
    case 'previous':
      fromDate = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
      toDate = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
      break;
    case 'custom':
      fromDate = document.getElementById('payslipFromDate').value;
      toDate = document.getElementById('payslipToDate').value;
      if (!fromDate || !toDate) {
        Swal.fire({
          title: 'Error',
          text: 'Please select both from and to dates',
          icon: 'error'
        });
        return null;
      }
      break;
  }

  return { from: fromDate, to: toDate };
}

function calculateBasicSalary(staffMember) {
  // Mock salary calculation based on role
  const salaryRanges = {
    'Technical Manager': 80000,
    'Senior Technician': 60000,
    'Lead Technician': 70000,
    'Network Engineer': 65000,
    'Customer Service Rep': 35000,
    'Sales Executive': 45000,
    'Operations Manager': 75000,
    'Admin Assistant': 30000,
    'Finance Officer': 55000,
    'Marketing Coordinator': 40000,
    'HR Manager': 65000
  };
  
  return salaryRanges[staffMember.role] || 40000;
}

function calculateAllowances(staffMember) {
  const basicSalary = calculateBasicSalary(staffMember);
  const transportAllowance = 8000;
  const houseAllowance = basicSalary * 0.15; // 15% of basic salary
  const medicalAllowance = 5000;
  
  return {
    transport: transportAllowance,
    house: houseAllowance,
    medical: medicalAllowance,
    total: transportAllowance + houseAllowance + medicalAllowance
  };
}

function calculateDeductions(staffMember) {
  const basicSalary = calculateBasicSalary(staffMember);
  const nhifDeduction = 1700; // Standard NHIF
  const nssfDeduction = Math.min(basicSalary * 0.06, 1080); // 6% capped at 1080
  const payeTax = calculatePAYE(basicSalary);
  
  return {
    nhif: nhifDeduction,
    nssf: nssfDeduction,
    paye: payeTax,
    total: nhifDeduction + nssfDeduction + payeTax
  };
}

function calculatePAYE(salary) {
  // Simplified PAYE calculation for Kenya
  const personalRelief = 2400;
  let tax = 0;
  
  if (salary <= 24000) {
    tax = salary * 0.10;
  } else if (salary <= 32333) {
    tax = 2400 + (salary - 24000) * 0.25;
  } else {
    tax = 2400 + 2083 + (salary - 32333) * 0.30;
  }
  
  return Math.max(0, tax - personalRelief);
}

function showPayslipPreview(payslip) {
  const payslipPreview = document.getElementById('payslipPreview');
  payslipPreview.classList.remove('hidden');
  payslipPreview.innerHTML = `
    <h5 class="font-semibold text-gray-800 mb-4">Payslip Preview</h5>
    <div class="border rounded-lg p-4 bg-white">
      <div class="flex justify-between mb-4">
        <div>
          <h6 class="font-bold text-lg text-green-600">DR.NET TECHNOLOGY LABS</h6>
          <p class="text-sm text-gray-600">Staff Payslip</p>
        </div>
        <div class="text-right">
          <h6 class="font-bold">PAYSLIP</h6>
          <p class="text-sm">#${payslip.payslipNumber}</p>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p class="font-semibold">Employee:</p>
          <p>${payslip.staffName}</p>
          <p>${payslip.staffRole}</p>
          <p>${payslip.staffDepartment}</p>
          <p>ID: ${payslip.staffIdNumber}</p>
        </div>
        <div class="text-right">
          <p><strong>Pay Period:</strong></p>
          <p>${dayjs(payslip.payPeriodFrom).format('MMM D')} - ${dayjs(payslip.payPeriodTo).format('MMM D, YYYY')}</p>
          <p><strong>Generated:</strong> ${dayjs(payslip.generateDate).format('MMM D, YYYY')}</p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 text-sm">
        <div>
          <h6 class="font-semibold text-green-600 mb-2">EARNINGS</h6>
          <div class="space-y-1">
            <div class="flex justify-between">
              <span>Basic Salary:</span>
              <span>KSH ${payslip.basicSalary.toLocaleString()}</span>
            </div>
            <div class="flex justify-between">
              <span>House Allowance:</span>
              <span>KSH ${Math.round(payslip.allowances.house).toLocaleString()}</span>
            </div>
            <div class="flex justify-between">
              <span>Transport:</span>
              <span>KSH ${payslip.allowances.transport.toLocaleString()}</span>
            </div>
            <div class="flex justify-between">
              <span>Medical:</span>
              <span>KSH ${payslip.allowances.medical.toLocaleString()}</span>
            </div>
            <div class="border-t pt-1 font-semibold">
              <div class="flex justify-between">
                <span>Total Earnings:</span>
                <span>KSH ${(payslip.basicSalary + payslip.allowances.total).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h6 class="font-semibold text-red-600 mb-2">DEDUCTIONS</h6>
          <div class="space-y-1">
            <div class="flex justify-between">
              <span>PAYE Tax:</span>
              <span>KSH ${Math.round(payslip.deductions.paye).toLocaleString()}</span>
            </div>
            <div class="flex justify-between">
              <span>NHIF:</span>
              <span>KSH ${payslip.deductions.nhif.toLocaleString()}</span>
            </div>
            <div class="flex justify-between">
              <span>NSSF:</span>
              <span>KSH ${Math.round(payslip.deductions.nssf).toLocaleString()}</span>
            </div>
            <div class="border-t pt-1 font-semibold">
              <div class="flex justify-between">
                <span>Total Deductions:</span>
                <span>KSH ${Math.round(payslip.deductions.total).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h6 class="font-semibold text-blue-600 mb-2">NET PAY</h6>
          <div class="bg-blue-50 p-3 rounded-lg">
            <div class="text-center">
              <p class="text-sm text-gray-600">Net Salary</p>
              <p class="text-xl font-bold text-blue-800">KSH ${Math.round(payslip.netSalary).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generatePayslipPDF(payslip) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  // Company Header
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(34, 197, 94);
  pdf.text('DR.NET INNOVATIONS', 20, 25);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('INNOVATIVE CONNECTIONS WITH DOCTORS PRECISION', 20, 33);
  pdf.text('Staff Payslip - Confidential Document', 20, 40);
  pdf.text('Email: dr.netinnovations@gmail.com', 20, 47);
  pdf.text('Website: https://drnet.co.ke/', 20, 54);
  pdf.text('P.O. Box 105876 - 00100 NAIROBI', 20, 61);
  pdf.text('Phone: +254111357066', 20, 68);

  // Payslip Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('PAYSLIP', 150, 25);

  // Payslip details box
  pdf.setDrawColor(34, 197, 94);
  pdf.setLineWidth(0.5);
  pdf.rect(120, 35, 70, 35);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Payslip #: ${payslip.payslipNumber}`, 125, 42);
  pdf.text(`Pay Period: ${dayjs(payslip.payPeriodFrom).format('MMM D')} - ${dayjs(payslip.payPeriodTo).format('MMM D, YYYY')}`, 125, 48);
  pdf.text(`Generated: ${dayjs(payslip.generateDate).format('MMM D, YYYY')}`, 125, 54);

  // Employee Information
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EMPLOYEE DETAILS:', 20, 80);

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Name: ${payslip.staffName}`, 20, 90);
  pdf.text(`Position: ${payslip.staffRole}`, 20, 98);
  pdf.text(`Department: ${payslip.staffDepartment}`, 20, 106);
  pdf.text(`ID Number: ${payslip.staffIdNumber}`, 20, 114);

  // Total Earnings Section (Simplified)
  let currentY = 140;
  pdf.setDrawColor(34, 197, 94);
  pdf.setFillColor(240, 253, 244);
  pdf.rect(20, currentY - 10, 170, 40, 'FD');

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(34, 197, 94);
  pdf.text('TOTAL EARNINGS', 70, currentY + 5);

  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(22, 163, 74);
  pdf.text(`KSH ${payslip.basicSalary.toLocaleString()}`, 70, currentY + 20);

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('This is a computer generated payslip and does not require a signature.', 20, 270);
  pdf.text('For payroll inquiries, contact HR at dr.netinnovations@gmail.com', 20, 277);

  pdf.save(`DR-NET-Payslip-${payslip.staffName.replace(/\s+/g, '-')}-${payslip.payslipNumber}.pdf`);
  
  Swal.fire({
    title: 'Success',
    text: 'Payslip PDF generated successfully!',
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white'
  });
}

function generateBulkPayslips() {
  const department = document.getElementById('bulkDepartment').value;
  const status = document.getElementById('bulkStatus').value;
  const month = document.getElementById('bulkMonth').value;

  if (!month) {
    Swal.fire({
      title: 'Error',
      text: 'Please select a month for bulk generation',
      icon: 'error'
    });
    return;
  }

  let filteredStaff = staff;
  
  if (department !== 'all') {
    filteredStaff = filteredStaff.filter(s => s.department === department);
  }
  
  if (status === 'active') {
    filteredStaff = filteredStaff.filter(s => s.status === 'active');
  }

  if (filteredStaff.length === 0) {
    Swal.fire({
      title: 'No Staff Found',
      text: 'No staff members match the selected criteria',
      icon: 'warning'
    });
    return;
  }

  Swal.fire({
    title: 'Generate Bulk Payslips',
    text: `Generate payslips for ${filteredStaff.length} staff members?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Generate All',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      // Simulate bulk generation
      let generatedCount = 0;
      
      const generateNext = () => {
        if (generatedCount < filteredStaff.length) {
          const staffMember = filteredStaff[generatedCount];
          
          // Create payslip data for the selected month
          const monthStart = dayjs(month).startOf('month').format('YYYY-MM-DD');
          const monthEnd = dayjs(month).endOf('month').format('YYYY-MM-DD');
          
          const payslip = {
            id: 'PAY-' + Date.now() + '-' + generatedCount,
            staffId: staffMember.id,
            staffName: staffMember.name,
            staffRole: staffMember.role,
            staffDepartment: staffMember.department,
            staffPhone: staffMember.phone,
            staffIdNumber: staffMember.idNumber,
            payslipNumber: 'PAY-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            payPeriodFrom: monthStart,
            payPeriodTo: monthEnd,
            generateDate: dayjs().format('YYYY-MM-DD'),
            basicSalary: calculateBasicSalary(staffMember),
            allowances: calculateAllowances(staffMember),
            deductions: calculateDeductions(staffMember),
            netSalary: 0
          };

          payslip.netSalary = payslip.basicSalary + payslip.allowances.total - payslip.deductions.total;
          
          generatePayslipPDF(payslip);
          
          generatedCount++;
          setTimeout(generateNext, 500); // Small delay between generations
        } else {
          Swal.fire({
            title: 'Complete!',
            text: `Successfully generated ${generatedCount} payslips`,
            icon: 'success',
            timer: 3000
          });
        }
      };
      
      generateNext();
    }
  });
}

// Payslip SMS Functions
function generatePayslipSMS() {
  const staffId = document.getElementById('payslipStaff').value;
  const payPeriod = document.getElementById('payPeriod').value;
  
  if (!staffId) {
    Swal.fire({
      title: 'Error',
      text: 'Please select a staff member first',
      icon: 'error',
      confirmButtonColor: '#EF4444'
    });
    return;
  }

  if (!payPeriod) {
    Swal.fire({
      title: 'Error', 
      text: 'Please select a pay period',
      icon: 'error',
      confirmButtonColor: '#EF4444'
    });
    return;
  }

  const staffMember = staff.find(s => s.id == staffId);
  if (!staffMember) {
    Swal.fire({
      title: 'Error',
      text: 'Staff member not found',
      icon: 'error',
      confirmButtonColor: '#EF4444'
    });
    return;
  }

  let payPeriodDates = getPayPeriodDates(payPeriod);
  
  const payslip = {
    id: 'PAY-' + Date.now(),
    staffId: staffMember.id,
    staffName: staffMember.name,
    staffRole: staffMember.role,
    staffDepartment: staffMember.department,
    staffPhone: staffMember.phone,
    staffIdNumber: staffMember.idNumber,
    payslipNumber: 'PAY-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    payPeriodFrom: payPeriodDates.from,
    payPeriodTo: payPeriodDates.to,
    generateDate: dayjs().format('YYYY-MM-DD'),
    basicSalary: calculateBasicSalary(staffMember),
    allowances: calculateAllowances(staffMember),
    deductions: calculateDeductions(staffMember),
    netSalary: 0
  };

  payslip.netSalary = payslip.basicSalary + payslip.allowances.total - payslip.deductions.total;
  
  // Store payslip data for SMS
  payslipData = payslip;
  
  // Generate and show SMS
  showPayslipSMS(payslip);
}

function showPayslipSMS(payslip) {
  const smsPreviewDiv = document.getElementById('payslipSmsPreview');
  const smsContentDiv = document.getElementById('payslipSmsContent');
  const smsRecipientDiv = document.getElementById('payslipSmsRecipient');
  const smsCharCountDiv = document.getElementById('payslipSmsCharCount');
  
  // Generate SMS content
  const smsContent = generatePayslipSMSContent(payslip);
  
  // Update UI
  smsContentDiv.textContent = smsContent;
  smsRecipientDiv.textContent = `${payslip.staffName} (${payslip.staffPhone || 'Phone not available'})`;
  smsCharCountDiv.textContent = smsContent.length;
  
  // Show SMS preview
  smsPreviewDiv.classList.remove('hidden');
  
  // Scroll to SMS preview
  smsPreviewDiv.scrollIntoView({ behavior: 'smooth' });
}

function generatePayslipSMSContent(payslip) {
  const periodFrom = dayjs(payslip.payPeriodFrom).format('MMM DD, YYYY');
  const periodTo = dayjs(payslip.payPeriodTo).format('MMM DD, YYYY');
  const generateDate = dayjs(payslip.generateDate).format('MMM DD, YYYY');
  
  const smsContent = `📄 DR.NET PAYSLIP NOTIFICATION

Dear ${payslip.staffName},
Your payslip is ready for review.

📋 PAYSLIP DETAILS:
Payslip No: ${payslip.payslipNumber}
Period: ${periodFrom} to ${periodTo}
Generated: ${generateDate}

� NET SALARY: KSH ${Math.round(payslip.netSalary).toLocaleString()}

📞 Contact HR for any payslip queries.

- DR.NET INNOVATIONS
📧 dr.netinnovations@gmail.com
🌐 https://drnet.co.ke`;

  return smsContent;
}

function copyPayslipSMS() {
  const smsContent = document.getElementById('payslipSmsContent').textContent;
  
  if (!smsContent) {
    Swal.fire({
      title: 'Error',
      text: 'No SMS content to copy',
      icon: 'error',
      confirmButtonColor: '#EF4444'
    });
    return;
  }
  
  navigator.clipboard.writeText(smsContent).then(() => {
    Swal.fire({
      title: 'Copied!',
      text: 'Payslip SMS copied to clipboard successfully',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      confirmButtonColor: '#10B981'
    });
  }).catch(err => {
    console.error('Failed to copy SMS: ', err);
    
    // Fallback method for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = smsContent;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      Swal.fire({
        title: 'Copied!',
        text: 'Payslip SMS copied to clipboard successfully',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        confirmButtonColor: '#10B981'
      });
    } catch (err) {
      document.body.removeChild(textArea);
      
      Swal.fire({
        title: 'Copy Failed',
        text: 'Failed to copy SMS. Please select and copy manually.',
        icon: 'error',
        confirmButtonColor: '#EF4444'
      });
    }
  });
}

function generateBulkPayslipSMS() {
  const department = document.getElementById('bulkDepartment').value;
  const status = document.getElementById('bulkStatus').value;
  const month = document.getElementById('bulkMonth').value;

  if (!month) {
    Swal.fire({
      title: 'Error',
      text: 'Please select a month for bulk SMS generation',
      icon: 'error',
      confirmButtonColor: '#EF4444'
    });
    return;
  }

  let filteredStaff = staff;
  
  if (department !== 'all') {
    filteredStaff = filteredStaff.filter(s => s.department === department);
  }
  
  if (status === 'active') {
    filteredStaff = filteredStaff.filter(s => s.status === 'active');
  }

  if (filteredStaff.length === 0) {
    Swal.fire({
      title: 'No Staff Found',
      text: 'No staff members match the selected criteria',
      icon: 'warning',
      confirmButtonColor: '#F59E0B'
    });
    return;
  }

  // Generate SMS content for all staff
  let allSMSContent = `📱 BULK PAYSLIP SMS MESSAGES - ${dayjs(month).format('MMMM YYYY')}\n`;
  allSMSContent += `Generated on: ${dayjs().format('MMMM DD, YYYY')}\n`;
  allSMSContent += `Staff Count: ${filteredStaff.length}\n\n`;
  allSMSContent += '='.repeat(50) + '\n\n';

  filteredStaff.forEach((staffMember, index) => {
    const monthStart = dayjs(month).startOf('month').format('YYYY-MM-DD');
    const monthEnd = dayjs(month).endOf('month').format('YYYY-MM-DD');
    
    const payslip = {
      id: 'PAY-' + Date.now() + '-' + index,
      staffId: staffMember.id,
      staffName: staffMember.name,
      staffRole: staffMember.role,
      staffDepartment: staffMember.department,
      staffPhone: staffMember.phone,
      staffIdNumber: staffMember.idNumber,
      payslipNumber: 'PAY-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      payPeriodFrom: monthStart,
      payPeriodTo: monthEnd,
      generateDate: dayjs().format('YYYY-MM-DD'),
      basicSalary: calculateBasicSalary(staffMember),
      allowances: calculateAllowances(staffMember),
      deductions: calculateDeductions(staffMember),
      netSalary: 0
    };

    payslip.netSalary = payslip.basicSalary + payslip.allowances.total - payslip.deductions.total;
    
    // Add individual SMS content
    allSMSContent += `${index + 1}. ${staffMember.name} (${staffMember.phone || 'No phone'})\n`;
    allSMSContent += '-'.repeat(40) + '\n';
    allSMSContent += generatePayslipSMSContent(payslip);
    allSMSContent += '\n\n' + '='.repeat(50) + '\n\n';
  });

  // Show bulk SMS in modal for copying
  Swal.fire({
    title: '📱 Bulk Payslip SMS Generated',
    html: `
      <div class="text-left space-y-4">
        <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p class="text-sm text-blue-700 mb-2">
            <strong>${filteredStaff.length} SMS messages</strong> generated for ${dayjs(month).format('MMMM YYYY')}
          </p>
          <div class="flex justify-between items-center">
            <span class="text-xs text-blue-600">Click below to copy all messages</span>
            <button 
              onclick="copyBulkSMS()" 
              class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
            >
              📋 Copy All
            </button>
          </div>
        </div>
        <div class="max-h-96 overflow-y-auto bg-gray-50 p-3 rounded border">
          <pre class="text-xs font-mono whitespace-pre-wrap" id="bulkSMSContent">${allSMSContent}</pre>
        </div>
        <div class="text-xs text-gray-600">
          <p><strong>Total Characters:</strong> ${allSMSContent.length}</p>
          <p><strong>Note:</strong> Send individual messages to each staff member's phone number.</p>
        </div>
      </div>
    `,
    width: 800,
    showConfirmButton: true,
    confirmButtonText: 'Close',
    confirmButtonColor: '#6B7280'
  });

  // Store bulk SMS content globally for copying
  window.bulkSMSContent = allSMSContent;
}

function copyBulkSMS() {
  const content = window.bulkSMSContent;
  
  if (!content) {
    Swal.fire({
      title: 'Error',
      text: 'No SMS content to copy',
      icon: 'error',
      confirmButtonColor: '#EF4444'
    });
    return;
  }
  
  navigator.clipboard.writeText(content).then(() => {
    Swal.fire({
      title: 'Copied!',
      text: 'All bulk SMS messages copied to clipboard',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      confirmButtonColor: '#10B981'
    });
  }).catch(err => {
    console.error('Failed to copy bulk SMS: ', err);
    
    // Fallback method
    const textArea = document.createElement('textarea');
    textArea.value = content;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      Swal.fire({
        title: 'Copied!',
        text: 'All bulk SMS messages copied to clipboard',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      document.body.removeChild(textArea);
      
      Swal.fire({
        title: 'Copy Failed',
        text: 'Failed to copy SMS. Please select and copy manually.',
        icon: 'error',
        confirmButtonColor: '#EF4444'
      });
    }
  });
}

// Reports and Analytics Functions
function generateReport(reportType) {
  const analyticsPreview = document.getElementById('analyticsPreview');
  const reportContent = document.getElementById('reportContent');
  
  analyticsPreview.classList.remove('hidden');
  
  let reportHTML = '';
  
  switch (reportType) {
    case 'revenue':
      reportHTML = generateRevenueReport();
      break;
    case 'outstanding':
      reportHTML = generateOutstandingReport();
      break;
    case 'payroll':
      reportHTML = generatePayrollReport();
      break;
    case 'clients':
      reportHTML = generateClientReport();
      break;
    case 'packages':
      reportHTML = generatePackageReport();
      break;
    case 'retention':
      reportHTML = generateRetentionReport();
      break;
    case 'staffSummary':
      reportHTML = generateStaffSummaryReport();
      break;
    case 'performance':
      reportHTML = generatePerformanceReport();
      break;
    case 'attendance':
      reportHTML = generateAttendanceReport();
      break;
  }
  
  reportContent.innerHTML = reportHTML;
}

function generateRevenueReport() {
  const totalRevenue = users.reduce((sum, user) => sum + Number(user.subscription_amount || 0), 0);
  const activeClients = users.filter(u => u.is_deleted !== 1).length;
  const avgRevenuePerClient = activeClients > 0 ? totalRevenue / activeClients : 0;
  
  return `
    <div class="space-y-6">
      <h5 class="text-lg font-semibold">Revenue Analysis Report</h5>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-green-50 p-4 rounded-lg">
          <h6 class="font-semibold text-green-800">Total Monthly Revenue</h6>
          <p class="text-2xl font-bold text-green-600">KSH ${totalRevenue.toLocaleString()}</p>
        </div>
        <div class="bg-blue-50 p-4 rounded-lg">
          <h6 class="font-semibold text-blue-800">Active Clients</h6>
          <p class="text-2xl font-bold text-blue-600">${activeClients}</p>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg">
          <h6 class="font-semibold text-purple-800">Avg Revenue/Client</h6>
          <p class="text-2xl font-bold text-purple-600">KSH ${Math.round(avgRevenuePerClient).toLocaleString()}</p>
        </div>
      </div>
    </div>
  `;
}

function generateStaffSummaryReport() {
  const totalStaff = staff.length;
  const activeStaff = staff.filter(s => s.status === 'active').length;
  const departments = [...new Set(staff.map(s => s.department))];
  
  const departmentCounts = departments.map(dept => ({
    name: dept,
    count: staff.filter(s => s.department === dept).length
  }));
  
  return `
    <div class="space-y-6">
      <h5 class="text-lg font-semibold">Staff Summary Report</h5>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-indigo-50 p-4 rounded-lg">
          <h6 class="font-semibold text-indigo-800">Total Staff</h6>
          <p class="text-2xl font-bold text-indigo-600">${totalStaff}</p>
        </div>
        <div class="bg-green-50 p-4 rounded-lg">
          <h6 class="font-semibold text-green-800">Active Staff</h6>
          <p class="text-2xl font-bold text-green-600">${activeStaff}</p>
        </div>
      </div>
      <div class="bg-white p-4 rounded-lg border">
        <h6 class="font-semibold mb-3">Staff by Department</h6>
        ${departmentCounts.map(dept => `
          <div class="flex justify-between items-center py-2 border-b last:border-b-0">
            <span class="font-medium">${dept.name}</span>
            <span class="bg-gray-100 px-2 py-1 rounded text-sm">${dept.count} staff</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function generatePayrollReport() {
  const totalPayroll = staff
    .filter(s => s.status === 'active')
    .reduce((sum, staffMember) => {
      const basicSalary = calculateBasicSalary(staffMember);
      const allowances = calculateAllowances(staffMember);
      const deductions = calculateDeductions(staffMember);
      const netSalary = basicSalary + allowances.total - deductions.total;
      return sum + netSalary;
    }, 0);
    
  const avgSalary = staff.filter(s => s.status === 'active').length > 0 
    ? totalPayroll / staff.filter(s => s.status === 'active').length 
    : 0;
  
  return `
    <div class="space-y-6">
      <h5 class="text-lg font-semibold">Payroll Summary Report</h5>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-green-50 p-4 rounded-lg">
          <h6 class="font-semibold text-green-800">Total Monthly Payroll</h6>
          <p class="text-2xl font-bold text-green-600">KSH ${Math.round(totalPayroll).toLocaleString()}</p>
        </div>
        <div class="bg-blue-50 p-4 rounded-lg">
          <h6 class="font-semibold text-blue-800">Average Salary</h6>
          <p class="text-2xl font-bold text-blue-600">KSH ${Math.round(avgSalary).toLocaleString()}</p>
        </div>
      </div>
    </div>
  `;
}

// Placeholder functions for other reports
function generateOutstandingReport() {
  return `<div class="p-4"><h5 class="text-lg font-semibold">Outstanding Payments Report</h5><p class="text-gray-600 mt-2">Coming soon...</p></div>`;
}

function generateClientReport() {
  return `<div class="p-4"><h5 class="text-lg font-semibold">Client Analysis Report</h5><p class="text-gray-600 mt-2">Coming soon...</p></div>`;
}

function generatePackageReport() {
  return `<div class="p-4"><h5 class="text-lg font-semibold">Package Analysis Report</h5><p class="text-gray-600 mt-2">Coming soon...</p></div>`;
}

function generateRetentionReport() {
  return `<div class="p-4"><h5 class="text-lg font-semibold">Client Retention Report</h5><p class="text-gray-600 mt-2">Coming soon...</p></div>`;
}

function generatePerformanceReport() {
  return `<div class="p-4"><h5 class="text-lg font-semibold">Staff Performance Report</h5><p class="text-gray-600 mt-2">Coming soon...</p></div>`;
}

function generateAttendanceReport() {
  return `<div class="p-4"><h5 class="text-lg font-semibold">Attendance Report</h5><p class="text-gray-600 mt-2">Coming soon...</p></div>`;
}

// ============================================
// EXPENSES MANAGEMENT FUNCTIONALITY
// ============================================

let expenses = JSON.parse(localStorage.getItem('companyExpenses')) || [];

// Initialize expenses section
function renderExpensesSection() {
  console.log('Rendering expenses section...');
  
  // Set current date as default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('expenseDate').value = today;
  
  // Set current month for filter
  const currentMonth = new Date().toISOString().slice(0, 7);
  document.getElementById('expenseFilterMonth').value = currentMonth;
  
  // Load existing expenses
  loadExpenses();
  updateExpenseSummary();
  
  // Setup form submission
  const expenseForm = document.getElementById('expenseForm');
  if (expenseForm) {
    expenseForm.addEventListener('submit', handleExpenseSubmission);
  }
  
  // Setup filter
  document.getElementById('expenseFilterCategory').addEventListener('change', filterExpenses);
  document.getElementById('expenseFilterMonth').addEventListener('change', filterExpenses);
}

// Handle expense form submission
function handleExpenseSubmission(event) {
  event.preventDefault();
  
  const expense = {
    id: 'EXP' + Date.now(),
    category: document.getElementById('expenseCategory').value,
    amount: parseFloat(document.getElementById('expenseAmount').value),
    date: document.getElementById('expenseDate').value,
    vendor: document.getElementById('expenseVendor').value,
    paymentMethod: document.getElementById('paymentMethod').value,
    description: document.getElementById('expenseDescription').value,
    reference: document.getElementById('expenseReference').value,
    createdAt: new Date().toISOString(),
    createdBy: 'Julius Ojwang - CTO'
  };
  
  // Validate required fields
  if (!expense.category || !expense.amount || !expense.date || !expense.vendor || !expense.paymentMethod || !expense.description) {
    Swal.fire({
      title: 'Missing Information',
      text: 'Please fill in all required fields.',
      icon: 'error',
      confirmButtonColor: '#EF4444'
    });
    return;
  }
  
  // Add to expenses array
  expenses.unshift(expense);
  
  // Save to localStorage
  localStorage.setItem('companyExpenses', JSON.stringify(expenses));
  
  // Show success message
  Swal.fire({
    title: 'Expense Recorded!',
    text: `${getCategoryName(expense.category)} expense of KES ${expense.amount.toLocaleString()} has been recorded.`,
    icon: 'success',
    confirmButtonColor: '#10B981'
  });
  
  // Clear form and refresh display
  clearExpenseForm();
  loadExpenses();
  updateExpenseSummary();
}

// Clear expense form
function clearExpenseForm() {
  document.getElementById('expenseForm').reset();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('expenseDate').value = today;
}

// Load and display expenses
function loadExpenses() {
  const tableBody = document.getElementById('expenseTableBody');
  const noExpenses = document.getElementById('noExpenses');
  
  if (expenses.length === 0) {
    tableBody.innerHTML = '';
    noExpenses.classList.remove('hidden');
    return;
  }
  
  noExpenses.classList.add('hidden');
  
  // Apply current filters
  const filteredExpenses = getFilteredExpenses();
  
  if (filteredExpenses.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-8 text-center text-gray-500">
          No expenses match the current filter criteria.
        </td>
      </tr>
    `;
    return;
  }
  
  tableBody.innerHTML = filteredExpenses.map(expense => `
    <tr class="hover:bg-gray-50">
      <td class="px-4 py-3 text-sm text-gray-900">${new Date(expense.date).toLocaleDateString()}</td>
      <td class="px-4 py-3 text-sm">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          ${getCategoryName(expense.category)}
        </span>
      </td>
      <td class="px-4 py-3 text-sm text-gray-900">${expense.vendor}</td>
      <td class="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title="${expense.description}">
        ${expense.description}
      </td>
      <td class="px-4 py-3 text-sm text-right font-semibold">KES ${expense.amount.toLocaleString()}</td>
      <td class="px-4 py-3 text-center">
        <div class="flex justify-center space-x-2">
          <button onclick="viewExpense('${expense.id}')" class="text-blue-600 hover:text-blue-800 transition" title="View Details">
            👁️
          </button>
          <button onclick="editExpense('${expense.id}')" class="text-green-600 hover:text-green-800 transition" title="Edit">
            ✏️
          </button>
          <button onclick="deleteExpense('${expense.id}')" class="text-red-600 hover:text-red-800 transition" title="Delete">
            🗑️
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Get category display name
function getCategoryName(category) {
  const categories = {
    'bills': '📄 Bills & Utilities',
    'salaries': '💰 Staff Salaries', 
    'petty_cash': '💵 Petty Cash',
    'equipment': '🖥️ Equipment & Hardware',
    'office_supplies': '📋 Office Supplies',
    'maintenance': '🔧 Maintenance & Repairs',
    'transportation': '🚗 Transportation',
    'marketing': '📢 Marketing & Advertising',
    'insurance': '🛡️ Insurance',
    'rent': '🏢 Rent & Property',
    'software': '💻 Software & Licenses',
    'training': '🎓 Training & Development',
    'other': '🏷️ Other'
  };
  return categories[category] || category;
}

// Update expense summary cards
function updateExpenseSummary() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Calculate monthly expenses
  const monthlyExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate yearly expenses
  const yearlyExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  // Find largest expense
  const largestExpense = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;
  
  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Update display
  document.getElementById('monthlyExpenses').textContent = `KES ${monthlyExpenses.toLocaleString()}`;
  document.getElementById('yearlyExpenses').textContent = `KES ${yearlyExpenses.toLocaleString()}`;
  document.getElementById('largestExpense').textContent = `KES ${largestExpense.toLocaleString()}`;
  document.getElementById('totalExpenses').textContent = `KES ${totalExpenses.toLocaleString()}`;
}

// Get filtered expenses based on current filter settings
function getFilteredExpenses() {
  const categoryFilter = document.getElementById('expenseFilterCategory').value;
  const monthFilter = document.getElementById('expenseFilterMonth').value;
  
  return expenses.filter(expense => {
    // Category filter
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) {
      return false;
    }
    
    // Month filter
    if (monthFilter) {
      const expenseMonth = expense.date.slice(0, 7); // YYYY-MM format
      if (expenseMonth !== monthFilter) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
}

// Filter expenses
function filterExpenses() {
  loadExpenses();
}

// View expense details
function viewExpense(expenseId) {
  const expense = expenses.find(e => e.id === expenseId);
  if (!expense) return;
  
  Swal.fire({
    title: 'Expense Details',
    html: `
      <div class="text-left space-y-3">
        <div><strong>Category:</strong> ${getCategoryName(expense.category)}</div>
        <div><strong>Amount:</strong> KES ${expense.amount.toLocaleString()}</div>
        <div><strong>Date:</strong> ${new Date(expense.date).toLocaleDateString()}</div>
        <div><strong>Vendor/Payee:</strong> ${expense.vendor}</div>
        <div><strong>Payment Method:</strong> ${expense.paymentMethod}</div>
        <div><strong>Description:</strong> ${expense.description}</div>
        ${expense.reference ? `<div><strong>Reference:</strong> ${expense.reference}</div>` : ''}
        <div><strong>Created:</strong> ${new Date(expense.createdAt).toLocaleString()}</div>
        <div><strong>Created By:</strong> ${expense.createdBy}</div>
      </div>
    `,
    confirmButtonColor: '#3B82F6'
  });
}

// Edit expense
function editExpense(expenseId) {
  const expense = expenses.find(e => e.id === expenseId);
  if (!expense) return;
  
  // Populate form with expense data
  document.getElementById('expenseCategory').value = expense.category;
  document.getElementById('expenseAmount').value = expense.amount;
  document.getElementById('expenseDate').value = expense.date;
  document.getElementById('expenseVendor').value = expense.vendor;
  document.getElementById('paymentMethod').value = expense.paymentMethod;
  document.getElementById('expenseDescription').value = expense.description;
  document.getElementById('expenseReference').value = expense.reference || '';
  
  // Remove the expense from array (will be re-added when form is submitted)
  expenses = expenses.filter(e => e.id !== expenseId);
  localStorage.setItem('companyExpenses', JSON.stringify(expenses));
  
  // Refresh display
  loadExpenses();
  updateExpenseSummary();
  
  // Scroll to form
  document.getElementById('expenseForm').scrollIntoView({ behavior: 'smooth' });
  
  Swal.fire({
    title: 'Edit Mode',
    text: 'Expense loaded in form for editing. Make your changes and submit.',
    icon: 'info',
    confirmButtonColor: '#3B82F6'
  });
}

// Delete expense
function deleteExpense(expenseId) {
  const expense = expenses.find(e => e.id === expenseId);
  if (!expense) return;
  
  Swal.fire({
    title: 'Delete Expense?',
    text: `Are you sure you want to delete this ${getCategoryName(expense.category)} expense of KES ${expense.amount.toLocaleString()}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      expenses = expenses.filter(e => e.id !== expenseId);
      localStorage.setItem('companyExpenses', JSON.stringify(expenses));
      
      loadExpenses();
      updateExpenseSummary();
      
      Swal.fire({
        title: 'Deleted!',
        text: 'Expense has been deleted.',
        icon: 'success',
        confirmButtonColor: '#10B981'
      });
    }
  });
}

// Export expenses to CSV
function exportExpenses() {
  const filteredExpenses = getFilteredExpenses();
  
  if (filteredExpenses.length === 0) {
    Swal.fire({
      title: 'No Data',
      text: 'No expenses to export with current filters.',
      icon: 'info',
      confirmButtonColor: '#3B82F6'
    });
    return;
  }
  
  // Create CSV content
  const headers = ['Date', 'Category', 'Vendor/Payee', 'Description', 'Amount', 'Payment Method', 'Reference'];
  const csvContent = [
    headers.join(','),
    ...filteredExpenses.map(expense => [
      expense.date,
      `"${getCategoryName(expense.category).replace(/"/g, '""')}"`,
      `"${expense.vendor.replace(/"/g, '""')}"`,
      `"${expense.description.replace(/"/g, '""')}"`,
      expense.amount,
      expense.paymentMethod,
      `"${(expense.reference || '').replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');
  
  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `expenses_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  Swal.fire({
    title: 'Exported!',
    text: `${filteredExpenses.length} expenses exported successfully.`,
    icon: 'success',
    confirmButtonColor: '#10B981'
  });
}

// ============================================
// SALES MANAGEMENT FUNCTIONALITY
// ============================================

let sales = JSON.parse(localStorage.getItem('companySales')) || [];

// Initialize sales section
function renderSalesSection() {
  console.log('Rendering sales section...');
  
  // Set current date as default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('saleDate').value = today;
  
  // Set current month for filter
  const currentMonth = new Date().toISOString().slice(0, 7);
  populateSalesMonthFilter();
  
  // Load existing sales
  loadSales();
  updateSalesSummary();
  
  // Setup form submission
  const saleForm = document.getElementById('saleForm');
  if (saleForm) {
    saleForm.addEventListener('submit', handleSaleSubmission);
  }
  
  // Setup filters
  document.getElementById('salesFilterType').addEventListener('change', filterSales);
  document.getElementById('salesFilterMonth').addEventListener('change', filterSales);
}

// Handle sale form submission
function handleSaleSubmission(event) {
  event.preventDefault();
  
  const formData = {
    id: Date.now(),
    type: document.getElementById('saleType').value,
    description: document.getElementById('saleDescription').value,
    amount: parseFloat(document.getElementById('saleAmount').value),
    date: document.getElementById('saleDate').value,
    customer: document.getElementById('saleCustomer').value || 'Walk-in Customer',
    quantity: parseInt(document.getElementById('saleQuantity').value) || 1,
    notes: document.getElementById('saleNotes').value,
    createdAt: new Date().toISOString()
  };
  
  // Validation
  if (!formData.type || !formData.description || !formData.amount || !formData.date) {
    Swal.fire({
      title: 'Missing Information',
      text: 'Please fill in all required fields (Type, Description, Amount, Date).',
      icon: 'warning',
      confirmButtonColor: '#F59E0B'
    });
    return;
  }
  
  if (formData.amount <= 0) {
    Swal.fire({
      title: 'Invalid Amount',
      text: 'Sale amount must be greater than 0.',
      icon: 'error',
      confirmButtonColor: '#EF4444'
    });
    return;
  }
  
  // Add sale
  sales.push(formData);
  localStorage.setItem('companySales', JSON.stringify(sales));
  
  // Update UI
  loadSales();
  updateSalesSummary();
  clearSaleForm();
  
  // Update dashboard accessories
  updateDashboardAccessories();
  
  Swal.fire({
    title: 'Sale Recorded!',
    text: `Sale of ${formData.description} for KES ${formData.amount.toLocaleString()} has been recorded.`,
    icon: 'success',
    confirmButtonColor: '#10B981'
  });
}

// Clear sale form
function clearSaleForm() {
  document.getElementById('saleForm').reset();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('saleDate').value = today;
  document.getElementById('saleQuantity').value = 1;
}

// Load and display sales
function loadSales() {
  const filteredSales = getFilteredSales();
  const tbody = document.getElementById('salesTableBody');
  const noSalesDiv = document.getElementById('noSales');
  
  if (filteredSales.length === 0) {
    tbody.innerHTML = '';
    noSalesDiv.classList.remove('hidden');
    return;
  }
  
  noSalesDiv.classList.add('hidden');
  
  // Sort sales by date (newest first)
  const sortedSales = filteredSales.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  tbody.innerHTML = sortedSales.map(sale => {
    const saleDate = new Date(sale.date);
    const formattedDate = saleDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    
    const typeIcon = getAccessoryIcon(sale.type);
    const totalAmount = sale.amount * sale.quantity;
    
    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-4 py-3 text-sm font-medium text-gray-900">${formattedDate}</td>
        <td class="px-4 py-3 text-sm text-gray-600">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            ${typeIcon} ${sale.type.charAt(0).toUpperCase() + sale.type.slice(1)}
          </span>
        </td>
        <td class="px-4 py-3 text-sm text-gray-900">${sale.description}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${sale.customer}</td>
        <td class="px-4 py-3 text-sm text-gray-600 text-center">${sale.quantity}</td>
        <td class="px-4 py-3 text-sm font-semibold text-gray-900 text-right">KES ${totalAmount.toLocaleString()}</td>
        <td class="px-4 py-3 text-center">
          <div class="flex items-center justify-center space-x-2">
            <button onclick="viewSale('${sale.id}')" class="text-blue-600 hover:text-blue-800 transition-colors" title="View">
              <span class="text-lg">👁️</span>
            </button>
            <button onclick="editSale('${sale.id}')" class="text-green-600 hover:text-green-800 transition-colors" title="Edit">
              <span class="text-lg">✏️</span>
            </button>
            <button onclick="deleteSale('${sale.id}')" class="text-red-600 hover:text-red-800 transition-colors" title="Delete">
              <span class="text-lg">🗑️</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Get accessory icon based on type
function getAccessoryIcon(type) {
  const icons = {
    router: '📡',
    cable: '🔌',
    adapter: '🔄',
    switch: '🔀',
    modem: '📶',
    antenna: '📡',
    connector: '🔗',
    splitter: '🔀',
    extender: '📡',
    other: '🛠️'
  };
  return icons[type] || '🛠️';
}

// Update sales summary
function updateSalesSummary() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Filter sales for different periods
  const todaySales = sales.filter(sale => sale.date === today);
  const monthlySales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
  });
  const yearlySales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate.getFullYear() === currentYear;
  });
  
  // Calculate totals
  const todayTotal = todaySales.reduce((sum, sale) => sum + (sale.amount * sale.quantity), 0);
  const monthlyTotal = monthlySales.reduce((sum, sale) => sum + (sale.amount * sale.quantity), 0);
  const yearlyTotal = yearlySales.reduce((sum, sale) => sum + (sale.amount * sale.quantity), 0);
  
  // Update UI
  document.getElementById('todaySales').textContent = `KES ${todayTotal.toLocaleString()}`;
  document.getElementById('monthlySales').textContent = `KES ${monthlyTotal.toLocaleString()}`;
  document.getElementById('yearlySales').textContent = `KES ${yearlyTotal.toLocaleString()}`;
  document.getElementById('totalSalesCount').textContent = sales.length.toLocaleString();
}

// Get filtered sales based on current filters
function getFilteredSales() {
  const typeFilter = document.getElementById('salesFilterType').value;
  const monthFilter = document.getElementById('salesFilterMonth').value;
  
  return sales.filter(sale => {
    const typeMatch = typeFilter === 'all' || sale.type === typeFilter;
    const monthMatch = !monthFilter || sale.date.startsWith(monthFilter);
    return typeMatch && monthMatch;
  });
}

// Filter sales
function filterSales() {
  loadSales();
}

// Populate month filter dropdown
function populateSalesMonthFilter() {
  const monthFilter = document.getElementById('salesFilterMonth');
  const uniqueMonths = [...new Set(sales.map(sale => sale.date.slice(0, 7)))];
  
  monthFilter.innerHTML = '<option value="">All Months</option>';
  uniqueMonths.sort().reverse().forEach(month => {
    const date = new Date(month + '-01');
    const monthName = date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
    monthFilter.innerHTML += `<option value="${month}">${monthName}</option>`;
  });
}

// View sale details
function viewSale(saleId) {
  const sale = sales.find(s => s.id == saleId);
  if (!sale) return;
  
  const saleDate = new Date(sale.date);
  const formattedDate = saleDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const typeIcon = getAccessoryIcon(sale.type);
  const totalAmount = sale.amount * sale.quantity;
  
  Swal.fire({
    title: `${typeIcon} Sale Details`,
    html: `
      <div class="text-left space-y-3">
        <div><strong>Date:</strong> ${formattedDate}</div>
        <div><strong>Type:</strong> ${sale.type.charAt(0).toUpperCase() + sale.type.slice(1)}</div>
        <div><strong>Description:</strong> ${sale.description}</div>
        <div><strong>Customer:</strong> ${sale.customer}</div>
        <div><strong>Quantity:</strong> ${sale.quantity}</div>
        <div><strong>Unit Price:</strong> KES ${sale.amount.toLocaleString()}</div>
        <div><strong>Total Amount:</strong> KES ${totalAmount.toLocaleString()}</div>
        ${sale.notes ? `<div><strong>Notes:</strong> ${sale.notes}</div>` : ''}
        <div class="text-sm text-gray-500 mt-4">
          <strong>Created:</strong> ${new Date(sale.createdAt).toLocaleString()}
        </div>
      </div>
    `,
    confirmButtonColor: '#3B82F6',
    confirmButtonText: 'Close'
  });
}

// Edit sale
function editSale(saleId) {
  const sale = sales.find(s => s.id == saleId);
  if (!sale) return;
  
  // Populate form with sale data
  document.getElementById('saleType').value = sale.type;
  document.getElementById('saleDescription').value = sale.description;
  document.getElementById('saleAmount').value = sale.amount;
  document.getElementById('saleDate').value = sale.date;
  document.getElementById('saleCustomer').value = sale.customer === 'Walk-in Customer' ? '' : sale.customer;
  document.getElementById('saleQuantity').value = sale.quantity;
  document.getElementById('saleNotes').value = sale.notes || '';
  
  // Remove the old sale
  sales = sales.filter(s => s.id !== sale.id);
  localStorage.setItem('companySales', JSON.stringify(sales));
  
  // Update UI
  loadSales();
  updateSalesSummary();
  updateDashboardAccessories();
  
  // Show success message
  Swal.fire({
    title: 'Editing Sale',
    text: 'Sale data loaded in form for editing. Make changes and submit.',
    icon: 'info',
    confirmButtonColor: '#3B82F6'
  });
  
  // Scroll to form
  document.getElementById('saleForm').scrollIntoView({ behavior: 'smooth' });
}

// Delete sale
function deleteSale(saleId) {
  const sale = sales.find(s => s.id == saleId);
  if (!sale) return;
  
  Swal.fire({
    title: 'Delete Sale?',
    text: `Are you sure you want to delete this sale of ${sale.description}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      sales = sales.filter(s => s.id !== sale.id);
      localStorage.setItem('companySales', JSON.stringify(sales));
      
      loadSales();
      updateSalesSummary();
      updateDashboardAccessories();
      
      Swal.fire({
        title: 'Deleted!',
        text: 'Sale has been deleted.',
        icon: 'success',
        confirmButtonColor: '#10B981'
      });
    }
  });
}

// Export sales to CSV
function exportSales() {
  const filteredSales = getFilteredSales();
  
  if (filteredSales.length === 0) {
    Swal.fire({
      title: 'No Data',
      text: 'No sales to export with current filters.',
      icon: 'info',
      confirmButtonColor: '#3B82F6'
    });
    return;
  }
  
  // Create CSV content
  const headers = ['Date', 'Type', 'Description', 'Customer', 'Quantity', 'Unit Price', 'Total Amount', 'Notes'];
  const csvContent = [
    headers.join(','),
    ...filteredSales.map(sale => [
      sale.date,
      `"${sale.type.replace(/"/g, '""')}"`,
      `"${sale.description.replace(/"/g, '""')}"`,
      `"${sale.customer.replace(/"/g, '""')}"`,
      sale.quantity,
      sale.amount,
      sale.amount * sale.quantity,
      `"${(sale.notes || '').replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');
  
  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `sales_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  Swal.fire({
    title: 'Exported!',
    text: `${filteredSales.length} sales records exported successfully.`,
    icon: 'success',
    confirmButtonColor: '#10B981'
  });
}

// Update dashboard accessories with sales data
function updateDashboardAccessories() {
  // This function integrates with the main dashboard to show accessories sales
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Get current month's sales
  const monthlySales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
  });
  
  // Calculate total monthly accessories revenue
  const monthlyTotal = monthlySales.reduce((sum, sale) => sum + (sale.amount * sale.quantity), 0);
  
  // Store in localStorage for dashboard to read
  localStorage.setItem('monthlyAccessoriesRevenue', JSON.stringify({
    total: monthlyTotal,
    count: monthlySales.length,
    lastUpdated: new Date().toISOString()
  }));
  
  // Dispatch event for dashboard to update if it's listening
  if (window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('accessoriesUpdated', {
      detail: { total: monthlyTotal, count: monthlySales.length }
    }));
  }
}

// Auto-reset sales data monthly (30 days)
function checkSalesReset() {
  const lastReset = localStorage.getItem('lastSalesReset');
  const now = new Date();
  
  if (!lastReset) {
    localStorage.setItem('lastSalesReset', now.toISOString());
    return;
  }
  
  const lastResetDate = new Date(lastReset);
  const daysSinceReset = Math.floor((now - lastResetDate) / (1000 * 60 * 60 * 24));
  
  if (daysSinceReset >= 30) {
    // Archive old sales before reset
    const archivedSales = JSON.parse(localStorage.getItem('archivedSales')) || [];
    archivedSales.push({
      period: `${lastResetDate.getFullYear()}-${String(lastResetDate.getMonth() + 1).padStart(2, '0')}`,
      sales: [...sales],
      resetDate: now.toISOString()
    });
    
    localStorage.setItem('archivedSales', JSON.stringify(archivedSales));
    
    // Reset current sales
    sales = [];
    localStorage.setItem('companySales', JSON.stringify(sales));
    localStorage.setItem('lastSalesReset', now.toISOString());
    
    console.log('Sales data auto-reset completed');
  }
}

// ============================================
// PAYMENT RECEIPTS MANAGEMENT FUNCTIONALITY
// ============================================

let paymentReceipts = JSON.parse(localStorage.getItem('paymentReceipts')) || [];

// Initialize receipts section
function renderReceiptsSection() {
  console.log('Rendering receipts section...');
  
  // Set current date as default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('receiptDate').value = today;
  
  // Set current month for filter
  const currentMonth = new Date().toISOString().slice(0, 7);
  document.getElementById('receiptFilterMonth').value = currentMonth;
  
  // Load clients for dropdowns
  loadReceiptClients();
  
  // Load existing receipts
  loadPaymentReceipts();
  updatePaymentSummary();
  
  // Setup form submission
  const receiptForm = document.getElementById('receiptForm');
  if (receiptForm) {
    receiptForm.addEventListener('submit', handleReceiptSubmission);
  }
  
  // Setup filters
  document.getElementById('receiptFilterClient').addEventListener('change', filterReceipts);
  document.getElementById('receiptFilterMonth').addEventListener('change', filterReceipts);
}

// Load clients for receipt filter dropdown
function loadReceiptClients() {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const clients = users.filter(user => user.role === 'client' && user.status === 'active');
  
  // Populate filter dropdown only (main client field is now manual text input)
  const filterClientSelect = document.getElementById('receiptFilterClient');
  filterClientSelect.innerHTML = '<option value="all">All Clients</option>';
  
  clients.forEach(client => {
    // Add to filter dropdown
    const option = document.createElement('option');
    option.value = client.id;
    option.textContent = client.name;
    filterClientSelect.appendChild(option);
  });
}

// Handle receipt form submission
function handleReceiptSubmission(event) {
  event.preventDefault();
  
  const clientName = document.getElementById('receiptClient').value.trim();
  
  if (!clientName) {
    Swal.fire({
      title: 'Client Name Required',
      text: 'Please enter the client name.',
      icon: 'error',
      confirmButtonColor: '#EF4444'
    });
    return;
  }
  
  const receipt = {
    id: 'RCP' + Date.now(),
    receiptNumber: generateReceiptNumber(),
    clientId: 'manual_' + Date.now(), // Generate unique ID for manual entries
    clientName: clientName,
    clientPackage: 'Manual Entry', // Default for manually entered clients
    amount: parseFloat(document.getElementById('receiptAmount').value),
    date: document.getElementById('receiptDate').value,
    paymentMethod: document.getElementById('receiptPaymentMethod').value,
    reference: document.getElementById('receiptReference').value,
    servicePeriod: document.getElementById('receiptServicePeriod').value,
    notes: document.getElementById('receiptNotes').value,
    createdAt: new Date().toISOString(),
    createdBy: 'Julius Ojwang - CTO'
  };
  
  // Validate required fields
  if (!receipt.clientName || !receipt.amount || !receipt.date || !receipt.paymentMethod) {
    Swal.fire({
      title: 'Missing Information',
      text: 'Please fill in all required fields.',
      icon: 'error',
      confirmButtonColor: '#EF4444'
    });
    return;
  }
  
  // Add to receipts array
  paymentReceipts.unshift(receipt);
  
  // Save to localStorage
  localStorage.setItem('paymentReceipts', JSON.stringify(paymentReceipts));
  
  // Show success with option to generate PDF
  Swal.fire({
    title: 'Payment Recorded!',
    text: `Payment receipt for ${receipt.clientName} (KES ${receipt.amount.toLocaleString()}) has been recorded.`,
    icon: 'success',
    showCancelButton: true,
    confirmButtonText: '📄 Generate PDF Receipt',
    cancelButtonText: 'Continue',
    confirmButtonColor: '#10B981',
    cancelButtonColor: '#6B7280'
  }).then((result) => {
    if (result.isConfirmed) {
      generateReceiptPDF(receipt.id);
    }
  });
  
  // Clear form and refresh display
  clearReceiptForm();
  loadPaymentReceipts();
  updatePaymentSummary();
}

// Generate unique receipt number
function generateReceiptNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-4);
  return `DR-${year}${month}${day}-${timestamp}`;
}

// Clear receipt form
function clearReceiptForm() {
  document.getElementById('receiptForm').reset();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('receiptDate').value = today;
}

// Load and display payment receipts
function loadPaymentReceipts() {
  const tableBody = document.getElementById('receiptTableBody');
  const noReceipts = document.getElementById('noReceipts');
  
  if (paymentReceipts.length === 0) {
    tableBody.innerHTML = '';
    noReceipts.classList.remove('hidden');
    return;
  }
  
  noReceipts.classList.add('hidden');
  
  // Apply current filters
  const filteredReceipts = getFilteredReceipts();
  
  if (filteredReceipts.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="px-4 py-8 text-center text-gray-500">
          No payment receipts match the current filter criteria.
        </td>
      </tr>
    `;
    return;
  }
  
  tableBody.innerHTML = filteredReceipts.map(receipt => `
    <tr class="hover:bg-gray-50">
      <td class="px-4 py-3 text-sm text-gray-900">${new Date(receipt.date).toLocaleDateString()}</td>
      <td class="px-4 py-3 text-sm font-mono text-blue-600">${receipt.receiptNumber}</td>
      <td class="px-4 py-3 text-sm">
        <div class="font-semibold text-gray-900">${receipt.clientName}</div>
        <div class="text-xs text-gray-500">${receipt.clientPackage}</div>
      </td>
      <td class="px-4 py-3 text-sm">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentMethodColor(receipt.paymentMethod)}">
          ${receipt.paymentMethod}
        </span>
      </td>
      <td class="px-4 py-3 text-sm text-gray-600">${receipt.servicePeriod || 'Not specified'}</td>
      <td class="px-4 py-3 text-sm text-right font-semibold">KES ${receipt.amount.toLocaleString()}</td>
      <td class="px-4 py-3 text-center">
        <div class="flex justify-center space-x-2">
          <button onclick="viewReceipt('${receipt.id}')" class="text-blue-600 hover:text-blue-800 transition" title="View Details">
            👁️
          </button>
          <button onclick="generateReceiptPDF('${receipt.id}')" class="text-green-600 hover:text-green-800 transition" title="Generate PDF">
            📄
          </button>
          <button onclick="editReceipt('${receipt.id}')" class="text-yellow-600 hover:text-yellow-800 transition" title="Edit">
            ✏️
          </button>
          <button onclick="deleteReceipt('${receipt.id}')" class="text-red-600 hover:text-red-800 transition" title="Delete">
            🗑️
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Get payment method color styling
function getPaymentMethodColor(method) {
  switch (method) {
    case 'M-PESA': return 'bg-green-100 text-green-800';
    case 'Bank Transfer': return 'bg-blue-100 text-blue-800';
    case 'Cash': return 'bg-yellow-100 text-yellow-800';
    case 'Cheque': return 'bg-purple-100 text-purple-800';
    case 'Airtel Money': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Update payment summary cards
function updatePaymentSummary() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Calculate today's payments
  const todayPayments = paymentReceipts
    .filter(receipt => receipt.date === today)
    .reduce((sum, receipt) => sum + receipt.amount, 0);
  
  // Calculate monthly payments
  const monthlyPayments = paymentReceipts
    .filter(receipt => {
      const receiptDate = new Date(receipt.date);
      return receiptDate.getMonth() === currentMonth && receiptDate.getFullYear() === currentYear;
    })
    .reduce((sum, receipt) => sum + receipt.amount, 0);
  
  // Calculate yearly payments
  const yearlyPayments = paymentReceipts
    .filter(receipt => {
      const receiptDate = new Date(receipt.date);
      return receiptDate.getFullYear() === currentYear;
    })
    .reduce((sum, receipt) => sum + receipt.amount, 0);
  
  // Update display
  document.getElementById('todayPayments').textContent = `KES ${todayPayments.toLocaleString()}`;
  document.getElementById('monthlyPayments').textContent = `KES ${monthlyPayments.toLocaleString()}`;
  document.getElementById('yearlyPayments').textContent = `KES ${yearlyPayments.toLocaleString()}`;
  document.getElementById('totalReceipts').textContent = paymentReceipts.length.toLocaleString();
}

// Get filtered receipts based on current filter settings
function getFilteredReceipts() {
  const clientFilter = document.getElementById('receiptFilterClient').value;
  const monthFilter = document.getElementById('receiptFilterMonth').value;
  
  return paymentReceipts.filter(receipt => {
    // Client filter
    if (clientFilter !== 'all' && receipt.clientId !== clientFilter) {
      return false;
    }
    
    // Month filter
    if (monthFilter) {
      const receiptMonth = receipt.date.slice(0, 7); // YYYY-MM format
      if (receiptMonth !== monthFilter) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
}

// Filter receipts
function filterReceipts() {
  loadPaymentReceipts();
}

// View receipt details
function viewReceipt(receiptId) {
  const receipt = paymentReceipts.find(r => r.id === receiptId);
  if (!receipt) return;
  
  Swal.fire({
    title: 'Payment Receipt Details',
    html: `
      <div class="text-left space-y-3">
        <div><strong>Receipt #:</strong> ${receipt.receiptNumber}</div>
        <div><strong>Client:</strong> ${receipt.clientName}</div>
        <div><strong>Package:</strong> ${receipt.clientPackage}</div>
        <div><strong>Amount:</strong> KES ${receipt.amount.toLocaleString()}</div>
        <div><strong>Payment Date:</strong> ${new Date(receipt.date).toLocaleDateString()}</div>
        <div><strong>Payment Method:</strong> ${receipt.paymentMethod}</div>
        ${receipt.reference ? `<div><strong>Reference:</strong> ${receipt.reference}</div>` : ''}
        ${receipt.servicePeriod ? `<div><strong>Service Period:</strong> ${receipt.servicePeriod}</div>` : ''}
        ${receipt.notes ? `<div><strong>Notes:</strong> ${receipt.notes}</div>` : ''}
        <div><strong>Created:</strong> ${new Date(receipt.createdAt).toLocaleString()}</div>
        <div><strong>Created By:</strong> ${receipt.createdBy}</div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '📄 Generate PDF',
    cancelButtonText: 'Close',
    confirmButtonColor: '#10B981',
    cancelButtonColor: '#6B7280'
  }).then((result) => {
    if (result.isConfirmed) {
      generateReceiptPDF(receiptId);
    }
  });
}

// Generate PDF receipt
function generateReceiptPDF(receiptId) {
  const receipt = paymentReceipts.find(r => r.id === receiptId);
  if (!receipt) {
    Swal.fire({
      title: 'Receipt Not Found',
      text: 'The requested receipt could not be found.',
      icon: 'error',
      confirmButtonColor: '#EF4444'
    });
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  
  // Company header
  pdf.setFontSize(20);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('DR.NET INNOVATIONS', 20, 25);
  
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('INNOVATIVE CONNECTIONS WITH DOCTORS PRECISION', 20, 33);
  pdf.text('Email: dr.netinnovations@gmail.com | Website: https://drnet.co.ke/', 20, 40);
  pdf.text('P.O. Box 105876 - 00100 NAIROBI', 20, 47);
  pdf.text('Phone: +254111357066', 20, 54);
  
  // Receipt title
  pdf.setFontSize(18);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('PAYMENT RECEIPT', 20, 70);
  
  // Receipt details
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  
  let y = 85;
  pdf.text(`Receipt No: ${receipt.receiptNumber}`, 20, y);
  pdf.text(`Date: ${new Date(receipt.date).toLocaleDateString()}`, 120, y);
  
  y += 15;
  pdf.text('RECEIVED FROM:', 20, y);
  
  y += 10;
  pdf.setFont(undefined, 'bold');
  pdf.text(receipt.clientName, 20, y);
  
  y += 8;
  pdf.setFont(undefined, 'normal');
  pdf.text(`Package: ${receipt.clientPackage}`, 20, y);
  
  // Amount box
  y += 25;
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.5);
  pdf.rect(20, y - 5, 170, 30);
  
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.text('AMOUNT RECEIVED:', 25, y + 5);
  pdf.text(`KES ${receipt.amount.toLocaleString()}`, 25, y + 18);
  
  // Payment details
  y += 45;
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Payment Method: ${receipt.paymentMethod}`, 20, y);
  
  if (receipt.reference) {
    y += 10;
    pdf.text(`Transaction Reference: ${receipt.reference}`, 20, y);
  }
  
  if (receipt.servicePeriod) {
    y += 10;
    pdf.text(`Service Period: ${receipt.servicePeriod}`, 20, y);
  }
  
  if (receipt.notes) {
    y += 15;
    pdf.text('Notes:', 20, y);
    y += 8;
    const splitNotes = pdf.splitTextToSize(receipt.notes, 170);
    pdf.text(splitNotes, 20, y);
    y += splitNotes.length * 6;
  }
  
  // Footer
  y += 30;
  pdf.setFontSize(10);
  pdf.text('This is a computer-generated receipt and does not require a signature.', 20, y);
  y += 8;
  pdf.text(`Generated on: ${new Date().toLocaleString()} by ${receipt.createdBy}`, 20, y);
  
  // Thank you note
  y += 20;
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Thank you for your payment!', 20, y);
  
  // Save the PDF
  pdf.save(`Receipt_${receipt.receiptNumber}_${receipt.clientName.replace(/\s+/g, '_')}.pdf`);
  
  Swal.fire({
    title: 'Receipt Generated!',
    text: `PDF receipt for ${receipt.clientName} has been generated and downloaded.`,
    icon: 'success',
    confirmButtonColor: '#10B981'
  });
}

// Edit receipt
function editReceipt(receiptId) {
  const receipt = paymentReceipts.find(r => r.id === receiptId);
  if (!receipt) return;
  
  // Populate form with receipt data
  document.getElementById('receiptClient').value = receipt.clientName;
  document.getElementById('receiptAmount').value = receipt.amount;
  document.getElementById('receiptDate').value = receipt.date;
  document.getElementById('receiptPaymentMethod').value = receipt.paymentMethod;
  document.getElementById('receiptReference').value = receipt.reference || '';
  document.getElementById('receiptServicePeriod').value = receipt.servicePeriod || '';
  document.getElementById('receiptNotes').value = receipt.notes || '';
  
  // Remove the receipt from array (will be re-added when form is submitted)
  paymentReceipts = paymentReceipts.filter(r => r.id !== receiptId);
  localStorage.setItem('paymentReceipts', JSON.stringify(paymentReceipts));
  
  // Refresh display
  loadPaymentReceipts();
  updatePaymentSummary();
  
  // Scroll to form
  document.getElementById('receiptForm').scrollIntoView({ behavior: 'smooth' });
  
  Swal.fire({
    title: 'Edit Mode',
    text: 'Receipt loaded in form for editing. Make your changes and submit.',
    icon: 'info',
    confirmButtonColor: '#3B82F6'
  });
}

// Delete receipt
function deleteReceipt(receiptId) {
  const receipt = paymentReceipts.find(r => r.id === receiptId);
  if (!receipt) return;
  
  Swal.fire({
    title: 'Delete Receipt?',
    text: `Are you sure you want to delete receipt ${receipt.receiptNumber} for ${receipt.clientName}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      paymentReceipts = paymentReceipts.filter(r => r.id !== receiptId);
      localStorage.setItem('paymentReceipts', JSON.stringify(paymentReceipts));
      
      loadPaymentReceipts();
      updatePaymentSummary();
      
      Swal.fire({
        title: 'Deleted!',
        text: 'Payment receipt has been deleted.',
        icon: 'success',
        confirmButtonColor: '#10B981'
      });
    }
  });
}

// Export receipts to CSV
function exportReceipts() {
  const filteredReceipts = getFilteredReceipts();
  
  if (filteredReceipts.length === 0) {
    Swal.fire({
      title: 'No Data',
      text: 'No payment receipts to export with current filters.',
      icon: 'info',
      confirmButtonColor: '#3B82F6'
    });
    return;
  }
  
  // Create CSV content
  const headers = ['Receipt Number', 'Date', 'Client Name', 'Package', 'Amount', 'Payment Method', 'Reference', 'Service Period', 'Notes'];
  const csvContent = [
    headers.join(','),
    ...filteredReceipts.map(receipt => [
      `"${receipt.receiptNumber}"`,
      receipt.date,
      `"${receipt.clientName.replace(/"/g, '""')}"`,
      `"${receipt.clientPackage.replace(/"/g, '""')}"`,
      receipt.amount,
      receipt.paymentMethod,
      `"${(receipt.reference || '').replace(/"/g, '""')}"`,
      `"${(receipt.servicePeriod || '').replace(/"/g, '""')}"`,
      `"${(receipt.notes || '').replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');
  
  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `payment_receipts_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  Swal.fire({
    title: 'Exported!',
    text: `${filteredReceipts.length} payment receipts exported successfully.`,
    icon: 'success',
    confirmButtonColor: '#10B981'
  });
}