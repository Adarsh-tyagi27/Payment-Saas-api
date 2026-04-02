// frontend/js/billing.js
document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('accessToken')) {
    window.location.href = 'login.html';
    return;
  }

  await loadInvoices();
});

async function loadInvoices() {
  const tbody = document.getElementById('invoice-tbody');
  
  try {
    const { invoices } = await fetchAPI('/billing/invoices');

    if (invoices.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No invoices generated yet. Buy a premium plan to see history!</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = '';
    invoices.forEach(inv => {
      const row = document.createElement('tr');
      
      const formattedAmount = (Number(inv.amount) / 100).toLocaleString('en-IN', {
        style: 'currency',
        currency: inv.currency
      });

      const dateStr = new Date(inv.createdAt).toLocaleDateString();

      row.innerHTML = `
        <td style="font-family: monospace; font-size: 0.9rem;">${inv.razorpayOrderId}</td>
        <td style="font-family: monospace; font-size: 0.9rem;">${inv.razorpayPaymentId}</td>
        <td style="font-weight: 500;">${formattedAmount}</td>
        <td>${dateStr}</td>
        <td><span class="status-badge ${inv.status.toLowerCase()}">${inv.status}</span></td>
      `;
      tbody.appendChild(row);
    });

  } catch (err) {
    console.error('Error fetching billing info:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--danger); padding: 2rem;">Error fetching records: ${err.message}</td>
      </tr>
    `;
  }
}
