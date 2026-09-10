import { useEffect, useState } from 'react';

type ModalId = 'cart' | 'checkout' | 'order' | 'history';

export const useModalState = () => {
  const [activeModal, setActiveModal] = useState<ModalId | null>(null);

  const isCartModalOpen = activeModal === 'cart';
  const isCheckoutModalOpen = activeModal === 'checkout';
  const isOrderModalOpen = activeModal === 'order';
  const isHistoryModalOpen = activeModal === 'history';

  const closeAll = () => {
    setActiveModal(null);
  };

  const openModal = (modalId: ModalId) => {
    setActiveModal(modalId);
  };

  const closeModal = (modalId: ModalId) => {
    setActiveModal((current) => (current === modalId ? null : current));
  };

  const setIsCartModalOpen = (isOpen: boolean) => {
    if (isOpen) {
      openModal('cart');
      return;
    }
    closeModal('cart');
  };

  const setIsCheckoutModalOpen = (isOpen: boolean) => {
    if (isOpen) {
      openModal('checkout');
      return;
    }
    closeModal('checkout');
  };

  const setIsOrderModalOpen = (isOpen: boolean) => {
    if (isOpen) {
      openModal('order');
      return;
    }
    closeModal('order');
  };

  const setIsHistoryModalOpen = (isOpen: boolean) => {
    if (isOpen) {
      openModal('history');
      return;
    }
    closeModal('history');
  };

  useEffect(() => {
    if (!activeModal) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAll();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeModal]);

  const openCartModal = () => {
    openModal('cart');
  };

  const openHistoryModal = () => {
    openModal('history');
  };

  const openCheckoutFromCart = () => {
    openModal('checkout');
  };

  return {
    isCartModalOpen,
    isCheckoutModalOpen,
    isOrderModalOpen,
    isHistoryModalOpen,
    setIsCartModalOpen,
    setIsCheckoutModalOpen,
    setIsOrderModalOpen,
    setIsHistoryModalOpen,
    openModal,
    closeModal,
    closeAll,
    openCartModal,
    openHistoryModal,
    openCheckoutFromCart,
  };
};
