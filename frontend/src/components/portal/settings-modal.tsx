"use client";
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { useEffect, useState } from 'react';

export type Settings = {
  displayName: string;
}

type SettingsModalProps = {
  isOpen: boolean;
  currentSettings?: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

export default function SettingsModal(props: SettingsModalProps) {
  const { isOpen, currentSettings, onSave, onClose } = props;
  const [settings, setSettings] = useState<Settings>(currentSettings || { displayName: "" });

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

  return <>
    <Modal isOpen={isOpen} onClose={onClose} title="設定">
      <ModalContent>
        <ModalHeader>
        </ModalHeader>
        <ModalBody>
          <Input
            label="ユーザー名"
            value={settings.displayName}
            onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
          />
        </ModalBody>
        <ModalFooter className="flex justify-end gap-2">
          <Button
            variant="flat"
            onPress={onClose}
          >キャンセル</Button>
          <Button
            variant="solid"
            onPress={() => {
              onSave(settings);
              onClose();
            }}
          >保存</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  </>
}
