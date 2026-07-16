/**
 * Lightweight Bootstrap 5 data-attribute handler.
 * Handles data-bs-toggle="dropdown|modal" and data-bs-dismiss="modal"
 * so the app doesn't need the full Bootstrap JS bundle.
 */
document.addEventListener('click', function (e) {
  var target = e.target.closest('[data-bs-toggle]');

  // --- Dropdown ---
  if (target && target.getAttribute('data-bs-toggle') === 'dropdown') {
    e.preventDefault();
    e.stopPropagation();
    var dropdown = target.closest('.dropdown');
    if (!dropdown) return;
    var wasOpen = dropdown.classList.contains('show');
    closeAllDropdowns();
    if (!wasOpen) {
      dropdown.classList.add('show');
      var menu = dropdown.querySelector('.dropdown-menu');
      if (menu) menu.classList.add('show');
    }
    return;
  }

  // --- Modal open ---
  if (target && target.getAttribute('data-bs-toggle') === 'modal') {
    e.preventDefault();
    var selector = target.getAttribute('data-bs-target');
    if (!selector) return;
    var modal = document.querySelector(selector);
    if (modal) openModal(modal);
    return;
  }

  // --- Modal dismiss ---
  var dismiss = e.target.closest('[data-bs-dismiss="modal"]');
  if (dismiss) {
    var modal = dismiss.closest('.modal');
    if (modal) closeModal(modal);
    return;
  }

  // --- Close dropdowns on outside click ---
  closeAllDropdowns();
});

// Close modal on backdrop click
document.addEventListener('click', function (e) {
  if (e.target.classList && e.target.classList.contains('modal') && e.target.classList.contains('show')) {
    closeModal(e.target);
  }
}, true);

// Close modal on Escape
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    var openModal = document.querySelector('.modal.show');
    if (openModal) closeModal(openModal);
    closeAllDropdowns();
  }
});

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown.show').forEach(function (d) {
    d.classList.remove('show');
    var menu = d.querySelector('.dropdown-menu');
    if (menu) menu.classList.remove('show');
  });
}

function openModal(modal) {
  modal.classList.add('show');
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal.classList.remove('show');
  modal.style.display = 'none';
  document.body.style.overflow = '';
}
