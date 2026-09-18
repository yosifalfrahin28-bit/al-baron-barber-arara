import './shop-background.css';

/** Decorative photos only: never intercept scrolling or form input. */
export function ShopBackground() {
  const base = import.meta.env.BASE_URL || '/';
  return (
    <div className="shop-photo-background" aria-hidden="true">
      <img className="shop-photo-base" src={`${base}barber-shop-background-1.jpeg`} alt="" />
      <img className="shop-photo-detail" src={`${base}barber-shop-background-2.jpeg`} alt="" />
      <div className="shop-photo-shade" />
    </div>
  );
}