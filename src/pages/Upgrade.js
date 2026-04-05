import { useNavigate } from 'react-router-dom';

function Upgrade() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center px-6">

      <div className="max-w-lg w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center backdrop-blur">

        {/* HEADER */}
        <h1 className="text-2xl font-semibold mb-2">
          Upgrade your workspace
        </h1>

        <p className="text-gray-400 mb-8">
          Unlock full access to analytics, team management, and real-time insights.
        </p>

        {/* PRICE */}
        <div className="mb-8">
          <p className="text-4xl font-semibold">
            £6
            <span className="text-sm text-gray-400"> / employee / month</span>
          </p>
        </div>

        {/* FEATURES */}
        <div className="text-left text-sm text-gray-400 space-y-2 mb-8">
          <p>✔ Unlimited employees</p>
          <p>✔ Advanced analytics</p>
          <p>✔ Multiple locations</p>
          <p>✔ Real-time tracking</p>
        </div>

        {/* CTA */}
        <button
          className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-medium transition"
        >
          Start Subscription
        </button>

        {/* BACK */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 text-sm text-gray-500 hover:text-white"
        >
          Back to dashboard
        </button>

      </div>

    </div>
  );
}

export default Upgrade;