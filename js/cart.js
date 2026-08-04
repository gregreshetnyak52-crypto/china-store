/* Корзина — localStorage, без бэкенда. Требует предварительной загрузки js/products.js */
var CART_KEY = 'cs_cart_v2';

function formatPrice(n){
  return n.toLocaleString('ru-RU') + ' ₽';
}

function findProduct(slug){
  return PRODUCTS.filter(function(p){ return p.slug === slug; })[0] || null;
}

function getCart(){
  var raw;
  try { raw = localStorage.getItem(CART_KEY); } catch(e){ return []; }
  if (!raw) return [];
  try {
    var items = JSON.parse(raw);
    if (!Array.isArray(items)) return [];
    return items.filter(function(it){ return it && typeof it.slug === 'string' && findProduct(it.slug); });
  } catch(e){ return []; }
}

function saveCart(items){
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch(e){}
  updateCartBadges();
}

function cartAdd(slug, qty){
  qty = qty || 1;
  if (!findProduct(slug)) return;
  var items = getCart();
  var existing = items.filter(function(it){ return it.slug === slug; })[0];
  if (existing){ existing.qty += qty; }
  else { items.push({ slug: slug, qty: qty }); }
  saveCart(items);
}

function cartRemove(slug){
  var items = getCart().filter(function(it){ return it.slug !== slug; });
  saveCart(items);
}

function cartSetQty(slug, qty){
  qty = Math.max(0, Math.floor(qty) || 0);
  var items = getCart();
  if (qty === 0){
    items = items.filter(function(it){ return it.slug !== slug; });
  } else {
    var existing = items.filter(function(it){ return it.slug === slug; })[0];
    if (existing) existing.qty = qty;
  }
  saveCart(items);
}

function clearCart(){
  saveCart([]);
}

function cartItemsWithData(){
  return getCart().map(function(it){
    return { slug: it.slug, qty: it.qty, product: findProduct(it.slug) };
  });
}

function cartTotalCount(){
  return getCart().reduce(function(sum, it){ return sum + it.qty; }, 0);
}

function cartTotalPrice(){
  return cartItemsWithData().reduce(function(sum, it){ return sum + (it.product ? it.product.price * it.qty : 0); }, 0);
}

function updateCartBadges(){
  var count = cartTotalCount();
  document.querySelectorAll('.nav-cart-badge').forEach(function(el){
    el.textContent = count;
    el.classList.toggle('show', count > 0);
  });
}

function showToast(text){
  var existing = document.getElementById('csToast');
  if (existing) existing.remove();
  var toast = document.createElement('div');
  toast.id = 'csToast';
  toast.className = 'cs-toast';
  toast.textContent = text;
  document.body.appendChild(toast);
  requestAnimationFrame(function(){ toast.classList.add('show'); });
  setTimeout(function(){
    toast.classList.remove('show');
    setTimeout(function(){ toast.remove(); }, 350);
  }, 1800);
}

function buildOrderMessage(items, customer, orderId){
  var lines = [];
  lines.push('Здравствуйте! Оформляю заказ №' + orderId + ' на сайте.');
  lines.push('');
  lines.push('Состав заказа:');
  items.forEach(function(it){
    if (!it.product) return;
    lines.push('— ' + it.product.name + ' × ' + it.qty + ' = ' + formatPrice(it.product.price * it.qty));
  });
  lines.push('');
  lines.push('Итого: ' + formatPrice(items.reduce(function(s, it){ return s + (it.product ? it.product.price * it.qty : 0); }, 0)));
  lines.push('');
  if (customer.name) lines.push('Имя: ' + customer.name);
  if (customer.phone) lines.push('Телефон: ' + customer.phone);
  if (customer.address) lines.push('Адрес доставки: ' + customer.address);
  if (customer.comment) lines.push('Комментарий: ' + customer.comment);
  return lines.join('\n');
}

function openChannel(channel, text, waPhone, tgUser){
  var encoded = encodeURIComponent(text);
  var url = channel === 'wa'
    ? ('https://wa.me/' + waPhone + '?text=' + encoded)
    : ('https://t.me/' + tgUser + '?text=' + encoded);
  window.open(url, '_blank', 'noopener');
}

document.addEventListener('DOMContentLoaded', function(){
  updateCartBadges();
  document.addEventListener('click', function(e){
    var btn = e.target.closest('[data-add-cart]');
    if (!btn) return;
    var slug = btn.getAttribute('data-add-cart');
    if (!slug) return;
    cartAdd(slug, 1);
    var product = findProduct(slug);
    showToast((product ? product.name : 'Товар') + ' добавлен в корзину');
  });
});
