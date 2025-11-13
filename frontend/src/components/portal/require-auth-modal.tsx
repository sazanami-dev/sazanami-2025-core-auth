"use client";
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { useEffect, useState } from 'react';

type RequireAuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onBeforeAuth: () => void;
  onProceedWithoutAuth: () => void;
}

export default function RequireAuthModal(props: RequireAuthModalProps) {
  const { isOpen, onClose, onBeforeAuth, onProceedWithoutAuth } = props;

  return <>
    <Modal isOpen={isOpen} onClose={onClose} title="設定">
      <ModalContent>
        <ModalHeader>
          <p>警告</p>
        </ModalHeader>
        <ModalBody>
          <p>このサービスは一部で認証を要求します。事前に認証を行いますか？</p>
        </ModalBody>
        <ModalFooter className="flex justify-end gap-2">
          <Button
            variant="flat"
            onPress={onClose}
          >キャンセル</Button>
          <Button
            variant="solid"
            onPress={() => {
              onProceedWithoutAuth();
              onClose();
            }}
          >認証せずに続行</Button>
          <Button
            variant="solid"
            onPress={() => {
              onBeforeAuth();
              onClose();
            }}
          >認証する</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  </>
}
