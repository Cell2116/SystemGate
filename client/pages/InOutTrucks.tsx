import Clock2 from "../components/dashboard/clock"

export default function InOutTrucks() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbound / Outbound Trucks</h1>
          <p className="mt-1 text-sm text-gray-500">
            See which trucks have entered or exited the site today.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Clock2/>
        </div>
      </div>
    </div>
  );
}