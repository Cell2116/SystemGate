import { Button } from "../../ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface OperationSelectorProps {
  onSelectOperation: (operation: "bongkar" | "muat") => void;
}

export function OperationSelector({ onSelectOperation }: OperationSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Button
          type="button"
          onClick={() => onSelectOperation("bongkar")}
          className="h-24 flex flex-col items-center justify-center space-y-2 bg-red-500 hover:bg-red-700"
        >
          <ArrowLeft className="w-9 h-9" />
          <span className="text-lg font-semibold">Bongkar</span>
          <span className="text-xs opacity-80">
            Unloading Operation
          </span>
        </Button>

        <Button
          type="button"
          onClick={() => onSelectOperation("muat")}
          className="h-24 flex flex-col items-center justify-center space-y-2 bg-green-500 hover:bg-green-700"
        >
          <ArrowRight className="w-8 h-8" />
          <span className="text-lg font-semibold">Muat</span>
          <span className="text-xs opacity-80">
            Loading Operation
          </span>
        </Button>
      </div>
    </div>
  );
}