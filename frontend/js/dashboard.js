// frontend/js/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('accessToken')) {
    window.location.href = 'login.html';
    return;
  }

  await loadDashboard();
});

async function loadDashboard() {
  try {
    // 1. Get current subscription
    const { subscription } = await fetchAPI('/subscriptions/me');
    
    document.getElementById('plan-display-name').textContent = subscription.plan.displayName;
    
    const cycleStart = new Date(subscription.currentPeriodStart).toLocaleDateString();
    const cycleEnd = new Date(subscription.currentPeriodEnd).toLocaleDateString();
    document.getElementById('billing-cycle').textContent = `Cycle period: ${cycleStart} to ${cycleEnd}`;

    // 2. Set sub actions based on active level
    const actionContainer = document.getElementById('sub-action-container');
    if (subscription.status === 'FREE') {
      actionContainer.innerHTML = `<button class="btn" onclick="toggleUpgradeSidebar(true)">Upgrade to Pro</button>`;
      document.getElementById('pricing-sidebar').style.display = 'block';
    } else {
      document.getElementById('pricing-sidebar').style.display = 'none';
      if (subscription.cancelAtPeriodEnd) {
        actionContainer.innerHTML = `<span style="color: var(--danger); font-weight: 500; margin-right: 1rem;">Cancelling on ${cycleEnd}</span>`;
      } else {
        actionContainer.innerHTML = `<button class="btn btn-secondary" onclick="cancelSubscription()">Cancel Subscription</button>`;
      }
    }

    // 3. Load Usage stats
    const { usage } = await fetchAPI('/billing/usage');
    document.getElementById('usage-text').textContent = `${usage.used.toLocaleString()} / ${usage.limit.toLocaleString()} API calls used`;
    document.getElementById('usage-percent').textContent = `${usage.percentage}%`;
    document.getElementById('usage-bar').style.width = `${usage.percentage}%`;

    // 4. Fill upgrades sidebar if they are free
    if (subscription.status === 'FREE') {
      await loadUpgradePlans(subscription.planId);
    }

  } catch (err) {
    console.error('Error loading dashboard:', err);
    alert('Session expired or DB offline. Logging out.');
    localStorage.clear();
    window.location.href = 'login.html';
  }
}

async function loadUpgradePlans(currentPlanId) {
  const { plans } = await fetchAPI('/plans');
  const availableContainer = document.getElementById('available-upgrades');
  availableContainer.innerHTML = '';

  const premiumPlans = plans.filter(p => p.id !== currentPlanId);

  premiumPlans.forEach(plan => {
    const formattedPrice = (Number(plan.price) / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });

    const card = document.createElement('div');
    card.style = 'border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem;';
    card.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 0.25rem;">${plan.displayName}</div>
      <div style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem;">${formattedPrice} <span style="font-size: 0.85rem; font-weight: 400; color: var(--text-secondary);">/month</span></div>
      <button class="btn" style="width: 100%; padding: 0.5rem;" onclick="purchasePlan('${plan.id}')">Subscribe</button>
    `;
    availableContainer.appendChild(card);
  });
}

function toggleUpgradeSidebar(show) {
  const sidebar = document.getElementById('pricing-sidebar');
  sidebar.style.display = show ? 'block' : 'none';
}

async function purchasePlan(planId) {
  try {
    // 1. Create order on backend
    const orderData = await fetchAPI('/subscriptions/create-order', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });

    // 2. Open Razorpay Checkout overlay standard window
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'PaySaaS Corp',
      description: 'Monthly Subscriptions Payment',
      order_id: orderData.orderId,
      handler: async function (response) {
        // This callback triggers on client verification success
        try {
          await verifyRazorpayPayment(response, planId);
        } catch (err) {
          alert('Verification failed: ' + err.message);
        }
      },
      prefill: {
        email: 'user@example.com',
      },
      theme: {
        color: '#6366f1',
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();

  } catch (err) {
    alert('Checkout initialization failed: ' + err.message);
  }
}

async function verifyRazorpayPayment(rzpResponse, planId) {
  const payload = {
    razorpay_order_id: rzpResponse.razorpay_order_id,
    razorpay_payment_id: rzpResponse.razorpay_payment_id,
    razorpay_signature: rzpResponse.razorpay_signature,
    planId,
  };

  const response = await fetchAPI('/subscriptions/verify-payment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response) {
    alert('Payment successful! Your plan has been upgraded.');
    window.location.reload();
  }
}

async function cancelSubscription() {
  if (!confirm('Are you sure you want to cancel your plan?')) return;

  try {
    await fetchAPI('/subscriptions/cancel', { method: 'POST' });
    alert('Subscription successfully cancelled.');
    window.location.reload();
  } catch (err) {
    alert(err.message);
  }
}
