import { useEffect, useId, useRef, type ReactNode } from 'react';
import {
  Apple,
  ArrowUpRight,
  Banknote,
  Building2,
  CircleDollarSign,
  Flower,
  Landmark,
  Layers,
  Send,
  ShoppingBag,
  WalletCards,
  X,
} from 'lucide-react';
import type { Contact, Entry } from './model';
import alex from './assets/alex.png';
import maya from './assets/maya.png';
import noah from './assets/noah.png';
export const photos: Record<string, string> = { alex, maya, noah };
export function Avatar({ contact }: { contact: Contact }) {
  const photo = contact.avatar && photos[contact.avatar];
  return photo ? (
    <img className="avatar" alt="" src={photo} />
  ) : (
    <span className="initials">
      {contact.name
        .split(/\s+/)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()}
    </span>
  );
}
export function Jump({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="jump" aria-label={label} title={label} onClick={onClick}>
      <ArrowUpRight size={17} />
    </button>
  );
}
export function Money({
  cents,
  hidden = false,
}: {
  cents: number;
  hidden?: boolean;
}) {
  if (hidden) return <>••••</>;
  const [whole, dec] = (Math.abs(cents) / 100)
    .toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .split('.');
  return (
    <>
      {cents < 0 ? '−' : ''}${whole}
      <small>.{dec}</small>
    </>
  );
}
export function Merchant({ entry: e }: { entry: Entry }) {
  const icon =
    e.title === 'Adobe Creative Cloud' ? (
      <b className="adobe">A</b>
    ) : e.title === 'Apple' ? (
      <Apple />
    ) : e.title === 'Walmart' ? (
      <Flower />
    ) : e.title === 'PayPal' ? (
      <b className="paypal">P</b>
    ) : e.title === 'Chase' ? (
      <Landmark />
    ) : e.kind === 'transfer' ? (
      <Send />
    ) : e.kind === 'income' ? (
      <Banknote />
    ) : e.kind === 'topup' ? (
      <WalletCards />
    ) : e.kind === 'savings' ? (
      <Layers />
    ) : e.kind === 'goal' ? (
      <CircleDollarSign />
    ) : e.category === 'Other' ? (
      <Building2 />
    ) : (
      <ShoppingBag />
    );
  return <span className="merchant-icon">{icon}</span>;
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => {
      el?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="dialog-heading">
        <h2 id={id}>{title}</h2>
        <button className="circle" aria-label="Close dialog" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
