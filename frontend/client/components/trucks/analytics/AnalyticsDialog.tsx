import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import AnalyticsTruck from "../../dashboard/analyticsTruck";

interface AnalyticsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnalyticsDialog({ isOpen, onOpenChange }: AnalyticsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Truck Analytics Dashboard</DialogTitle>
          <DialogDescription>
            Comprehensive analytics and insights for truck operations
          </DialogDescription>
        </DialogHeader>
        <AnalyticsTruck />
      </DialogContent>
    </Dialog>
  );
}