// Toast Notifications

export function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toast-container') || createToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  // Auto-remove
  if (duration > 0) {
    setTimeout(() => toast.remove(), duration);
  }

  return toast;
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 400px;
  `;
  document.body.appendChild(container);
  return container;
}

// Styles
const style = document.createElement('style');
style.textContent = `
  .toast {
    background: var(--primary);
    color: var(--accent);
    padding: 15px 20px;
    border-radius: 10px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    font-weight: 500;
    animation: slideIn 0.3s ease;
    min-width: 250px;
  }

  .toast-success {
    background: var(--success);
    color: white;
  }

  .toast-error,
  .toast-danger {
    background: var(--danger);
    color: white;
  }

  .toast-warning {
    background: var(--warning);
    color: white;
  }

  .toast-info {
    background: var(--info);
    color: white;
  }

  .toast-close {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 18px;
    padding: 0;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .toast-close:hover {
    opacity: 1;
  }

  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @media (max-width: 640px) {
    .toast {
      min-width: 200px;
      font-size: 13px;
      padding: 12px 15px;
    }
  }
`;
document.head.appendChild(style);

// Helpers
export function showSuccess(message, duration) {
  return showToast(message, 'success', duration);
}

export function showError(message, duration) {
  return showToast(message, 'error', duration);
}

export function showWarning(message, duration) {
  return showToast(message, 'warning', duration);
}

export function showInfo(message, duration) {
  return showToast(message, 'info', duration);
}

console.log('✅ Toast carregado');