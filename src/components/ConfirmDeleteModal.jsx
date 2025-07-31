import { Modal, Text, Button, Group, Alert } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

function ConfirmDeleteModal({ 
  opened, 
  onClose, 
  onConfirm, 
  selectedCount, 
  isDeleting = false 
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Confirm Deletion"
      centered
      size="sm"
    >
      <Alert
        icon={<IconAlertTriangle size={16} />}
        color="yellow"
        mb="md"
      >
        <Text size="sm">
          This action cannot be undone. Are you sure you want to delete{" "}
          <strong>{selectedCount}</strong> search histor{selectedCount === 1 ? "y" : "ies"}?
        </Text>
      </Alert>

      <Group justify="flex-end" mt="md">
        <Button 
          variant="default" 
          onClick={onClose}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button 
          color="red" 
          onClick={onConfirm}
          loading={isDeleting}
          disabled={isDeleting}
        >
          Delete {selectedCount} Item{selectedCount === 1 ? "" : "s"}
        </Button>
      </Group>
    </Modal>
  );
}

export default ConfirmDeleteModal;
