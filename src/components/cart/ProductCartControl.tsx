"use client";

import { useCart } from "@/components/cart/CartProvider";
import type { MoyskladAssortmentItem } from "@/lib/moysklad";

type Props = {
  item: MoyskladAssortmentItem;
  size?: "sm" | "md";
};

export default function ProductCartControl({ item, size = "sm" }: Props) {
  const { addItem, items: cartItems, setQuantity } = useCart();
  const quantityInCart = cartItems.find((cartItem) => cartItem.id === item.id)?.quantity ?? 0;

  const handleIncrease = () => setQuantity(item.id, quantityInCart + 1);
  const handleDecrease = () => {
    if (quantityInCart <= 1) {
      setQuantity(item.id, 0);
      return;
    }
    setQuantity(item.id, quantityInCart - 1);
  };
  const handleQuantityInput = (value: string) => {
    const parsed = Number(value.replace(/[^0-9]/g, ""));
    if (Number.isNaN(parsed)) return;
    setQuantity(item.id, Math.max(0, parsed));
  };

  const isSmall = size === "sm";

  if (quantityInCart === 0) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          addItem({
            id: item.id,
            name: item.name,
            article: item.article,
            code: item.code,
            price: item.salePrices?.[0]?.value,
          });
        }}
        className={
          isSmall
            ? "rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
            : "rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
        }
      >
        В корзину
      </button>
    );
  }

  return (
    <div
      className={
        isSmall
          ? "flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/70 px-2 py-0.5"
          : "flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-1.5"
      }
    >
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          handleDecrease();
        }}
        className={
          isSmall
            ? "flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-amber-700 shadow hover:bg-amber-100"
            : "flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-amber-700 shadow hover:bg-amber-100"
        }
        aria-label="Уменьшить количество"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={quantityInCart}
        onClick={(event) => event.preventDefault()}
        onChange={(event) => handleQuantityInput(event.target.value)}
        className={
          isSmall
            ? "h-5 w-10 rounded-md border border-transparent bg-transparent text-center text-[11px] font-semibold text-amber-900 outline-none"
            : "h-8 w-14 rounded-md border border-transparent bg-transparent text-center text-sm font-semibold text-amber-900 outline-none"
        }
      />
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          handleIncrease();
        }}
        className={
          isSmall
            ? "flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-amber-700 shadow hover:bg-amber-100"
            : "flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-amber-700 shadow hover:bg-amber-100"
        }
        aria-label="Увеличить количество"
      >
        +
      </button>
    </div>
  );
}
