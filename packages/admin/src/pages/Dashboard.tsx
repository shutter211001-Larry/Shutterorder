export default function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Orders Today', 'Revenue', 'Reservations', 'Active Items'].map((label) => (
          <div key={label} className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">--</p>
          </div>
        ))}
      </div>
    </div>
  );
}
